"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/i18n';

const languages = [
  { code: 'en', name: 'English', flag: '/flags/America.png' },
  { code: 'hi', name: 'Hindi', flag: '/flags/India.png' },
];

const LearnLanguage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [learnLanguage, setLearnLanguage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/register/${session.user.email}`);
          const userData = await response.json();

          if (response.ok) {
            const languageCode = userData.course?.instructLang || 'en';
            changeLanguage(languageCode); // Change the language based on the user's instructLang
          } else {
            console.error('Failed to fetch user data:', userData.message);
          }
        } catch (error: unknown) {
          console.error('Error fetching user data:', error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
          } else {
            console.error('Unknown error occurred');
          }
        }
      }
    };

    fetchUserData();
  }, [session]);

  const handleLanguageClick = async (language: { code: string; name: string; flag: string }) => {
    setLearnLanguage(language.code);
    try {
      if (!session?.user?.email) {
        throw new Error('User email is not available');
      }

      const response = await fetch(`/api/register/${session.user.email}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ learnLang: language.code, currentLevel: 0 }),
      });

      if (!response.ok) {
        throw new Error('Failed to update learn language');
      }

      router.push('/register/level');
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
      <h1 className="text-2xl font-bold mb-4">{t('select_language_to_learn')}</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {languages.map((language) => (
          <div
            key={language.code}
            className={`border rounded-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 bg-white ${
              learnLanguage === language.code ? 'border border-solid border-[#028F9E] shadow-lg bg-cyan-200' : 'border-gray-300'
            }`}
            onClick={() => handleLanguageClick(language)}
          >
            <img src={language.flag} alt={language.name} className="w-12 h-auto mx-auto mb-2" />
            <h2 className="text-lg font-semibold">{t(`languages.${language.code}`)}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearnLanguage;
