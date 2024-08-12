This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, create a .env file. Create Gemini API key, three AWS S3 buckets, Mongo DB database and a Google Text to Speech credentials. Then add the following keys to the .env file:
-GOOGLE_ID=<your google ID>
-GOOGLE_SECRET=<your google secret for OAuth>
-NEXTAUTH_SECRET=<NextAUTH secret>
-MONGO_URL=<Mongo DB URL>
-GEMINI_API_KEY=<Gemini API key>
-GOOGLE_APPLICATION_CREDENTIALS=<Google App credentials for Text to Speech service>
-AWS_S3_REGION=<AWS region>
-AWS_S3_ACCESS_KEY_ID=<AWS S3 bucket Access key ID>
-AWS_S3_SECRET_ACCESS_KEY=<AWS S3 bucket secret access key>
-NEXT_PUBLIC_AWS_S3_EN_AUDIO_BUCKET_NAME=<AWS S3 bucket for storing english audio> 
-NEXT_PUBLIC_AWS_S3_HI_AUDIO_BUCKET_NAME=<AWS S3 bucket for storing hindi audio> 
-NEXT_PUBLIC_AWS_S3_COVER_IMAGE_BUCKET_NAME=<AWS S3 bucket for storing story images> 
-NEXT_PUBLIC_AWS_S3_REGION=<AWS region>
-NEXT_PUBLIC_BASE_URL=http://localhost:3000/


First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
