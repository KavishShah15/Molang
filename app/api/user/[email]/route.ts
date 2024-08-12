import { NextRequest, NextResponse } from 'next/server';
import connect from '@/utils/db';
import User, { IUserModel } from '@/models/User';

const UserModel = User as IUserModel;

export async function GET(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching user', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  const { instructLang, learnLang, currentLevel } = await req.json();

  if (!instructLang || !learnLang || currentLevel === undefined) {
    return NextResponse.json({ message: 'instructLang, learnLang, and currentLevel are required' }, { status: 400 });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.currentInstruct = instructLang;
    user.currentLearn = learnLang;
    user.currentLevel = currentLevel;
    await user.save();

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Error updating user', error: (error as Error).message }, { status: 500 });
  }
}
