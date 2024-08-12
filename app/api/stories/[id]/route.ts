import { NextRequest, NextResponse } from 'next/server';
import Story from '@/models/Story';
import connect from '@/utils/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connect();
  const { id } = params;

  try {
    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    }
    return NextResponse.json(story, { status: 200 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ message: 'Error fetching story', error: err.message }, { status: 500 });
  }
}
