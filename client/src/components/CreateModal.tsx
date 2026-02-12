// Create Modal for Channel or Workspace
import { useState, KeyboardEvent } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  createButtonText?: string;
  onCreate: (name: string) => void;
  onCancel: () => void;
}

export default function CreateModal({
  isOpen,
  title,
  placeholder,
  createButtonText = 'Skapa',
  onCreate,
  onCancel
}: CreateModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-dark p-6 rounded-lg w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-discord-darkest rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple mb-6"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
