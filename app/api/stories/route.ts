import { NextRequest, NextResponse } from 'next/server';
import Story from '@/models/Story';
import connect from '@/utils/db';

export async function GET(req: NextRequest) {
  await connect();

  const { searchParams } = new URL(req.url);
  const instructLang = searchParams.get('instructLang');
  const learnLang = searchParams.get('learnLang');
  const creator = searchParams.get('creator');

  const filter: {
    instructLang?: string;
    learnLang?: string;
    creator?: string;
  } = {};

  if (instructLang) filter.instructLang = instructLang;
  if (learnLang) filter.learnLang = learnLang;
  if (creator) filter.creator = creator;

  try {
    const stories = await Story.find(filter);
    return NextResponse.json(stories, { status: 200 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ message: 'Error fetching stories', error: err.message }, { status: 500 });
  }
}
