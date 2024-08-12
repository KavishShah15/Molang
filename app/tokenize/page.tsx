"use client";
import React, { useState } from 'react';

const Home: React.FC = () => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [idioms, setIdioms] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string>("");
  const [language, setLanguage] = useState<string>("en");

  const handleTokenize = async () => {
    const response = await fetch('/api/tokenize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: sentence, language }),
    });

    const data = await response.json();
    setTokens(data.tokens || []);
    setIdioms(data.idioms || []);
  };

  const renderTokens = (tokens: string[]) => {
    let capitalizeNext = true;
    return tokens.map((token, index) => {
      const isPunctuation = /^[.,:;!?¿¡。！？、。¿¡।]$/.test(token);
      const isSentenceEndPunctuation = /^[.!?]$/.test(token);

      if (isPunctuation) {
        if (isSentenceEndPunctuation) {
          capitalizeNext = true; // Capitalize next word after sentence-ending punctuation
        }
        return (
          <span key={index} className="text-black punctuation">
            {token}
          </span>
        );
      } else {
        // Capitalize the token if it's the start of a sentence
        const capitalizedToken = capitalizeNext ? token.charAt(0).toUpperCase() + token.slice(1) : token;
        capitalizeNext = false; // Reset capitalization flag after capitalizing

        return (
          <span
            key={index}
            className={`bg-blue-100 px-2 py-1 ${isPunctuation ? '' : 'm-1'} rounded`}
          >
            {capitalizedToken}
          </span>
        );
      }
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Sentence Tokenizer</h1>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)} 
        className="mb-4 p-2 border rounded"
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        {/* Add more language options as needed */}
      </select>
      <textarea 
        value={sentence} 
        onChange={(e) => setSentence(e.target.value)} 
        placeholder="Enter a sentence" 
        className="p-2 w-full border rounded mb-4"
        rows={6}
      />
      <button 
        onClick={handleTokenize} 
        className="p-2 bg-blue-500 text-white rounded"
      >
        Tokenize
      </button>
      <div className="mt-4">
        {tokens.length > 0 && <h2 className="text-2xl font-semibold mb-2">Tokens:</h2>}
        <div className="flex flex-wrap items-baseline">
          {renderTokens(tokens)}
        </div>
        {idioms.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mt-4 mb-2">Idioms:</h2>
            <ul>
              {idioms.map((idiom, index) => (
                <li key={index} className="text-red-500">{idiom}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
