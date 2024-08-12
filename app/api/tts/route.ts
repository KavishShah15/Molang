import { NextResponse } from 'next/server';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { NextRequest } from 'next/server';

const client = new TextToSpeechClient();

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Standard-H',
      ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE,
    },
    audioConfig: { audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3 },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);

    // Save the audio content to a file
    const audioFileName = path.join(process.cwd(), 'public', 'output.mp3');
    await promisify(fs.writeFile)(audioFileName, response.audioContent as Buffer, 'binary');

    return NextResponse.json({ audioUrl: '/output.mp3' });
  } catch (error) {
    console.error('ERROR:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
