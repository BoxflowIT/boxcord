/**
 * KeyRecorder Component
 * Records keyboard combinations for custom shortcuts
 */
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/classNames';

interface KeyRecorderProps {
  value: string;
  onChange: (keys: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function KeyRecorder({
  value,
  onChange,
  placeholder = 'Press keys...',
  disabled = false
}: KeyRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Build key combination
      const keys: string[] = [];

      if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');

      // Map special keys
      const keyMap: Record<string, string> = {
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        ' ': 'Space'
      };

      // Add the main key (not modifier keys)
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        const mainKey = keyMap[e.key] || e.key.toUpperCase();
        keys.push(mainKey);
      }

      // Update display
      setCurrentKeys(keys);

      // If we have at least one modifier + key, or arrow key, save it
      if (
        keys.length >= 2 ||
        ['↑', '↓', '←', '→', 'Space'].includes(keys[keys.length - 1])
      ) {
        const keyCombination = keys.join('+');
        onChange(keyCombination);
        setIsRecording(false);
        setCurrentKeys([]);
      }
    };

    const handleKeyUp = () => {
      // Clear display on key up if recording
      setCurrentKeys([]);
    };

    const handleBlur = () => {
      setIsRecording(false);
      setCurrentKeys([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isRecording, onChange]);

  const handleStartRecording = () => {
    if (disabled) return;
    setIsRecording(true);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setCurrentKeys([]);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        ref={inputRef}
        onClick={handleStartRecording}
        disabled={disabled}
        className={cn(
          'px-4 py-2 rounded-lg min-w-[200px] text-left transition-all',
          isRecording ? 'settings-btn-active animate-pulse' : 'settings-btn',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isRecording && currentKeys.length > 0 ? (
          <span className="font-mono">{currentKeys.join('+')}</span>
        ) : isRecording ? (
          <span className="text-boxflow-muted animate-pulse">
            {placeholder}
          </span>
        ) : value ? (
          <span className="font-mono font-semibold">{value}</span>
        ) : (
          <span className="text-boxflow-muted">{placeholder}</span>
        )}
      </button>

      {value && !disabled && (
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg text-boxflow-muted hover:text-danger hover:bg-danger-10 transition-colors"
          title="Clear shortcut"
        >
          ✕
        </button>
      )}

      {isRecording && (
        <span className="text-xs text-boxflow-muted animate-pulse">
          Recording...
        </span>
      )}
    </div>
  );
}
