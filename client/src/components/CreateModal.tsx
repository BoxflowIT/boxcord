// Create Modal for Channel or Workspace
import { useState, KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
          setName('');
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Avbryt
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            {createButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
