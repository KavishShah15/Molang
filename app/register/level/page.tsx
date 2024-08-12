"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';

const proficiencyOptions = [
  { id: 0, label: 'A1: I’m new to the language.' },
  { id: 1, label: 'A2: I know some common words.' },
  { id: 2, label: 'B1: I can have basic conversations.' },
  { id: 3, label: 'B2: I can talk about various topics.' },
  { id: 4, label: 'C1: I can discuss most topics.' },
  { id: 5, label: 'C2: I can express myself fluently.' }
];

const SelectLevel = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const handleLevelClick = async (level: { id: number; label: string }) => {
    setSelectedLevel(level.id);

    try {
      if (!session?.user?.email) {
        throw new Error('User email is not available');
      }

      const response = await fetch(`/api/register/${session.user.email}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level: level.id, currentLevel: level.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update level');
      }

      router.push('/learn');
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
      <h1 className="text-2xl font-bold mb-4">{t('select_level')}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {proficiencyOptions.map((level) => (
          <div
            key={level.id}
            className={`border rounded-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 ${
              selectedLevel === level.id ? 'border border-solid border-[#028F9E] shadow-lg bg-cyan-200' : 'border-gray-300'
            }`}
            onClick={() => handleLevelClick(level)}
          >
            <h2 className="text-lg font-semibold mb-2">{level.label.split(':')[0]}</h2>
            <p>{level.label.split(': ')[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectLevel;
