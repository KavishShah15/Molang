import { NextRequest, NextResponse } from 'next/server';
import connect from '@/utils/db';
import User from '@/models/User';
import Course from '@/models/Course';
import { IUserModel } from '@/models/User';
import { ICourseModel } from '@/models/Course';

export async function GET(req: NextRequest, { params }: { params: { email: string } }) {
  await connect();

  const { email } = params;
  try {
    const user = await (User as IUserModel).findOne({ email });
    const course = await (Course as ICourseModel).findOne({ email });

    if (!user || !course) {
      return NextResponse.json({ message: 'User or Course not found' }, { status: 404 });
    }

    return NextResponse.json({ user, course }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching user or course', error: (error as Error).message }, { status: 500 });
  }
}
