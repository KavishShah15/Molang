"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; 

export default function ChatPage() {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentInstruct, setCurrentInstruct] = useState<string>('en'); // Default target language
  const [currentLearn, setCurrentLearn] = useState<string>('hi'); // Default source language
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [langHistory, setLangHistory] = useState<Array<string>>([]);
  const [translatedCache, setTranslatedCache] = useState<Array<{ ori: string, translated: string }>>([]);
  const [showHintDropdown, setShowHintDropdown] = useState<boolean>(false);
  const [hints, setHints] = useState<Array<string>>([]);
  
  const { data: session, status } = useSession(); 

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/user/${session.user?.email}`);
          const data = await response.json();
          if (response.ok) {
            if (data.currentInstruct) setCurrentInstruct(data.currentInstruct);
            if (data.currentLearn) setCurrentLearn(data.currentLearn);
            if (data.currentLevel !== undefined) setCurrentLevel(data.currentLevel);
          } else {
            console.error('Failed to fetch user data:', data.message);
          }
        } catch (error: unknown) {
          console.error('Error fetching user data:', error);
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An unknown error occurred');
          }
        }
      };

      fetchUserData();
    }
  }, [session, status]);

  useEffect(() => {
    if (currentInstruct && currentLearn && currentLevel !== undefined) {
      fetchInitialHints();
    }
  }, [currentInstruct, currentLearn, currentLevel]);

  const fetchInitialHints = async () => {
    try {
      if (!session?.user?.email) return; // Early return if session.user.email is undefined

      const res = await fetch(`/api/chat?email=${session.user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Error: ${res.statusText}`);
      }

      const data = await res.json();
      setHints(data.hints);
      setShowHintDropdown(true);
    } catch (error: unknown) {
      console.error('Error fetching initial hints:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const currentMessage = message;
    setMessage('');

    setChatHistory(prevHistory => [...prevHistory, { role: 'user', content: currentMessage }]);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessage, history: chatHistory, currentInstruct, currentLearn, currentLevel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Error: ${res.statusText}`);
      }

      const data = await res.json();
      setChatHistory(data.history);
      setLangHistory(prevLang => [...prevLang, currentLearn, currentLearn]);
      setTranslatedCache(prevTranslatedCache => [
        ...prevTranslatedCache,
        { ori: currentMessage, translated: '' },
        { ori: data.response, translated: '' },
      ]);
      
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleTranslate = async (message: string, index: number) => {
    try {
      const langElement = langHistory.at(index);
      let translateLang = currentInstruct;
      if (langElement === currentLearn) {
        langHistory[index] = currentInstruct;
      } else {
        langHistory[index] = currentLearn;
        translateLang = currentLearn;
      }

      if (translatedCache[index].translated !== '') {
        setChatHistory(prevHistory => {
          const newHistory = [...prevHistory];
          newHistory[index].content = translateLang === currentLearn
            ? translatedCache[index].ori
            : translatedCache[index].translated;
          return newHistory;
        });
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, translate: translateLang }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || `Error: ${res.statusText}`);
        }

        const data = await res.json();
        const translatedMessage = data.translatedMessage;
        if (translateLang === currentInstruct) {
          setTranslatedCache(prevTranslatedCache => {
            const newTranslatedCache = [...prevTranslatedCache];
            newTranslatedCache[index].translated = translatedMessage;
            return newTranslatedCache;
          });
        }

        setChatHistory(prevHistory => {
          const newHistory = [...prevHistory];
          newHistory[index].content = translatedMessage;
          return newHistory;
        });
      }
    } catch (error: unknown) {
      console.error('Error translating message:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleHint = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: chatHistory, hint: "Yes", currentInstruct, currentLearn, currentLevel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Error: ${res.statusText}`);
      }

      const data = await res.json();
      setHints(data.message);
      setShowHintDropdown(true);
      
    } catch (error: unknown) {
      console.error('Error getting hint:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSelectHint = (hint: string) => {
    setMessage(hint);
    setShowHintDropdown(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen p-5 box-border bg-gray-100">
      <h1 className="text-center mb-5 text-2xl text-gray-800">Chat with Our Bot</h1>
      <div className="flex flex-col justify-between w-full max-w-xl bg-white rounded-lg shadow-lg p-5 h-4/5">
        <div className="flex-grow overflow-y-auto mb-5">
          {chatHistory.map((chat, index) => (
            <div key={index} className={`p-3 rounded-lg mb-3 max-w-4/5 relative ${chat.role === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-300 text-gray-800'}`}>
              {chat.content}
              <button className="mt-1 px-2 py-1 rounded-lg border-none bg-yellow-300 text-gray-800 cursor-pointer text-xs absolute right-2 bottom-[-10px]" onClick={() => handleTranslate(chat.content, index)}>Translate</button>
            </div>
          ))}
        </div>
        <div className="flex items-center w-full border-t border-gray-300 pt-2 relative">
          <textarea
            className="flex-grow h-12 p-2 rounded-lg border border-gray-300 resize-none text-lg"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          ></textarea>
          <button className="ml-2 p-2 rounded-full border-none bg-yellow-400 text-white cursor-pointer flex items-center justify-center" onClick={handleHint}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M9 21h6v-2H9v2zm3-19c-4.42 0-8 3.58-8 8 0 3.31 2.69 6 6 6v2h2v-2h2v2h2v-2c3.31 0 6-2.69 6-6 0-4.42-3.58-8-8-8zm0 14h-2v-1h2v1zm0-3h-2v-1h2v1zm0-3h-2V8h2v1z" fill="currentColor" />
            </svg>
          </button>
          <button className="ml-2 p-2 rounded-full border-none bg-blue-500 text-white cursor-pointer flex items-center justify-center" onClick={handleSendMessage}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M2 12L22 2L15 22L11 13L2 12Z" fill="currentColor" />
            </svg>
          </button>
          {showHintDropdown && (
            <div className="absolute bottom-16 left-0 w-full bg-white shadow-lg rounded-lg z-10">
              {hints.map((hint, index) => (
                <div key={index} className="p-2 border-b border-gray-300 cursor-pointer" onClick={() => handleSelectHint(hint)}>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
