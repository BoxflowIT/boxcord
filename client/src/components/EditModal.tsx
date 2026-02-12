// Edit Modal for Channel or Workspace
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

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

  const handleSave = () => {
    onSave({ name, description, ...(showIcon && { iconUrl }) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {showIcon ? 'Servernamn' : 'Kanalnamn'}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Beskrivning
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valfritt"
            />
          </div>
          {showIcon && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Ikon-URL (bild)
              </label>
              <Input
                type="text"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
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
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
