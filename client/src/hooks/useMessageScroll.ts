/**
 * useMessageScroll - Auto-scroll to bottom on new messages
 */
import { useEffect, useRef } from 'react';

export function useMessageScroll<T extends { id: string }>(messages: T[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return messagesEndRef;
}
