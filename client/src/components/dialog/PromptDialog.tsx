// Prompt Dialog - Input prompt dialog
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  confirmText,
  cancelText,
  isLoading = false
}: PromptDialogProps) {
  const { t } = useTranslation();
  const confirm = confirmText ?? t('common.ok');
  const cancel = cancelText ?? t('common.cancel');
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
            {cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!value.trim() || isLoading}
          >
            {isLoading ? t('common.loading') : confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
