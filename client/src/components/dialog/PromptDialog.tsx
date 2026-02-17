// Prompt Dialog - Input prompt dialog
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button, TextInput } from '../form';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = 'OK',
  cancelText = 'Avbryt',
  isLoading = false
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      if (!isLoading) {
        onClose();
        setValue('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        {message && <p className="text-gray-300 mb-4">{message}</p>}

        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          disabled={isLoading}
        />

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!value.trim() || isLoading}
          >
            {isLoading ? 'Laddar...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
