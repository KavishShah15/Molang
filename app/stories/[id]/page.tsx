"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import DOMPurify from 'dompurify';


const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void => {
    let timeoutId: NodeJS.Timeout | undefined;
    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

const StoryPage = () => {
    const router = useRouter();
    const pathname = usePathname();
    const id = pathname.split('/').pop();
    const [story, setStory] = useState<string | null>(null);
    const [tokens, setTokens] = useState<string[]>([]);
    const [clickedTokens, setClickedTokens] = useState<Set<string>>(new Set());
    const [idioms, setIdioms] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<any[]>([]);
    const [selectedToken, setSelectedToken] = useState<string>('');
    const [learnVocab, setLearnVocab] = useState<Set<string>>(new Set());
    const [storyName, setStoryName] = useState<string>('');
    const [instructName, setInstructName] = useState<string>('');
    const [coverUrl, setCoverUrl] = useState<string>('');
    const [currentInstruct, setCurrentInstruct] = useState<string>('');
    const [currentLearn, setCurrentLearn] = useState<string>('');
    const { data: session, status } = useSession();
    const tokensRef = useRef<string[]>([]);

    useEffect(() => {
        if (id) {
            const fetchStory = async () => {
                try {
                    const response = await fetch(`/api/stories/${id}`);
                    const data = await response.json();

                    console.log('Fetched story data:', data);

                    if (response.ok) {
                        const storyContent = data.content.replace(/^##\s*/, ''); // Remove "##" from the beginning
                        setStoryName(data.learnName);
                        setInstructName(data.instructName);
                        setCoverUrl(data.cover);
                        setStory(storyContent);
                        setCurrentInstruct(data.instructLang);
                        setCurrentLearn(data.learnLang);
                        await tokenizeStory(storyContent, data.learnLang);
                    } else {
                        setError(data.message || 'Failed to fetch story');
                    }
                } catch (error) {
                    setError('Failed to fetch story');
                } finally {
                    setLoading(false);
                }
            };

            fetchStory();
        }
    }, [id]);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email && currentInstruct && currentLearn) {
            const fetchLearnVocab = async () => {
                try {
                    const response = await fetch(`/api/vocab/${session?.user?.email}?instructLang=${currentInstruct}&learnLang=${currentLearn}`);
                    const data = await response.json();
                    if (response.ok) {
                        console.log('Fetched learn vocab:', data.learnVocab);
                        if (data.learnVocab) {
                            setLearnVocab(new Set(Object.keys(data.learnVocab).map(t => t.toLowerCase())));
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

    const tokenizeStory = async (text: string, language: string) => {
        try {
            const tokenizeResponse = await fetch('/api/tokenize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, language }),
            });

            const tokenizeData = await tokenizeResponse.json();
            console.log('Tokenize data:', tokenizeData);

            setTokens(tokenizeData.tokens || []);
            setIdioms(tokenizeData.idioms || []);
        } catch (error) {
            console.error('Error tokenizing story:', error);
        }
    };

    useEffect(() => {
        if (tokens.length > 0) {
            const uniqueTokens = Array.from(new Set(tokens.map(t => t.toLowerCase())));
            console.log('Unique tokens:', uniqueTokens);

            if (JSON.stringify(uniqueTokens) !== JSON.stringify(tokensRef.current)) {
                tokensRef.current = uniqueTokens;
                debouncedUpdateMasterVocab(uniqueTokens);
            }
        }
    }, [tokens]);

    const debouncedUpdateMasterVocab = debounce(async (uniqueTokens: string[]) => {
        if (session?.user?.email) {
            try {
                console.log('Calling updateMasterVocab with:', uniqueTokens);
                const response = await fetch(`/api/vocab/${session.user.email}?instructLang=${currentInstruct}&learnLang=${currentLearn}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uniqueTokens }),
                });

                if (response.ok) {
                    console.log('Successfully updated masterVocab');
                } else {
                    console.error('Failed to update masterVocab:', await response.json());
                }
            } catch (error) {
                console.error('Error updating masterVocab:', error);
            }
        }
    }, 300);

    useEffect(() => {
        if (explanation.length > 0 && explanation[0].audio) {
            const audio = new Audio(explanation[0].audio);
            audio.play();
        }
    }, [explanation]);

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
                console.log('Successfully updated vocab');
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
        return tokens.map((token, index) => {
            if (token === '##') {
                // Render a paragraph break
                return <div key={index} className="w-full h-4"></div>;
            }

            const isPunctuation = /^[.,:;!?¿¡。！？、。¿¡。(){}[\]"'<>%@&#]$/.test(token);
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

    const renderExplanation = (explanation: any[]) => {
        return explanation.map((item, index) => {
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
                    {item.category !== 'grammar' && <p><strong className='text-[#028F9E]'>Definition:</strong > {item.definition}</p>}
                    {item.category !== 'grammar' && (
                        <p><strong className='text-[#028F9E]'>Usage:</strong> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.usage.replace(/\*\*(.*?)\*\*/g, '<u>$1</u>')) }} /></p>
                    )}
                    {item.otherForms && Object.keys(item.otherForms).length > 0 && (
                        <div>
                            <strong className='text-[#028F9E]'>Other Forms:</strong>
                            <ul>
                                {Object.keys(item.otherForms).map((formKey) => (
                                    <li key={formKey}>{formKey}: {item.otherForms[formKey]}</li>
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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="max-h-screen flex flex-col md:flex-row p-8 gap-6">
            <ScrollArea className="h-screen w-full md:w-2/3">
                {story && (
                    <>
                        <div className='flex flex-col md:flex-row justify-center md:justify-start items-center gap-8 mb-4'> 
                            {coverUrl && <div className='p-1 bg-[#06B6D4] bg-opacity-25 rounded-lg'><img src={coverUrl} alt="Story Cover" className="h-40 rounded-lg shadow-md" /> </div>}
                            <div className=''>
                                <h2 className="text-xl font-semibold mb-2 px-2 text-left bg-[#028F9E] text-white rounded-full">{storyName}</h2>
                                <h3 className="bg-[#06B6D4] bg-opacity-25 text-gray-600 rounded-full  px-2 text-base font-medium">{instructName}</h3>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-baseline">
                            {renderTokens(tokens)}
                        </div>
                    </>
                )}
            </ScrollArea>
            <ScrollArea className="h-screen md:w-1/3 md:p-4 border-l-white border-t-2 md:border-t-white md:border-l-2 border-[#06B6D4]">
                {selectedToken && explanation.length > 0 && (
                    <div className="mt-4">
                        {renderExplanation(explanation)}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default StoryPage;
