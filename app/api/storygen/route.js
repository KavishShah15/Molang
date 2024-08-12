import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Story from '@/models/Story';
import connect from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust the import path accordingly

const apiKey = process.env.GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const s3Region = process.env.NEXT_PUBLIC_AWS_S3_REGION;
const s3BucketName = process.env.NEXT_PUBLIC_AWS_S3_COVER_IMAGE_BUCKET_NAME;

if (!apiKey) {
  throw new Error('API key is not defined in environment variables');
}
if (!openaiApiKey) {
  throw new Error('OpenAI API key is not defined in environment variables');
}
if (!s3Region) {
  throw new Error('S3 region is not defined in environment variables');
}
if (!s3BucketName) {
  throw new Error('S3 bucket name is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const s3Client = new S3Client({
  region: s3Region,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  },
});

async function uploadImageToS3(bucketName, fileName, fileContent) {
  const s3Params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: 'image/png',
  };

  const command = new PutObjectCommand(s3Params);
  await s3Client.send(command);
  return `https://${bucketName}.s3.${s3Region}.amazonaws.com/${fileName}`;
}

async function generateCoverImage(story, currentLearn) {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Define the art style and nationality context based on the language
  let artStyle = "similiar to the style of modern animated films. Characters should look cute, but not too childish";
  if (currentLearn === 'hi') {
    artStyle += ", depicting characters of Indian nationality";
  } else if (currentLearn === 'en') {
    artStyle += ", depicting characters of American or British nationality";
  }

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${story} in the style of ${artStyle}`,
    n: 1,
    size: "1024x1024",
  });

  return response.data[0].url;
}

export async function POST(req) {
  await connect();

  const session = await getServerSession({ req, ...authOptions });
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, currentInstruct, currentLearn, currentLevel } = await req.json();

  let storyPrompt = `You are a story generator. Please reset any previous context and generate a new story. The story should be written in ${currentLearn}. `;
  
  switch (currentLevel) {
      case 0:
          storyPrompt += `The story should be very simple and short (less than 100 words) as the user is new to the ${currentLearn} language. `;
          break;
      case 1:
          storyPrompt += `The story should be short (less than 200 words) and use simple language as the user knows some common words in ${currentLearn}. `;
          break;
      case 2:
          storyPrompt += `The story should be medium length (less than 300 words) and use words with intermediate level difficulties as the user can have basic conversations in ${currentLearn}. `;
          break;
      case 3:
          storyPrompt += `The story should be medium length (less than 400 words) and use high intermediate language but not too difficult, as the user can talk about various topics in ${currentLearn}. `;
          break;
      case 4:
          storyPrompt += `The story should be long (around 400 to 600 words) and use advanced language as the user can discuss most topics in detail in ${currentLearn}. `;
          break;
      default:
          storyPrompt += `The story should be appropriate for the user's level in ${currentLearn}. `;
  }

  storyPrompt += `Here is the prompt: ${prompt}`;

  try {
      // Generate the story content
      const result = await model.generateContent(storyPrompt);
      const response = await result.response;
      const story = await response.text();
      const storyWithMarkers = story.replace(/\n/g, ' ## '); // Replace newlines with paragraph markers

      // Generate a short story name in learnLang
      const learnNamePrompt = `Generate a short and catchy title in ${currentLearn} for the following story: ${story}. Provide only one title and do not suggest.`;
      const learnNameResult = await model.generateContent(learnNamePrompt);
      const learnNameResponse = await learnNameResult.response;
      const learnName = (await learnNameResponse.text()).trim();

      // Generate a short story name in instructLang
      const instructNamePrompt = `Generate a short and catchy title in ${currentInstruct} for the following story: ${story}. Provide only one title and do not suggest.`;
      const instructNameResult = await model.generateContent(instructNamePrompt);
      const instructNameResponse = await instructNameResult.response;
      const instructName = (await instructNameResponse.text()).trim();

      // Save story to database
      const newStoryId = uuidv4();
      const newStory = new Story({
          id: newStoryId,
          prompt,
          content: storyWithMarkers,
          level: currentLevel,
          instructLang: currentInstruct,
          learnLang: currentLearn,
          instructName,
          learnName,
          creator: session.user.email,
          published: true,
      });
      await newStory.save();

      // Generate cover image
      const imageUrl = await generateCoverImage(story, currentLearn);
      
      // Download the image and upload to S3
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);
      const s3Url = await uploadImageToS3(s3BucketName, `${newStoryId}.png`, imageBuffer);

      // Update story with cover image URL
      newStory.cover = s3Url;
      await newStory.save();

      return NextResponse.json({ story: storyWithMarkers, instructName, learnName, cover: s3Url }, { status: 201 });
  } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ message: 'Error generating story or image', error: error.message || 'An error occurred' }, { status: 500 });
  }
}
