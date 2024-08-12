"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Option {
  id: number;
  label: string;
  description?: string;
}

const goalOptions: Option[] = [
  { id: 1, label: '5 min / day', description: 'Casual' },
  { id: 2, label: '10 min / day', description: 'Regular' },
  { id: 3, label: '15 min / day', description: 'Serious' },
  { id: 4, label: '20 min / day', description: 'Intense' },
];

const proficiencyOptions: Option[] = [
  { id: 1, label: 'I’m new to Chinese' },
  { id: 2, label: 'I know some common words' },
  { id: 3, label: 'I can have basic conversations' },
  { id: 4, label: 'I can talk about various topics' },
  { id: 5, label: 'I can discuss most topics in detail' },
];

const topicOptions: Option[] = [
  { id: 1, label: 'Travel' },
  { id: 2, label: 'Food' },
  { id: 3, label: 'Education' },
  { id: 4, label: 'Family' },
  { id: 5, label: 'Movies' },
  { id: 6, label: 'Music' },
  { id: 7, label: 'Fitness' },
  { id: 8, label: 'Relationships' },
  { id: 9, label: 'Science' },
  { id: 10, label: 'Philosophy' },
  { id: 11, label: 'Politics' },
  { id: 12, label: 'Business' },
  { id: 13, label: 'Nature' },
  { id: 14, label: 'Gaming' },
  { id: 15, label: 'Mental Health' },
  { id: 16, label: 'TV Shows' },
];

const activityOptions: Option[] = [
  { id: 1, label: 'AI Chat' },
  { id: 2, label: 'Roleplay AI Chat' },
  { id: 3, label: 'Text with Anyone' },
  { id: 4, label: 'Mini Stories' },
  { id: 5, label: 'Mini Games' },
  { id: 6, label: 'Lessons' },
];

interface SelectedOptions {
  step1: number | null;
  step2: number | null;
  step3: number[];
  step4: number[];
  step5: number[];
}

const MultiStepForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    step1: null,
    step2: null,
    step3: [],
    step4: [],
    step5: [],
  });

  const nextStep = () => setStep(prevStep => Math.min(prevStep + 1, 5));
  const prevStep = () => setStep(prevStep => Math.max(prevStep - 1, 1));

  const handleOptionSelect = (step: number, optionId: number) => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      [`step${step}`]: optionId,
    }));
  };

  const handleMultiOptionSelect = (step: number, optionId: number) => {
    setSelectedOptions(prevOptions => {
      const currentOptions = prevOptions[`step${step}` as keyof SelectedOptions] as number[];
      if (currentOptions.includes(optionId)) {
        return {
          ...prevOptions,
          [`step${step}`]: currentOptions.filter(id => id !== optionId),
        };
      } else {
        return {
          ...prevOptions,
          [`step${step}`]: [...currentOptions, optionId],
        };
      }
    });
  };

  const handleSubmit = async () => {
    // Handle form submission logic here
    // After submission, you can navigate to a different page
    router.push('/learn');
  };

  const isContinueDisabled =
    (step === 2 && !selectedOptions.step2) ||
    (step === 3 && selectedOptions.step3.length === 0) ||
    (step === 4 && selectedOptions.step4.length === 0);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-between bg-gray-800 p-4 text-white">
      <div className="w-full max-w-4xl">
        <ProgressBar step={step} />
        <div className="mt-4 relative">
          {step > 1 && (
            <ArrowLeft
              className="h-8 w-8 text-gray-500 cursor-pointer absolute left-0"
              onClick={prevStep}
            />
          )}
          <div className="text-center">
            {step === 1 && <Step1 />}
            {step === 2 && (
              <Step2
                selectedOption={selectedOptions.step2}
                setSelectedOption={(optionId) => handleOptionSelect(2, optionId)}
              />
            )}
            {step === 3 && (
              <Step3
                selectedOption={selectedOptions.step3[0]}
                setSelectedOption={(optionId) => handleOptionSelect(3, optionId)}
              />
            )}
            {step === 4 && (
              <Step4
                selectedOptions={selectedOptions.step4}
                setSelectedOptions={(optionId) => handleMultiOptionSelect(4, optionId)}
              />
            )}
            {step === 5 && (
              <Step5
                selectedOptions={selectedOptions.step5}
                setSelectedOptions={(optionId) => handleMultiOptionSelect(5, optionId)}
              />
            )}
          </div>
        </div>
      </div>
      <button
        onClick={step === 5 ? handleSubmit : nextStep}
        disabled={isContinueDisabled}
        className={`mt-6 px-4 py-2 rounded transition-colors ${
          isContinueDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {step === 5 ? 'Submit' : 'Continue'}
      </button>
    </div>
  );
};

const ProgressBar = ({ step }: { step: number }) => {
  const steps = Array.from({ length: 5 }, (_, index) => `Step ${index + 1}`);
  const progressWidth = (step / steps.length) * 100;

  return (
    <div className="relative w-full bg-gray-700 h-2 rounded-full">
      <div
        className="absolute top-0 left-0 h-2 bg-green-500 rounded-full transition-all duration-300"
        style={{ width: `${progressWidth}%` }}
      ></div>
      <div className="flex justify-between absolute top-0 left-0 w-full">
        {steps.map((label, index) => (
          <div key={index} className="w-full text-center py-1 text-xs font-medium">
            {index + 1 === step ? <span className="text-green-500">{label}</span> : <span>{label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const Step1 = () => (
  <div className="w-full max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">Hi there</h2>
    <p className="text-lg mb-4">Welcome! Let's get started on your learning journey.</p>
  </div>
);

const Step2 = ({
  selectedOption,
  setSelectedOption,
}: {
  selectedOption: number | null;
  setSelectedOption: (optionId: number) => void;
}) => (
  <div className="w-full max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">What's your daily learning goal?</h2>
    <div className="grid grid-cols-1 gap-4">
      {goalOptions.map(option => (
        <div
          key={option.id}
          className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-transform transform hover:scale-105 ${
            selectedOption === option.id ? 'border-blue-500 bg-gray-600' : 'border-gray-600'
          }`}
          onClick={() => setSelectedOption(option.id)}
        >
          <span className="text-lg font-semibold">{option.label}</span>
          <span className="text-sm text-gray-400">{option.description}</span>
        </div>
      ))}
    </div>
  </div>
);

const Step3 = ({
  selectedOption,
  setSelectedOption,
}: {
  selectedOption: number | null;
  setSelectedOption: (optionId: number) => void;
}) => (
  <div className="w-full max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">How much Chinese do you know?</h2>
    <div className="grid grid-cols-1 gap-4">
      {proficiencyOptions.map(option => (
        <div
          key={option.id}
          className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-transform transform hover:scale-105 ${
            selectedOption === option.id ? 'border-blue-500 bg-gray-600' : 'border-gray-600'
          }`}
          onClick={() => setSelectedOption(option.id)}
        >
          <span className="text-lg font-semibold">{option.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const Step4 = ({
  selectedOptions,
  setSelectedOptions,
}: {
  selectedOptions: number[];
  setSelectedOptions: (optionId: number) => void;
}) => (
  <div className="w-full max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">What topics are you interested in?</h2>
    <div className="grid grid-cols-2 gap-4">
      {topicOptions.map(option => (
        <div
          key={option.id}
          className={`border rounded-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 ${
            selectedOptions.includes(option.id) ? 'border-blue-500 bg-gray-600' : 'border-gray-600'
          }`}
          onClick={() => setSelectedOptions(option.id)}
        >
          <h3 className="text-lg font-semibold">{option.label}</h3>
        </div>
      ))}
    </div>
  </div>
);

const Step5 = ({
  selectedOptions,
  setSelectedOptions,
}: {
  selectedOptions: number[];
  setSelectedOptions: (optionId: number) => void;
}) => (
  <div className="w-full max-w-md mx-auto p-6 bg-gray-700 rounded-lg shadow">
    <h2 className="text-2xl font-bold mb-4">
      In our app, there's no pressure to follow a fixed thing. You'll get to work on whatever activities you like best.
    </h2>
    <p className="text-lg mb-4">Please select the activities you are interested in:</p>
    <div className="grid grid-cols-2 gap-4">
      {activityOptions.map(option => (
        <div
          key={option.id}
          className={`border rounded-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 ${
            selectedOptions.includes(option.id) ? 'border-blue-500 bg-gray-600' : 'border-gray-600'
          }`}
          onClick={() => setSelectedOptions(option.id)}
        >
          <h3 className="text-lg font-semibold">{option.label}</h3>
        </div>
      ))}
    </div>
  </div>
);

export default MultiStepForm;
