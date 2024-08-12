import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
 throw new Error('API key is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: "You are a friendly Hindi language tutor. You help the user with queries they have about their language learning journey in Hindi." });
const translate_model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: "You are a translator. Your task is to just translate the given text into a specified language. Output should just be the translated text, do not add any other information or text." });
const hint_model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: "You are a language coach. Your task is to give a suggest two plausible response options that the user can give given the chat history. Limit yourself to 2 options only and format your options in JSON format as: {0:<Response Option 1>, 1: <Response Option 2>}" });
const drills_model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: "You are a Hindi tutor who is an expert at generating practice questions for students to practice. Follow the user's instructions to generate questions, options and correct answer to the questions. Your response should be in the following JSON format: {<Question number>:{question: <question>, correct_ans: <correct answer>, options: <options>}}" });

const formatHistory = (history: any[]) => {
    return history.map(chat => ({
      role: chat.role,
      parts: [{ text: chat.content }]
    }));
};

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { message, history, translate, drill, topic, expertise } = body;

    if (translate) {
      return translateMessage(message, translate);
    }
   
    if (drill) {
      return generateDrill(expertise, history);
    }
   
    if (!history || history.length === 0) {
      return startChat(message);
    } else {
      return continueChat(message, history);
    }
}

async function startChat(message: string) {
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });
   
    try {
      const result = await chat.sendMessage(message);
      const response_txt = await result.response.text();
      const newHistory = [
        { role: 'user', content: message },
        { role: 'model', content: response_txt },
      ];
      return NextResponse.json({
        response: response_txt,
        history: newHistory,
      }, { status: 201 });
    } catch (error: unknown) {
      console.error('Error calling Gemini AI API:', error);
      if (error instanceof Error) {
        return NextResponse.json({ message: 'Error calling Gemini AI API', error: error.message }, { status: 500 });
      } else {
        return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
      }
    }
}

async function continueChat(message: string, history: any[]) {
    const formattedHistory = formatHistory(history);
    const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
        maxOutputTokens: 100,
        },
    });
    try {
        const result = await chat.sendMessage(message);
        const response_txt = await result.response.text();
        const newHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'model', content: response_txt },
        ];
        return NextResponse.json({ response: response_txt, history: newHistory }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error calling Gemini AI API:', error);
        if (error instanceof Error) {
          return NextResponse.json({ message: 'Error calling Gemini AI API', error: error.message }, { status: 500 });
        } else {
          return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
        }
    }
}

async function translateMessage(message: string, targetLang: string) {
    const prompt = `Translate this text to ${targetLang}:"${message}"`;
    try {
        const result = await translate_model.generateContent(prompt);
        const response = await result.response;
        const translatedMessage = await response.text();
        return NextResponse.json({ translatedMessage }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error calling Gemini AI API:', error);
        if (error instanceof Error) {
          return NextResponse.json({ message: 'Error calling Gemini AI API', error: error.message }, { status: 500 });
        } else {
          return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
        }
    }
}

async function generateDrill(expertise: BigInteger, history: any[]) {
    const prompt = `Generate a practice question for a student learning Hindi at a ${expertise} level. The question should focus on topics raised by the user in the recent chat history.\
    Please follow these guidelines:\
    Only use Multiple choice and Fill in the blank question\
    Ensure the question covers the following aspects: Vocabulary, Grammar, Sentence structure, Idiomatic expressions (if appropriate for the level)\
    Provide a brief context or scenario for each question when applicable.\
    Include the correct answer for each question.\
    Vary the difficulty within the specified proficiency level.\
    The question should be different from previous practice questions in the chat history. Also, if the user has answered the question correctly try to make the new questions slightly harder.\
    Use culturally relevant content when possible to enhance engagement.\
    Keep in mind the user's Hindi proficiency level: ${expertise}\
    Format your response should be be a JSON. The JSON should be as follows: {'Question':<question>, 'Options':<list of options for the question>, 'CorrectAnswer':<correct answer to the question>}\
    Please generate the question now`;

    const formattedHistory = formatHistory(history);
    const chat = drills_model.startChat({
        history: formattedHistory,
        generationConfig: {
        maxOutputTokens: 200,
        },
    });

    try {
        const result = await chat.sendMessage(prompt);
        const response_txt = await result.response.text();

        const questionData = extractQuestionData(response_txt);

        if (!questionData) {
            throw new Error('Failed to extract question data from response');
        }

        const cleanedOptions = questionData.options.map(str =>  str.replace(/^["']|["']$/g, ''));

        return NextResponse.json({ question: questionData.question, options: cleanedOptions, correctAnswer: questionData.correctAnswer }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error calling Gemini AI API:', error);
        if (error instanceof Error) {
          return NextResponse.json({ message: 'Error calling Gemini AI API', error: error.message }, { status: 500 });
        } else {
          return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
        }
    }
}

function extractQuestionData(jsonString: string) {
    const regex = /['"]Question['"]:\s*['"](.*?)['"],\s*['"]Options['"]:\s*\[(['"].*?['"](?:,\s*['"].*?['"])*)\],\s*['"]CorrectAnswer['"]:\s*['"](.*?)['"]/g;
    const match = regex.exec(jsonString);
  
    if (match !== null) {
      const question = match[1];
      const options = match[2].split(',').map(option => option.trim().replace(/"/g, ''));
      const correctAnswer = match[3];
  
      return {
        question,
        options,
        correctAnswer,
      };
    } else {
      return null;
    }
}
