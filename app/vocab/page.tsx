"use client";

import { useState, useRef, useEffect, MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';

const TestGenerate = () => {
  const [response, setResponse] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false); // Fixed typo here
  const textContainerRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString() || '';
    setSelectedText(selected);

    if (selection?.rangeCount && selected.trim().length > 0) {
      setIsHighlighted(true);
    } else {
      setIsHighlighted(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      textContainerRef.current &&
      !textContainerRef.current.contains(event.target as Node) && // Casting event.target to Node
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node) // Casting event.target to Node
    ) {
      setIsHighlighted(false);
      setSelectedText('');
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside as any); // Ensure this is cast to the correct type
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as any); // Ensure this is cast to the correct type
    };
  }, []);

  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText }),
      });
      const data = await res.json();
      setResponse(data.result || []);
    } catch (error) {
      console.error(error);
      setResponse([]);
    }
  };

  const textContent = `
    "When John decided to start his own business, he knew it wouldn't be a piece of cake. He jumped on the bandwagon of tech startups, hoping to strike it rich. However, it wasn’t long before he realized he had bitten off more than he could chew. Despite facing numerous challenges and almost throwing in the towel a few times, he kept his nose to the grindstone. Finally, after what felt like a lifetime, he saw the light at the end of the tunnel. His perseverance paid off, and his business took off, proving that every cloud has a silver lining."
  `;

  const renderResponse = (response: any[]) => {
    return response.map((item, index) => {
      let explanation = item.explanation || '';
      explanation = explanation.replace(/\*\*(.*?)\*\*/g, '<u>$1</u>'); // Replace **text** with <u>text</u>

      return (
        <div key={index} className="mb-4 p-4 border border-gray-300 rounded-lg bg-white shadow-md">
          <h3 className="font-bold mb-2">{item.term}</h3>
          <p><strong>Category:</strong> {item.category}</p>
          {item.category !== 'grammar' && item.pronunciation && <p><strong>Pronunciation:</strong> {item.pronunciation}</p>}
          {item.category !== 'grammar' && item.partOfSpeech && <p><strong>Part of Speech:</strong> {item.partOfSpeech}</p>}
          {item.category !== 'grammar' && <p><strong>Definition:</strong> {item.definition}</p>}
          {item.category !== 'grammar' && (
            <p><strong>Usage:</strong> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.usage.replace(/\*\*(.*?)\*\*/g, '<u>$1</u>')) }} /></p>
          )}
          {item.otherForms && Object.keys(item.otherForms).length > 0 && (
            <div>
              <strong>Other Forms:</strong>
              <ul>
                {Object.keys(item.otherForms).map((formKey) => (
                  <li key={formKey}>{formKey}: {item.otherForms[formKey]}</li>
                ))}
              </ul>
            </div>
          )}
          {item.explanation && (
            <p><strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explanation) }} /></p>
          )}
          {item.audio && (
            <audio controls>
              <source src={item.audio} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-4 relative">
      <p
        onMouseUp={handleTextSelection}
        ref={textContainerRef}
        className="w-1/2 mb-4 p-2 border border-gray-300 rounded cursor-pointer"
      >
        {textContent}
      </p>
      {isHighlighted && (
        <div className="fixed top-4 right-4 z-50" ref={buttonRef}>
          <Button
            onClick={handleGenerate}
            className="bg-blue-500 text-white p-2 rounded"
            disabled={!selectedText}
          >
            Explain
          </Button>
        </div>
      )}
      {response.length > 0 && (
        <div className="mt-4">
          {renderResponse(response)}
          <div className="bg-gray-100 p-4 rounded-lg shadow-md prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {`### Raw JSON Response:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestGenerate;
