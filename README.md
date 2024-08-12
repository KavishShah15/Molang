This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, create a .env file. Create Gemini API key, three AWS S3 buckets, Mongo DB database and a Google Text to Speech credentials. Then add the following keys to the .env file:

-GOOGLE_ID= your google ID

-GOOGLE_SECRET= your google secret for OAuth

-NEXTAUTH_SECRET= NextAUTH secret

-MONGO_URL= Mongo DB URL

-GEMINI_API_KEY= Gemini API key

-GOOGLE_APPLICATION_CREDENTIALS= Google App credentials for Text to Speech service

-AWS_S3_REGION= AWS region

-AWS_S3_ACCESS_KEY_ID= AWS S3 bucket Access key ID

-AWS_S3_SECRET_ACCESS_KEY= AWS S3 bucket secret access key

-NEXT_PUBLIC_AWS_S3_EN_AUDIO_BUCKET_NAME= AWS S3 bucket for storing english audio

-NEXT_PUBLIC_AWS_S3_HI_AUDIO_BUCKET_NAME= AWS S3 bucket for storing hindi audio

-NEXT_PUBLIC_AWS_S3_COVER_IMAGE_BUCKET_NAME= AWS S3 bucket for storing story images

-NEXT_PUBLIC_AWS_S3_REGION= AWS region

-NEXT_PUBLIC_BASE_URL=http://localhost:3000/


Then, run the development server:

```bash
npm run dev
```
