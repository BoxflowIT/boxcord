// Edit Modal for Channel or Workspace
import { useState } from 'react';

interface EditModalProps {
  isOpen: boolean;
  title: string;
  name: string;
  description?: string;
  iconUrl?: string;
  showIcon?: boolean;
  onSave: (data: {
    name: string;
    description: string;
    iconUrl?: string;
  }) => void;
  onCancel: () => void;
}

export default function EditModal({
  isOpen,
  title,
  name: initialName,
  description: initialDescription = '',
  iconUrl: initialIconUrl = '',
  showIcon = false,
  onSave,
  onCancel
}: EditModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [iconUrl, setIconUrl] = useState(initialIconUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ name, description, ...(showIcon && { iconUrl }) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-dark p-6 rounded-lg w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {showIcon ? 'Servernamn' : 'Kanalnamn'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-discord-darkest rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Beskrivning
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-discord-darkest rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              placeholder="Valfritt"
            />
          </div>
          {showIcon && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Ikon-URL (bild)
              </label>
              <input
                type="text"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="w-full px-3 py-2 bg-discord-darkest rounded text-white focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                placeholder="https://example.com/icon.png"
              />
              {iconUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={iconUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-gray-400">
                    Förhandsgranskning
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded transition-colors"
            disabled={!name.trim()}
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
}
