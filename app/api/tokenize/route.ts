import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AggressiveTokenizer, AggressiveTokenizerHi } from 'natural/lib/natural/tokenizers';
import { config } from 'dotenv';
import * as stringSimilarity from 'string-similarity';

config();

export async function POST(req: Request) {
  const { text, language } = await req.json();
  console.log('Received text:', text); // Log received text

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  const generationConfig = {
    temperature: 0.1,
    topP: 0.9,
  };

  function extractIdiomsFromText(responseText: string): string[] {
    const idiomPattern = /\*\*([^*]+)\*\*/g;
    const matches: string[] = [];
    let match;
    while ((match = idiomPattern.exec(responseText)) !== null) {
      const idiom = match[1].trim().replace(/:$/, '');
      matches.push(idiom.charAt(0).toLowerCase() + idiom.slice(1));
    }
    return matches;
  }

  function tokenizeWithIdioms(text: string, idioms: string[], tokenizer: any): string[] {
    let remainingText = text;
    const tokens = [];

    while (remainingText.length > 0) {
      let matchedIdiom = null;
      let idiomStartIndex = -1;

      // Find the first occurring idiom in the remaining text using fuzzy matching
      for (const idiom of idioms) {
        const index = remainingText.toLowerCase().indexOf(idiom.toLowerCase());
        if (index !== -1 && (idiomStartIndex === -1 || index < idiomStartIndex)) {
          matchedIdiom = idiom;
          idiomStartIndex = index;
        }
      }

      if (matchedIdiom && idiomStartIndex !== -1) {
        if (idiomStartIndex > 0) {
          // Tokenize the part before the idiom
          const beforeIdiom = remainingText.substring(0, idiomStartIndex);
          tokens.push(...tokenizeAndPreservePunctuation(beforeIdiom, tokenizer));
        }

        // Add the idiom as a single token
        tokens.push(matchedIdiom);
        remainingText = remainingText.substring(idiomStartIndex + matchedIdiom.length);
      } else {
        // Tokenize the remaining text if no more idioms are found
        tokens.push(...tokenizeAndPreservePunctuation(remainingText, tokenizer));
        break;
      }
    }

    return tokens;
  }

  function tokenizeAndPreservePunctuation(text: string, tokenizer: any) {
    const punctuationPattern = /[.,:;!?¿¡。！？、。"”“‘’'()\[\]{}<>%@&#\s]|"|\s##\s/g;
    const tokensWithPunctuation = [];
    let match;
    let lastIndex = 0;
  
    // Find all punctuation and special markers
    while ((match = punctuationPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const part = text.substring(lastIndex, match.index);
        const tokens = tokenizer.tokenize(part);
        tokensWithPunctuation.push(...tokens);
      }
      tokensWithPunctuation.push(match[0].trim());
      lastIndex = match.index + match[0].length;
    }
  
    if (lastIndex < text.length) {
      const part = text.substring(lastIndex);
      const tokens = tokenizer.tokenize(part);
      tokensWithPunctuation.push(...tokens);
    }
  
    return tokensWithPunctuation;
  }  

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro', generationConfig });
    console.log('Model initialized with config:', generationConfig); // Log model initialization

    const context = `
      Identify any idioms and phrasal verbs in the following text. The idioms and phrasal verbs can be in any languages. Enclose each identified idiom and phrasal verb in double asterisks (**). Do not include these 2 items 'phrasal verbs' and 'idioms' as items on the list.
      Here is the text: "${text}"
    `;
    console.log('Generated context:', context); // Log generated context

    const result = await model.generateContent(context);
    console.log('Generated content result:', result); // Log raw result

    const response = await result.response;
    console.log('Model response:', response); // Log model response

    const textResponse = await response.text();
    console.log('Text response:', textResponse); // Log text response

    const idioms = extractIdiomsFromText(textResponse);
    console.log('Extracted idioms:', idioms); // Log extracted idioms

    // Select the appropriate tokenizer based on the language
    let tokenizer;
    if (language === 'en') {
      tokenizer = new AggressiveTokenizer();
    } else if (language === 'hi') {
      tokenizer = new AggressiveTokenizerHi();
    } else {
      return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 });
    }

    // Tokenize the text while preserving idioms as single tokens
    const tokenizedText = tokenizeWithIdioms(text, idioms, tokenizer);

    const jsonResponse = { tokens: tokenizedText, idioms };
    console.log('Final JSON response:', jsonResponse); // Log final JSON response

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error occurred:', error); // Log error
    return NextResponse.json({ error: 'An error occurred while generating content.' }, { status: 500 });
  }
}


