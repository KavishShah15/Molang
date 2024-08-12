"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; 

export default function ChatPage() {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string, content: string, display: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentInstruct, setCurrentInstruct] = useState<string>('english'); // Default target language
  const [currentLearn, setCurrentLearn] = useState<string>('hindi'); // Default source language
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
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [session, status]);

  useEffect(() => {
    if (currentInstruct && currentLearn && currentLevel !== undefined) {
      // fetchInitialHints();
    }
  }, [currentInstruct, currentLearn, currentLevel]);

  useEffect(() => {
    console.log("Initial chat history: ", chatHistory);
  }, [chatHistory]);
  
  useEffect(() => {
    console.log("Initial lang history: ", langHistory);
  }, [langHistory]);
  
  useEffect(() => {
    console.log("Initial translate cache: ", translatedCache);
  }, [translatedCache]);
  

  const fetchInitialHints = async () => {
    try {
      const res = await fetch(`/api/chatbot?email=${session?.user?.email}`, {
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

  const fetchInitialChatHistory = async () => {
    const initialChatHistory = [
      { role: 'user', content: 'Let\'s Start', display: false },
      { role: 'model', content: 'What situation do you want to play out today?', display: true },
    ];
  
    const initialLangHistory = ['en', 'en'];
  
    const initialTranslatedCache = [
      { ori: 'Let\'s Start', translated: 'Chaliye shuru karte hai' },
      { ori: 'What situation do you want to play out today?', translated: 'Aap konsi paristithi me hona chahte hai?' },
    ];
  
    // Update all state in a single batch
    setChatHistory(initialChatHistory);
    setLangHistory(prevLang => [...prevLang, ...initialLangHistory]);
    setTranslatedCache(prevTranslatedCache => [...prevTranslatedCache, ...initialTranslatedCache]);
  
    // You can add console.log statements here to see the expected values being set:
    console.log("Initial chat history set function: ", initialChatHistory);
    console.log("Initial lang history set function: ", initialLangHistory);
    console.log("Initial translate cache set function: ", initialTranslatedCache);
  };
  

  // useEffect(() => {
  //   if (status === 'authenticated' && session?.user?.email) {
  //     fetchInitialChatHistory();
  //   }
  // }, [status, session]);

  useEffect(() => {
    
    fetchInitialChatHistory();
    
  }, []);

  const handleSendMessage = async () => {
    if (message.trim() === '') return;
  
    const currentMessage = message;
    setMessage('');
  
    try {
      const res = await fetch('/api/chatbot', {
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
  
      // Update chat history, langHistory, and translatedCache in one go
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', content: currentMessage, display: true },
        { role: 'model', content: data.response, display: true },
      ]);
  
      setLangHistory(prevLang => [
        ...prevLang,
        currentLearn,
        currentLearn
      ]);
  
      setTranslatedCache(prevTranslatedCache => [
        ...prevTranslatedCache,
        { ori: currentMessage, translated: '' },
        { ori: data.response, translated: '' }
      ]);

      console.log(chatHistory)
      console.log(translatedCache)
  
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
    console.log(index)
    console.log(message)
    console.log(langHistory)
    console.log(translatedCache)
    try {
      const langElement = langHistory.at(index+2);
      let translateLang = currentInstruct;
      if (langElement === currentLearn) {
        langHistory[index+2] = currentInstruct;
      } else {
        langHistory[index+2] = currentLearn;
        translateLang = currentLearn;
      }

      if (translatedCache[index+2].translated !== '') {
        setChatHistory(prevHistory => {
          const newHistory = [...prevHistory];
          newHistory[index].content = translateLang === currentLearn
            ? translatedCache[index+2].ori
            : translatedCache[index+2].translated;
          return newHistory;
        });
      } else {
        const res = await fetch('/api/chatbot', {
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
      const res = await fetch('/api/chatbot', {
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
    <div className="flex flex-col justify-center items-center h-screen w-full p-5 box-border bg-white">
      <div className='flex justify-center items-center gap-2 mb-4'>
      <img src="/bot.png" alt="" className='w-10 h-10'/>
      <h1 className="text-center text-2xl bg-[#028F9E] text-white rounded-full border border-b-2 border-[#06B6D4] px-2">Chat with Our Bot</h1>
      </div>
      <div className="flex flex-col justify-between w-full max-w-xl bg-white rounded-lg shadow-lg p-5 h-4/5 border-2 border-[#06B6D4]">
        <div className="flex-grow overflow-y-auto mb-5">
          {chatHistory.filter(chat => chat.display).map((chat, index) => (
            <div key={index} className={`p-3 rounded-xl mb-3 max-w-4/5 relative ${chat.role === 'user' ? 'self-end bg-[#028F9E] text-white' : 'self-start bg-[#06B6D4] bg-opacity-25 text-gray-800'}`}>
              {chat.content}
              <button className="mt-1 px-2 py-1 rounded-lg border-none bg-yellow-300 text-gray-800 cursor-pointer text-xs absolute right-2 bottom-[-10px]" onClick={() => handleTranslate(chat.content, index+1)}>Translate</button>
            </div>
          ))}
        </div>
        <div className="flex items-center w-full pt-2 relative">
          <textarea
            className="flex-grow h-12 p-2 rounded-lg bg-[#06B6D4] bg-opacity-25 resize-none text-sm"
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
          <button className="ml-2 p-2 rounded-full border-none bg-[#06B6D4] text-white cursor-pointer flex items-center justify-center" onClick={handleSendMessage}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M2 12L22 2L15 22L11 13L2 12Z" fill="currentColor" />
            </svg>
          </button>
          {showHintDropdown && (
            <div className="absolute bottom-16 left-0 w-full bg-[#06B6D4] bg-opacity-10 text-[#028F9E] shadow-lg rounded-lg z-10">
              {hints.map((hint, index) => (
                <div key={index} className="p-2 border-b bg-white border-gray-300 cursor-pointer" onClick={() => handleSelectHint(hint)}>
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
