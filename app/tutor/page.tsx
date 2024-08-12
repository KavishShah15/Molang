"use client";

import { useState } from 'react';
import React from 'react';

interface ChatMessage {
    role: string;
    content: string;
    type?: string;
}

interface ChatHistory extends ChatMessage {
    display?: boolean;
}

interface Drill {
    question: string;
    options: string[];
    correctAnswer: string;
}

const ChatPage: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [oldDrills, setOldDrills] = useState<Drill[]>([]);
    const [newDrills, setNewDrills] = useState<Drill[]>([]);
    const [oldDrillIndex, setOldDrillIndex] = useState<number>(0);
    const [newDrillIndex, setNewDrillIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
    const [endPractice, setEndPractice] = useState<boolean>(false);
    const [isNewDrillSession, setIsNewDrillSession] = useState<boolean>(false);

    const handleSendMessage = async () => {
        if (message.trim() === '') return;

        const currentMessage = message;
        setMessage('');

        try {
            const res = await fetch('/api/tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: currentMessage, history: chatHistory }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `Error: ${res.statusText}`);
            }

            const data = await res.json();
            setChatHistory(prevHistory => [...prevHistory, ...data.history.map((msg: ChatMessage) => ({ ...msg, display: true }))]);

        } catch (err) {
            console.error('Error sending message:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
        }
    };

    const handleDrills = async () => {
        if (endPractice) {
            setEndPractice(false);
            setIsNewDrillSession(true);

            try {
                const res = await fetch('/api/tutor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ history: chatHistory, expertise: "Beginner", drill: "Yes" }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || `Error: ${res.statusText}`);
                }

                const data = await res.json();
                setNewDrills([{ question: data.question, options: data.options, correctAnswer: data.correctAnswer }]);

                setChatHistory(prevHistory => [
                    ...prevHistory,
                    { role: 'user', content: "Can you give me a question to practice the topic we have been discussing", display: false },
                    { role: 'model', content: data.question, type: 'carousel-new', display: true }
                ]);

            } catch (err) {
                console.error('Error getting new drill:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError(String(err));
                }
            }

            return;
        }

        try {
            const res = await fetch('/api/tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: chatHistory, expertise: "Beginner", drill: "Yes" }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `Error: ${res.statusText}`);
            }

            const data = await res.json();
            setOldDrills([{ question: data.question, options: data.options, correctAnswer: data.correctAnswer }]);
            setChatHistory(prevHistory => [
                ...prevHistory,
                { role: 'user', content: "Can you give me a question to practice the topic we have been discussing", display: false },
                { role: 'model', content: data.question, type: 'carousel-old', display: true }
            ]);

        } catch (err) {
            console.error('Error getting drill:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
        }
    };

    const handleNextDrill = async (isOld: boolean) => {
        try {
            const res = await fetch('/api/tutor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: chatHistory, expertise: "Beginner", drill: "Yes" }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `Error: ${res.statusText}`);
            }

            const data = await res.json();
            const newDrill = data;

            if (isOld) {
                setOldDrills(prevDrills => {
                    const updatedDrills = [...prevDrills];
                    updatedDrills[oldDrillIndex] = newDrill;
                    return updatedDrills;
                });
                setChatHistory(prevHistory => {
                    const newHistory = [...prevHistory];
                    const carouselIndex = newHistory.findIndex(chat => chat.type === 'carousel-old');
                    if (carouselIndex !== -1) {
                        newHistory[carouselIndex] = {
                            ...newHistory[carouselIndex],
                            content: data.question,
                            role: 'model',
                            display: true
                        };
                    }
                    return newHistory;
                });
                setOldDrillIndex((prevIndex) => (prevIndex + 1) % oldDrills.length);
            } else {
                setNewDrills(prevDrills => {
                    const updatedDrills = [...prevDrills];
                    updatedDrills[newDrillIndex] = newDrill;
                    return updatedDrills;
                });
                setChatHistory(prevHistory => {
                    const newHistory = [...prevHistory];
                    const carouselIndex = newHistory.findIndex(chat => chat.type === 'carousel-new');
                    if (carouselIndex !== -1) {
                        newHistory[carouselIndex] = {
                            ...newHistory[carouselIndex],
                            content: data.question,
                            role: 'model',
                            display: true
                        };
                    }
                    return newHistory;
                });
                setNewDrillIndex((prevIndex) => (prevIndex + 1) % newDrills.length);
            }

        } catch (err) {
            console.error('Error getting next drill:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
        }

        setSelectedOption(null);
        setIsAnswerChecked(false);
    };

    const handlePrevDrill = (isOld: boolean) => {
        if (isOld) {
            setOldDrillIndex((prevIndex) => (prevIndex - 1 + oldDrills.length) % oldDrills.length);
        } else {
            setNewDrillIndex((prevIndex) => (prevIndex - 1 + newDrills.length) % newDrills.length);
        }
        setSelectedOption(null);
        setIsAnswerChecked(false);
    };

    const handleOptionClick = (option: string) => {
        setSelectedOption(option);
        setChatHistory(prevHistory => [...prevHistory, { role: 'user', content: `Is the answer ${option}`, display: false }]);
    };

    const handleCheckAnswer = () => {
        setIsAnswerChecked(true);
        const currentDrill = isNewDrillSession ? newDrills[newDrillIndex] : oldDrills[oldDrillIndex];
        const isCorrect = selectedOption === currentDrill.correctAnswer;
        const answerMessage = isCorrect ? "Correct answer!" : `Incorrect answer. The correct answer is ${currentDrill.correctAnswer}.`;

        setChatHistory(prevHistory => [...prevHistory, { role: 'model', content: answerMessage, display: false }]);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const DrillCarousel: React.FC<{ isOld: boolean }> = ({ isOld }) => {
        const drills = isOld ? oldDrills : newDrills;
        const drillIndex = isOld ? oldDrillIndex : newDrillIndex;

        const currentDrill = drills[drillIndex];

        if (!currentDrill) return null;

        return (
            <div className="flex justify-between items-center gap-2 p-2 bg-white rounded-lg w-full max-w-[80%]">
                <button className="bg-transparent text-2xl text-[#028F9E] cursor-pointer" onClick={() => handlePrevDrill(isOld)}>❮</button>
                <div className="flex-grow text-center">
                    <h2 className="font-bold mb-2">{currentDrill.question}</h2>
                    <div className="flex flex-col items-center ">
                        {currentDrill.options.map((option, index) => {
                            const buttonClass = selectedOption === option && !isAnswerChecked
                                ? 'bg-[#06B6D4] bg-opacity-25'
                                : isAnswerChecked && option === currentDrill.correctAnswer
                                    ? 'bg-green-300'
                                    : isAnswerChecked && option === selectedOption
                                        ? 'bg-red-300'
                                        : 'bg-white';

                            return (
                                <button
                                    key={index}
                                    className={`p-2 rounded-lg border mt-2 w-full ${buttonClass}`}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={isAnswerChecked}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                    <div className='flex justify-center items-center gap-4'>
                    <button className="mt-2 p-2 rounded-lg bg-[#028F9E] text-white" onClick={handleCheckAnswer} disabled={isAnswerChecked || !selectedOption}>Check Answer</button>
                    <button className="mt-2 p-2 rounded-lg bg-gray-200 text-gray-800" onClick={() => setEndPractice(true)}>End Practice</button>
                    </div>
                </div>
                <button className="bg-transparent text-2xl text-[#028F9E] cursor-pointer" onClick={() => handleNextDrill(isOld)}>❯</button>
            </div>
        );
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen p-5 bg-white w-full">
            <div className='flex justify-center items-center gap-2 mb-4'>
            <img src="/bot.png" alt="" className='w-10 h-10'/>
            <h1 className="text-center text-2xl bg-[#028F9E] text-white rounded-full border border-b-2 border-[#06B6D4] px-2">Learn with Our AI Tutor</h1>
            </div>            
            <div className="flex flex-col justify-between w-full max-w-3xl h-[80vh] bg-white rounded-lg shadow-lg p-5">
                <div className="flex-grow overflow-y-auto mb-5">
                    {chatHistory.length === 0 && (
                        <div className="p-2 rounded-lg bg-[#06B6D4] bg-opacity-25">You can ask me any question</div>
                    )}
                    {chatHistory.filter(chat => chat.display !== false).map((chat, index) => (
                        <div key={index} className={`flex justify-center items-center p-2 rounded-lg mb-2 max-w-[80%] ${chat.role === 'user' ? 'self-end bg-[#06B6D4] bg-opacity-25' : 'self-start border-2 border-[#06B6D4] text-gray-800'}`}>
                            {chat.type === 'carousel-old' ? (
                                <DrillCarousel isOld={true} />
                            ) : chat.type === 'carousel-new' ? (
                                <DrillCarousel isOld={false} />
                            ) : (
                                chat.content
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center w-full pt-3 relative">
                    <textarea
                    className="flex-grow h-12 p-2 rounded-lg bg-[#06B6D4] bg-opacity-25 resize-none text-sm"
                    placeholder="Type your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                    ></textarea>
                    <button className="ml-2 p-3 rounded-full bg-yellow-400 text-gray-800 flex items-center justify-center" onClick={handleDrills}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor" />
                        </svg>
                    </button>
                    <button className="ml-2 p-3 rounded-full bg-[#06B6D4] text-white flex items-center justify-center" onClick={handleSendMessage}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <path d="M2 12L22 2L15 22L11 13L2 12Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatPage;
