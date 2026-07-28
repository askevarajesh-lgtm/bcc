import React from 'react';

const LinkifiedText = ({ text, style }) => {
  if (!text) return null;

  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return (
    <span style={{ whiteSpace: 'pre-wrap', ...style }}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default LinkifiedText;
