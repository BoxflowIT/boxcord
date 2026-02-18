// Context Menu - Right-click context menu
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

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
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
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

  // Adjust position after menu renders to keep it in viewport
  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // If menu goes off right edge, move it left
      if (position.x + rect.width > viewportWidth - 10) {
        newX = viewportWidth - rect.width - 10;
      }

      // If menu goes off bottom edge, show it above the click point
      if (position.y + rect.height > viewportHeight - 10) {
        newY = position.y - rect.height;
        // If still off screen (very small viewport), just pin to top
        if (newY < 10) {
          newY = 10;
        }
      }

      // Ensure not off left edge
      if (newX < 10) newX = 10;

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    const clickPos = { x: e.clientX, y: e.clientY };
    setPosition(clickPos);
    setAdjustedPosition(clickPos); // Start at click position
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
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            maxHeight: 'calc(100vh - 20px)',
            overflowY: 'auto'
          }}
          className="z-50 min-w-[200px] py-1 bg-boxflow-darker border border-boxflow-border rounded-lg shadow-xl"
        >
          <div onClick={() => setIsOpen(false)}>{menu}</div>
        </div>
      )}
    </>
  );
}
