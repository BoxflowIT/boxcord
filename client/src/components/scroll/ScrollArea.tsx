// Scroll Area - Custom scrollable area with styled scrollbar
import React, { useRef, useEffect } from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  maxHeight?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
}

export default function ScrollArea({
  children,
  autoScroll = false,
  maxHeight = '100%',
  onScroll,
  className = ''
}: ScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children, autoScroll]);

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{ maxHeight }}
      className={`overflow-y-auto scrollbar-thin ${className}`}
    >
      {children}
    </div>
  );
}
