"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const languages = [
  { code: 'en', name: 'English', displayName: 'English', flag: '/flags/America.png' },
  { code: 'hi', name: 'Hindi', displayName: 'हिंदी', flag: '/flags/India.png' },
];

const InstructLanguage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [nativeLanguage, setNativeLanguage] = useState<string>('');

  const handleLanguageClick = async (language: { code: string; name: string; displayName: string; flag: string }) => {
    setNativeLanguage(language.code);
    try {
      if (!session?.user?.email) {
        throw new Error('User email is not available');
      }

      const response = await fetch(`/api/register/${session.user.email}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instructLang: language.code }),
      });

      if (!response.ok) {
        throw new Error('Failed to update native language');
      }

      router.push('/register/learnLanguage');
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen bg-[#06B6D4] bg-opacity-10">
      <h1 className="text-2xl font-bold mb-4">Step 1: Select Your Native Language</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {languages.map((language) => (
          <div
            key={language.code}
            className={`border rounded-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 bg-white  ${
              nativeLanguage === language.code ? 'border border-solid border-[#028F9E] shadow-lg bg-cyan-200' : 'border-gray-300'
            }`}
            onClick={() => handleLanguageClick(language)}
          >
            <img src={language.flag} alt={language.name} className="w-12 h-auto mx-auto mb-2" />
            <h2 className="text-lg font-semibold">{language.displayName}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructLanguage;
