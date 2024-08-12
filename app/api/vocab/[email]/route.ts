import { NextRequest, NextResponse } from 'next/server';
import connect from '@/utils/db';
import Course, { ICourseModel } from '@/models/Course';

const CourseModel = Course as ICourseModel;

export async function GET(req: NextRequest, { params }: { params: { email: string } }) {
    await connect();

    const email = params.email;
    const instructLang = req.nextUrl.searchParams.get('instructLang');
    const learnLang = req.nextUrl.searchParams.get('learnLang');

    if (!instructLang || !learnLang) {
        return NextResponse.json({ message: 'instructLang and learnLang query parameters are required' }, { status: 400 });
    }

    try {
        const course = await CourseModel.findOne({ email, instructLang, learnLang });

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ learnVocab: course.learnVocab }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching course', error: (error as Error).message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { email: string } }) {
    const { email } = params;
    const instructLang = req.nextUrl.searchParams.get('instructLang');
    const learnLang = req.nextUrl.searchParams.get('learnLang');
    const { token, uniqueTokens, decrementToken }: { token?: string; uniqueTokens?: string[]; decrementToken?: string } = await req.json();

    if (!instructLang || !learnLang || (!token && !uniqueTokens && !decrementToken)) {
        return NextResponse.json({ message: 'instructLang, learnLang, and token or uniqueTokens or decrementToken are required' }, { status: 400 });
    }

    await connect();

    try {
        const course = await CourseModel.findOne({ email, instructLang, learnLang });

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        if (token) {
            const lowerCaseToken = token.toLowerCase();

            // Remove the token from masterVocab case-insensitively
            course.masterVocab = course.masterVocab.filter((t: string) => t.toLowerCase() !== lowerCaseToken);

            // Add the token to learnVocab with an initial value of 0 case-insensitively
            course.learnVocab.set(lowerCaseToken, 0);
        }

        if (uniqueTokens) {
            // Ensure unique tokens and correct format
            const lowerCaseLearnVocab = new Set([...course.learnVocab.keys()].map((t: string) => t.toLowerCase()));
            const filteredTokens = uniqueTokens.map((t: string) => t.toLowerCase()).filter((t: string) => !lowerCaseLearnVocab.has(t));
            const updatedMasterVocab = Array.from(new Set([...course.masterVocab, ...filteredTokens]));

            course.masterVocab = updatedMasterVocab;

            // Increment values in learnVocab if they appear in uniqueTokens
            uniqueTokens.forEach((token: string) => {
                const lowerCaseToken = token.toLowerCase();
                if (course.learnVocab.has(lowerCaseToken)) {
                    const currentCount = course.learnVocab.get(lowerCaseToken) || 0;
                    const newCount = currentCount + 1;
                    if (newCount >= 5) {
                        // Move the token back to masterVocab
                        course.learnVocab.delete(lowerCaseToken);
                        course.masterVocab.push(lowerCaseToken);
                    } else {
                        course.learnVocab.set(lowerCaseToken, newCount);
                    }
                }
            });
        }

        if (decrementToken) {
            const lowerCaseToken = decrementToken.toLowerCase();
            if (course.learnVocab.has(lowerCaseToken)) {
                const currentCount = course.learnVocab.get(lowerCaseToken) || 0;
                if (currentCount > 0) {
                    course.learnVocab.set(lowerCaseToken, currentCount - 1);
                }
            }
        }

        await course.save();

        return NextResponse.json({ message: 'Vocab updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating vocab:', error);
        return NextResponse.json({ message: 'Error updating vocab', error: (error as Error).message }, { status: 500 });
    }
}
