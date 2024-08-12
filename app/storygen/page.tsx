"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import DOMPurify from 'dompurify';

interface Explanation {
  term: string;
  category: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition?: string;
  usage?: string;
  otherForms?: Record<string, string>;
  explanation?: string;
  audio?: string;
}

const StoryGenerator = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [story, setStory] = useState<string | null>(null);
    const [tokens, setTokens] = useState<string[]>([]);
    const [clickedTokens, setClickedTokens] = useState<Set<string>>(new Set());
    const [idioms, setIdioms] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentInstruct, setCurrentInstruct] = useState<string>('en');
    const [currentLearn, setCurrentLearn] = useState<string>('en');
    const [currentLevel, setCurrentLevel] = useState<number>(0);
    const [explanation, setExplanation] = useState<Explanation[]>([]);
    const [selectedToken, setSelectedToken] = useState<string>('');
    const [learnVocab, setLearnVocab] = useState<Set<string>>(new Set());
    const [storyName, setStoryName] = useState<string>('');
    const [instructName, setInstructName] = useState<string>('');
    const [coverUrl, setCoverUrl] = useState<string>('');
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const fetchUserData = async () => {
                try {
                    const response = await fetch(`/api/user/${session?.user?.email}`);
                    const data = await response.json();
                    if (response.ok) {
                        if (data.currentInstruct) setCurrentInstruct(data.currentInstruct);
                        if (data.currentLearn) setCurrentLearn(data.currentLearn);
                        if (data.currentLevel !== undefined) setCurrentLevel(data.currentLevel);
                    } else {
                        console.error('Failed to fetch user data:', data.message);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            };

            fetchUserData();
        }
    }, [session, status]);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const fetchLearnVocab = async () => {
                try {
                    const response = await fetch(`/api/vocab/${session?.user?.email}?instructLang=${currentInstruct}&learnLang=${currentLearn}`);
                    const data = await response.json();
                    if (response.ok) {
                        if (data.learnVocab) {
                            setLearnVocab(new Set(Object.keys(data.learnVocab).map((t: string) => t.toLowerCase())));
                        }
                    } else {
                        console.error('Failed to fetch learn vocab:', data.message);
                    }
                } catch (error) {
                    console.error('Error fetching learn vocab:', error);
                }
            };

            fetchLearnVocab();
        }
    }, [session, status, currentInstruct, currentLearn]);

    useEffect(() => {
        if (explanation.length > 0 && explanation[0].audio) {
            const audio = new Audio(explanation[0].audio);
            audio.play();
        }
    }, [explanation]);

    const generateStory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/storygen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, currentInstruct, currentLearn, currentLevel }),
            });

            const data = await response.json();

            if (response.ok) {
                const story = data.story.replace(/^##\s*/, ''); // Remove "##" from the beginning
                setStoryName(data.learnName);
                setInstructName(data.instructName);
                setCoverUrl(data.cover);
                const tokenizeResponse = await fetch('/api/tokenize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: story, language: currentLearn }),
                });

                const tokenizeData = await tokenizeResponse.json();
                setStory(story);
                setTokens(tokenizeData.tokens || []);
                setIdioms(tokenizeData.idioms || []);

                const uniqueTokens = Array.from(new Set((tokenizeData.tokens as string[]).map((t) => t.toLowerCase())));
                await updateMasterVocab(uniqueTokens);
            } else {
                setError(data.error);
            }
        } catch (error) {
            setError('Failed to generate story.');
        } finally {
            setLoading(false);
        }
    };

    const updateMasterVocab = async (uniqueTokens: string[]) => {
        if (session?.user?.email) {
            try {
                const response = await fetch(`/api/vocab/${session.user.email}?instructLang=${currentInstruct}&learnLang=${currentLearn}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uniqueTokens }),
                }); 

                if (!response.ok) {
                    console.error('Failed to update masterVocab:', await response.json());
                }
            } catch (error) {
                console.error('Error updating masterVocab:', error);
            }
        }
    };

    const handleTokenClick = async (token: string) => {
        setSelectedToken(token);
        setExplanation([]); // Clear previous explanation

        // Fetch the explanation for the token
        try {
            const response = await fetch('/api/vocab', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: token, currentInstruct, currentLearn }),
            });
            const data = await response.json();
            setExplanation(data.result || []);
        } catch (error) {
            console.error('Error fetching explanation:', error);
            setExplanation([]);
        }

        // Update the database to move the token from masterVocab to learnVocab
        try {
            const updateResponse = await fetch(`/api/vocab/${session?.user?.email}?instructLang=${currentInstruct}&learnLang=${currentLearn}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token.toLowerCase() }),
            });

            if (updateResponse.ok) {
                setClickedTokens(new Set([...clickedTokens, token.toLowerCase()]));
                setLearnVocab(new Set([...learnVocab, token.toLowerCase()]));
            } else {
                console.error('Failed to update vocab:', await updateResponse.json());
            }
        } catch (error) {
            console.error('Error updating vocab:', error);
        }
    };

    const renderTokens = (tokens: string[]) => {
        let capitalizeNext = true;
        return tokens.map((token: string, index: number) => {
            if (token === '##') {
                // Render a paragraph break
                return <div key={index} className="w-full h-4"></div>;
            }

            const isPunctuation = /^[.,:;!?¿¡。！？、。¿¡。]$/.test(token);
            const isSentenceEndPunctuation = /^[.!?]$/.test(token);

            if (isPunctuation) {
                if (isSentenceEndPunctuation) {
                    capitalizeNext = true; // Capitalize next word after sentence-ending punctuation
                }
                return (
                    <span key={index} className="text-black">
                        {token}
                    </span>
                );
            } else {
                // Capitalize the token if it's the start of a sentence
                const capitalizedToken = capitalizeNext ? token.charAt(0).toUpperCase() + token.slice(1) : token;
                capitalizeNext = false; // Reset capitalization flag after capitalizing

                const tokenLowerCase = token.toLowerCase();
                const isLearnVocab = learnVocab.has(tokenLowerCase);

                return (
                    <span
                        key={index}
                        className={`bg-white px-0 py-1 ${isPunctuation ? '' : 'ml-[5px] mr-0'} rounded cursor-pointer hover:underline hover:decoration-2 hover:decoration-sky-500 ${isLearnVocab ? 'bg-[#06B6D4] bg-opacity-25 py-[2px]' : ''}`}
                        onClick={() => handleTokenClick(capitalizedToken)}
                    >
                        {capitalizedToken}
                    </span>
                );
            }
        });
    };

    const renderExplanation = (explanation: Explanation[]) => {
        return explanation.map((item: Explanation, index: number) => {
            let explanationText = item.explanation || '';
            explanationText = explanationText.replace(/\*\*(.*?)\*\*/g, '<u>$1</u>'); // Replace **text** with <u>text</u>

            const playAudio = () => {
                if (item.audio) {
                    const audio = new Audio(item.audio);
                    audio.play();
                }
            };

            return (
                <div key={index} className="mb-4 p-4 border-2 border-[#06B6D4] rounded-lg bg-white shadow-md">
                    <div className='flex gap-2 items-center'>
                        {item.audio && (
                            <button onClick={playAudio} className="p-1 text-[#028F9E] rounded-full hover:bg-[#06B6D4] hover:bg-opacity-25">
                                <Volume2 />
                            </button>
                        )}
                        <h3 className="font-bold text-[#028F9E]">{item.term}</h3>
                    </div>
                    <p><strong className='text-[#028F9E]'>Category:</strong> {item.category}</p>
                    {item.category !== 'grammar' && item.pronunciation && <p><strong className='text-[#028F9E]'>Pronunciation:</strong> {item.pronunciation}</p>}
                    {item.category !== 'grammar' && item.partOfSpeech && <p><strong className='text-[#028F9E]'>Part of Speech:</strong> {item.partOfSpeech}</p>}
                    {item.category !== 'grammar' && <p><strong className='text-[#028F9E]'>Definition:</strong> {item.definition}</p>}
                    {item.category !== 'grammar' && (
                        <p><strong className='text-[#028F9E]'>Usage:</strong> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((item.usage ?? "").replace(/\*\*(.*?)\*\*/g, '<u>$1</u>')) }} /></p>
                    )}
                    {item.otherForms && Object.keys(item.otherForms).length > 0 && (
                        <div>
                            <strong className='text-[#028F9E]'>Other Forms:</strong>
                            <ul>
                                {Object.keys(item.otherForms).map((formKey) => (
                                    <li key={formKey}>{formKey}: {item.otherForms![formKey]}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.explanation && (
                        <p><strong className='text-[#028F9E]'>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explanationText) }} /></p>
                    )}
                </div>
            );
        });
    };

    return (
        <div className={`max-h-screen w-full flex ${story ? 'flex-row px-4 gap-1' : 'p-8 gap-6'} `}>
            <div className={`w-full ${story ? 'md:w-2/3 mr-4' : ''}`}>
                {!story && (
                    <>
                    <h1 className="w-60 text-2xl text-left pl-4 font-base mb-4 bg-[#028F9E] text-white rounded-full p-1 border border-b-2 border-[#06B6D4]">Story Generator</h1>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="w-full sm:w-2/3 h-2/3 p-2 mb-4 border-2 border-[#06B6D4] rounded-lg"
                            placeholder="Enter your prompt here"
                        />
                        <button
                            onClick={generateStory}
                            disabled={loading}
                            className="w-60 text-2xl text-right pr-4 font-base mb-4 bg-[#028F9E] text-white rounded-full p-1 border border-b-2 border-[#06B6D4]"
                        >
                            {loading ? 'Generating...' : 'Generate Story'}
                        </button>
                    </>
                )}
                {error && <p className="text-red-500 mt-4">{error}</p>}
                {story && (
                    <ScrollArea className="h-screen mt-8">
                        <div className='flex flex-col md:flex-row justify-center md:justify-start items-center gap-8 mb-4'> 
                        {coverUrl && <div className='p-1 bg-[#06B6D4] bg-opacity-25 rounded-lg'><img src={coverUrl} alt="Story Cover" className="h-40 rounded-lg shadow-md" /> </div>}
                        <div>
                        <h2 className="text-xl font-semibold mb-2 px-2 text-left bg-[#028F9E] text-white rounded-full">{storyName}</h2>
                        <h3 className="bg-[#06B6D4] bg-opacity-25 text-gray-600 rounded-full  px-2 text-base font-medium">{instructName}</h3>
                        </div>
                        </div>
                        <div className="flex flex-wrap items-baseline">
                            {renderTokens(tokens)}
                        </div>
                    </ScrollArea>
                )}
            </div>
            {story && (
                <ScrollArea className="h-screen md:w-1/3 md:p-4 border-l-white border-t-2 md:border-t-white md:border-l-2 border-[#06B6D4]">
                    {selectedToken && explanation.length > 0 && (
                        <div className="mt-4">
                            {renderExplanation(explanation)}
                        </div>
                    )}
                </ScrollArea>
            )}
        </div>
    );
};

export default StoryGenerator;
