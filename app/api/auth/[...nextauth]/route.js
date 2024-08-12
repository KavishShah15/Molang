import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import User from '@/models/User';
import Course from '@/models/Course';
import connect from '@/utils/db';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connect();
        try {
          const existingUser = await User.findOne({ email: user.email });
          const existingCourse = await Course.findOne({ email: user.email });

          if (!existingUser) {
            const newUser = new User({
              email: user.email,
              name: user.name, // Save the user's name from the session
              role: 'user',
            });
            await newUser.save();
          } else {
            // Update the user's name if it is not set
            if (!existingUser.name) {
              existingUser.name = user.name;
              await existingUser.save();
            }
          }

          if (!existingCourse) {
            const newCourse = new Course({
              email: user.email,
              role: 'user',
            });
            await newCourse.save();
          }

          return true;
        } catch (err) {
          console.log('Error saving user', err);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        await connect();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.name = token.name;
      }
      return session;
    },
  },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
