import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { story } = await req.json();

  if (!story) {
    return NextResponse.json({ message: 'Story is required' }, { status: 400 });
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: story,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;

    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error generating image:', error);
      return NextResponse.json({ message: 'Error generating image', error: error.message }, { status: 500 });
    } else {
      // Handle case where the error is not an instance of Error
      console.error('Unknown error occurred:', error);
      return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 });
    }
  }
}
