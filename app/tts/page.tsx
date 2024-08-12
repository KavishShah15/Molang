"use client";
import { useState, FormEvent } from 'react';

export default function Home() {
  const [text, setText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    setAudioUrl(data.audioUrl);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Text-to-Speech Demo</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4} // Corrected type: number instead of string
          cols={50} // Corrected type: number instead of string
          placeholder="Enter text to convert to speech"
        />
        <br />
        <button type="submit">Generate Speech</button>
      </form>
      {audioUrl && (
        <div>
          <h2>Generated Speech:</h2>
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
}
