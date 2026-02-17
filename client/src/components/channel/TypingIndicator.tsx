// Typing Indicator - Show who's typing
import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  users: string[];
  maxDisplay?: number;
  className?: string;
}

export default function TypingIndicator({
  users,
  maxDisplay = 3,
  className = ''
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (users.length === 0) return null;

  const displayUsers = users.slice(0, maxDisplay);
  const remaining = users.length - maxDisplay;

  let text = '';
  if (displayUsers.length === 1) {
    text = `${displayUsers[0]} skriver`;
  } else if (displayUsers.length === 2) {
    text = `${displayUsers[0]} och ${displayUsers[1]} skriver`;
  } else {
    text = `${displayUsers.join(', ')}${remaining > 0 ? ` och ${remaining} till` : ''} skriver`;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm text-muted italic px-4 py-2 ${className}`}
    >
      <span className="flex gap-1">
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </span>
      <span>
        {text}
        {dots}
      </span>
    </div>
  );
}
