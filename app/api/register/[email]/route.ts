import { NextRequest, NextResponse } from 'next/server';
import connect from '@/utils/db';
import User from '@/models/User';
import Course from '@/models/Course';
import { IUserModel } from '@/models/User';
import { ICourseModel } from '@/models/Course';

const UserModel = User as IUserModel;
const CourseModel = Course as ICourseModel;

export async function GET(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  try {
    const user = await UserModel.findOne({ email });
    const courses = await CourseModel.find({ email });

    if (!user || !courses) {
      return NextResponse.json({ message: 'User or Courses not found' }, { status: 404 });
    }

    return NextResponse.json({ user, courses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching user or courses', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  const { instructLang, learnLang, level = 0 } = await req.json();

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const course = new CourseModel({
      email,
      instructLang,
      learnLang,
      level,
    });

    await course.save();

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating course', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  const { instructLang, learnLang, level } = await req.json();

  try {
    const user = await UserModel.findOne({ email });
    const course = await CourseModel.findOne({ email });

    if (!user || !course) {
      return NextResponse.json({ message: 'User or Course not found' }, { status: 404 });
    }

    if (instructLang) {
      course.instructLang = instructLang;
      user.currentInstruct = instructLang;
    }

    if (learnLang) {
      course.learnLang = learnLang;
      user.currentLearn = learnLang;
    }

    if (level !== undefined) {
      course.level = level;  // Ensure level is set to the selected level
      user.currentLevel = level;  // Ensure currentLevel is set to the selected level
    }

    await course.save();
    await user.save();

    return NextResponse.json({ user, course }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating user or course', error: (error as Error).message }, { status: 500 });
  }
}
