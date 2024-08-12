import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const translateApiKey = process.env.TRANSLATE_API_KEY;
let req_counter = 0;

if (!apiKey) {
  throw new Error('API key is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

interface ChatHistory {
  role: string;
  content: string;
}

const formatHistory = (history: ChatHistory[]) => {
  return history.map(chat => ({
    role: chat.role,
    parts: [{ text: chat.content }]
  }));
};

const createModel = (instruction: string) => {
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    systemInstruction: instruction 
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, translate, hint, currentInstruct, currentLearn, currentLevel } = body;

    console.log('Received POST request');
    console.log('currentInstruct:', currentInstruct);
    console.log('currentLearn:', currentLearn);
    console.log('currentLevel:', currentLevel);

    const baristaModel = createModel(`You are a barista. You are interacting with a customer and you always speak in ${currentLearn}.`);
    const translatorModel = createModel(`You are a translator. Your task is to just translate the given text into ${currentInstruct}. Output should just be the translated text, do not add any other information or text.`);
    const hintModel = createModel(`You are a language coach. The user is interacting with a barista in ${currentLearn}. Your task is to give two plausible response options that the user can give given the chat history. Your suggestion must always be in ${currentLearn}. Limit yourself to 2 options only and format your options in JSON format as: {0:<Response Option 1>, 1: <Response Option 2>}`);

    if (translate) {
      return translateMessage(message, translate, translatorModel);
    }

    if (hint) {
      return giveHint(history, hintModel);
    }

    if (!history || history.length === 0) {
      return startChat(message, baristaModel);
    } else {
      return continueChat(message, history, baristaModel);
    }
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ message: 'Error processing request', error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    if (!email) {
      throw new Error('Email is required');
    }

    const { currentInstruct, currentLearn } = await fetchUserData(email);

    console.log('Received GET request');
    console.log('currentInstruct:', currentInstruct);
    console.log('currentLearn:', currentLearn);

    const hintModel = createModel(`You are a language coach. The user is interacting with a barista in ${currentLearn}. Your task is to give three plausible response options that the user can give given the chat history. Your suggestion must always be in ${currentLearn}. Limit yourself to 3 options only and format your options in JSON format as: {0:<Response Option 1>, 1: <Response Option 2>, 2: <Response Option 3>}`);

    const chat = hintModel.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 50,
      },
    });

    const result = await chat.sendMessage(`Generate three initial hints to help a user start a conversation with a barista in ${currentLearn}. No need for further explanation, as if the user is fluent in ${currentLearn} and can start the conversation by themselves. Provide the hints in JSON format: {0:<Hint 1>, 1:<Hint 2>, 2:<Hint 3>}`);
    const response_txt = await result.response.text();
    
    console.log('Hint response:', response_txt);

    const regex = /"([^"]*)"/g;
    const matches = response_txt.match(regex);

    if (matches) {
      const extractedTexts = matches.map(match => match.slice(1, -1));
      return NextResponse.json({ hints: extractedTexts }, { status: 200 });
    } else {
      console.error("No hints found");
      return NextResponse.json({ hints: [] }, { status: 200 }); // Return an empty array instead of error
    }
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ message: 'Error processing request', error: (error as Error).message }, { status: 500 });
  }
}

async function startChat(message: string, model: any) {
  console.log('Starting chat with message:', message);

  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  try {
    const result = await chat.sendMessage(message);
    const response_txt = await result.response.text();
    console.log('Start chat response:', response_txt);

    const newHistory = [
      { role: 'user', content: message },
      { role: 'model', content: response_txt },
    ];
    return NextResponse.json({
      response: response_txt,
      history: newHistory,
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting chat:', error);
    return NextResponse.json({ message: 'Error starting chat', error: (error as Error).message }, { status: 500 });
  }
}

async function continueChat(message: string, history: ChatHistory[], model: any) {
  console.log('Continuing chat with message:', message);

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
    console.log('Continue chat response:', response_txt);

    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'model', content: response_txt },
    ];
    return NextResponse.json({ response: response_txt, history: newHistory }, { status: 201 });
  } catch (error) {
    console.error('Error continuing chat:', error);
    return NextResponse.json({ message: 'Error continuing chat', error: (error as Error).message }, { status: 500 });
  }
}

async function translateMessage(message: string, targetLang: string, model: any) {
  console.log('Translating message:', message);
  console.log('targetLang:', targetLang);

  const y = req_counter++;
  console.log(y);
  const prompt = `Translate this text to ${targetLang}:"${message}"`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    console.log('Translate response:', response);

    return NextResponse.json({ translatedMessage: response }, { status: 200 });
  } catch (error) {
    console.error('Error translating message:', error);
    return NextResponse.json({ message: 'Error translating message', error: (error as Error).message }, { status: 500 });
  }
}

async function giveHint(history: ChatHistory[], model: any) {
  console.log('Giving hint based on history:', history);

  const formattedHistory = formatHistory(history);

  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  try {
    const result = await chat.sendMessage(`Given the chat history, suggest two plausible response options that the user can use. Limit yourself to 2 options only and format your options in JSON format as: {0:<Response Option 1>, 1: <Response Option 2>}`);
    const response_txt = await result.response.text();
    console.log('Hint response:', response_txt);

    const regex = /"([^"]*)"/g;
    const matches = response_txt.match(regex);

    if (matches) {
      const extractedTexts = matches.map(match => match.slice(1, -1));
      console.log('Extracted hints:', extractedTexts);
      return NextResponse.json({ message: extractedTexts }, { status: 201 });
    } else {
      console.error("No hints found");
      return NextResponse.json({ message: [] }, { status: 404 }); // Return an empty array instead of error
    }
  } catch (error) {
    console.error('Error giving hint:', error);
    return NextResponse.json({ message: 'Error giving hint', error: (error as Error).message }, { status: 500 });
  }
}

async function fetchUserData(email: string) {
  console.log('Fetching user data for email:', email);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/${email}`);
  const data = await response.json();
  if (response.ok) {
    console.log('Fetched user data:', data);
    return data;
  } else {
    console.error('Error fetching user data:', data.message);
    throw new Error(data.message);
  }
}