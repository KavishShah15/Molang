"use client"
import React, { useState } from 'react';
import { AggressiveTokenizer, AggressiveTokenizerFr, AggressiveTokenizerDe, AggressiveTokenizerHi } from 'natural/lib/natural/tokenizers';

const tokenizers = {
  en: new AggressiveTokenizer(),
  fr: new AggressiveTokenizerFr(),
  de: new AggressiveTokenizerDe(),
  hi: new AggressiveTokenizerHi(),
};

const Home: React.FC = () => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string>("");
  const [language, setLanguage] = useState<keyof typeof tokenizers>("en"); // Typed to match the keys of `tokenizers`

  const handleTokenize = () => {
    const tokenizer = tokenizers[language];
    const tokens = tokenizer.tokenize(sentence);
    setTokens(tokens);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sentence Tokenizer</h1>
      <select value={language} onChange={(e) => setLanguage(e.target.value as keyof typeof tokenizers)} style={{ marginBottom: '1rem' }}>
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="hi">Hindi</option>
        {/* Add more language options as needed */}
      </select>
      <input 
        type="text" 
        value={sentence} 
        onChange={(e) => setSentence(e.target.value)} 
        placeholder="Enter a sentence" 
        style={{ padding: '0.5rem', width: '100%' }}
      />
      <button onClick={handleTokenize} style={{ marginTop: '1rem', padding: '0.5rem' }}>
        Tokenize
      </button>
      <div style={{ marginTop: '1rem' }}>
        {tokens.length > 0 && <h2>Tokens:</h2>}
        <ul>
          {tokens.map((token, index) => (
            <li key={index}>{token}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
