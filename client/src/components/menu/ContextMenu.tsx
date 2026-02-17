// Context Menu - Right-click context menu
import React, { useState, useEffect, useRef } from 'react';

interface ContextMenuProps {
  children: React.ReactNode;
  menu: React.ReactNode;
  disabled?: boolean;
}

export default function ContextMenu({
  children,
  menu,
  disabled = false
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y
          }}
          className="z-50 min-w-[200px] py-1 bg-boxflow-darker border border-boxflow-border rounded-lg shadow-xl"
        >
          <div onClick={() => setIsOpen(false)}>{menu}</div>
        </div>
      )}
    </>
  );
}
