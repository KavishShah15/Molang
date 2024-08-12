import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import connect from '@/utils/db';
import HiEnDict, { IHiEnDictModel } from '@/models/HiEnDict';
import EnHiDict, { IEnHiDictModel } from '@/models/EnHiDict';
import { config } from 'dotenv';

config(); // Load environment variables

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const ttsClient = new TextToSpeechClient();

// Configure AWS SDK v3 S3 Client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

async function checkFileExists(bucketName: string, fileName: string): Promise<boolean> {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: fileName,
  });

  const response = await s3Client.send(command);
  return response.Contents?.some((item) => item.Key === fileName) || false;
}

async function generateUniqueFileName(term: string, bucketName: string): Promise<string> {
  const baseFileName = `${term.replace(/\s+/g, '_').toLowerCase()}.mp3`;
  let uniqueFileName = baseFileName;
  let fileExists = await checkFileExists(bucketName, uniqueFileName);
  let counter = 1;

  // Generate a unique name if the file already exists
  while (fileExists) {
    uniqueFileName = `${term.replace(/\s+/g, '_').toLowerCase()}_${counter}.mp3`;
    fileExists = await checkFileExists(bucketName, uniqueFileName);
    counter++;
  }

  return uniqueFileName;
}

async function generateAudio(term: string, currentLearn: string): Promise<string> {
  let voiceConfig: any;
  let bucketName: string | undefined;

  if (currentLearn === 'en') {
    voiceConfig = {
      languageCode: 'en-US',
      name: 'en-US-Standard-H',
      ssmlGender: 'FEMALE',
    };
    bucketName = process.env.NEXT_PUBLIC_AWS_S3_EN_AUDIO_BUCKET_NAME;
  } else if (currentLearn === 'hi') {
    voiceConfig = {
      languageCode: 'hi-IN',
      name: 'hi-IN-Standard-D',
      ssmlGender: 'FEMALE',
    };
    bucketName = process.env.NEXT_PUBLIC_AWS_S3_HI_AUDIO_BUCKET_NAME;
  } else {
    throw new Error('Unsupported language.');
  }

  if (!bucketName) {
    throw new Error('Bucket name is not defined.');
  }

  const baseFileName = `${term.replace(/\s+/g, '_').toLowerCase()}.mp3`;

  if (await checkFileExists(bucketName, baseFileName)) {
    const s3Url = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${baseFileName}`;
    console.log(`Audio file already exists in S3: ${s3Url}`); // Log the S3 URL
    return s3Url;
  }

  const request = {
    input: { text: term },
    voice: voiceConfig,
    audioConfig: { audioEncoding: 'MP3' as any }, // Use 'any' to bypass type issues
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request as any); // Cast request to 'any'

    // Generate a unique filename based on the term
    const audioFileName = await generateUniqueFileName(term, bucketName);

    // Upload the audio file to S3
    const s3Params = {
      Bucket: bucketName,
      Key: audioFileName,
      Body: response.audioContent as Uint8Array, // Ensure audioContent is of type Uint8Array
      ContentType: 'audio/mpeg',
    };

    const command = new PutObjectCommand(s3Params);
    await s3Client.send(command);
    const s3Url = `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${audioFileName}`;

    console.log(`Audio file uploaded to S3: ${s3Url}`); // Log the S3 URL
    return s3Url;
  } catch (error) {
    console.error('ERROR generating audio:', error);
    throw new Error('Failed to generate speech');
  }
}

export async function POST(req: NextRequest) {
  await connect();
  const { text, currentInstruct, currentLearn } = await req.json();

  const generationConfig = {
    temperature: 0.1,
    topP: 0.9,
  };

  function removeTicks(str: string): string {
    return str.replace(/`/g, '');
  }

  try {
    // Determine the correct dictionary to use
    let DictModel: IHiEnDictModel | IEnHiDictModel;
    if (currentInstruct === 'en' && currentLearn === 'hi') {
      DictModel = HiEnDict as IHiEnDictModel;
    } else if (currentInstruct === 'hi' && currentLearn === 'en') {
      DictModel = EnHiDict as IEnHiDictModel;
    } else {
      throw new Error('Unsupported language pair.');
    }

    // Check if the term already exists in the appropriate dictionary
    const existingTerms = await DictModel.find({ term: text });

    if (existingTerms.length > 0) {
      console.log(`Term "${text}" found in dictionary.`);
      return NextResponse.json({ result: existingTerms });
    }

    console.log(`Term "${text}" not found in dictionary. Generating...`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro', generationConfig });
    const context = `
      You are a language teacher who explains notable words, idioms, and grammar concepts in the highlighted text.
      Your task is to provide the definition and examples of how to use those words, idioms, or grammar concepts in other situations.
      Categorize each notable item as "word", "idiom", or "grammar". However, if the instructional language is ${currentInstruct}, use the corresponding word in that language. For instance, if ${currentInstruct} is "vi", "word" becomes "từ vựng", "idiom" becomes "thành ngữ", and "grammar" becomes "ngữ pháp".
      For each word or idiom, provide its pronunciation (pinyin for Chinese, romanized for Hindi, phonetic for English).
      For each word, define its part of speech (noun, adjective, verb, adverb, conjunction, etc.). Provide the equivalent terms in ${currentInstruct}. For instance, if ${currentInstruct} is "vi", "noun" becomes "danh từ", "adjective" becomes "tính từ", and so on.
      If a term has multiple parts of speech (e.g., both noun and verb), create separate entries for each part of speech, each with its own definition, usage, and other forms.
      When providing a term's definition, provide all potential meanings of the term in ${currentInstruct} in a numbered list format (1. meaning 1, 2. meaning 2, etc.).
      When providing a term's usage in a sentence, ensure that the sentence is in the same language as the term and followed by the ${currentInstruct} translation of the sentence in parentheses.
      Ensure that examples for terms in different languages do not mix languages in a single sentence.
      Use the following format to provide the response. Use "currentInstruct" for all explanations, term definitions, categories, and part of speech determinations, and "currentLearn" for term identification:

      {
        "result": [
          {
            "category": "category in ${currentInstruct}",
            "term": "term",
            "pronunciation": "pronunciation",  // only if category is word or idiom
            "partOfSpeech": "part of speech in ${currentInstruct}",  // only if category is word
            "definition": "1. meaning 1 2. meaning 2 3. meaning 3 in ${currentInstruct}",
            "usage": "usage in a sentence",
            "otherForms": {  // only if category is word and other forms exist
              "noun": "form",
              "verb": "form",
              "adjective": "form",
              // other forms
            },
            "explanation": "explanation in ${currentInstruct}",  // only if category is grammar
          },
          // More entries if term has multiple parts of speech
        ]
      }

      Here is the text: "${text}"

      Important: Ensure all categories, explanations, definitions, and part of speech determinations are provided in the "${currentInstruct}" language. Use the instructional language "${currentInstruct}" for every part of the response except the term identification, which should be in the "${currentLearn}" language. Provide all potential meanings for definitions in a numbered list format and create separate entries for each part of speech if applicable.
    `;

    const result = await model.generateContent(context);
    const response = await result.response;
    const textResponse = await response.text();

    const jsonStringMatch = textResponse.match(/{[\s\S]*}/);
    if (!jsonStringMatch) {
      throw new Error('Failed to extract JSON string from response');
    }

    const jsonString = jsonStringMatch[0].trim();
    const parsedResponse = JSON.parse(removeTicks(jsonString));
    const filteredResponse = parsedResponse.result.filter((item: any) => item.category !== 'phrase');

    // Generate audio for each term and append the audio URL
    for (const item of filteredResponse) {
      if (item.category !== 'grammar') {
        item.audio = await generateAudio(item.term, currentLearn);
      }
    }

    const jsonResponse = { result: filteredResponse };

    // Post to the appropriate dictionary
    for (const item of filteredResponse) {
      const dictItem = new DictModel({
        category: item.category,
        term: item.term,
        pronunciation: item.pronunciation,
        partOfSpeech: item.partOfSpeech,
        definition: item.definition,
        usage: item.usage,
        otherForms: item.otherForms,
        explanation: item.explanation,
        audio: item.audio,
      });

      await dictItem.save();
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error occurred:', error); // Log error
    return NextResponse.json({ error: 'An error occurred while generating content.' }, { status: 500 });
  }
}
