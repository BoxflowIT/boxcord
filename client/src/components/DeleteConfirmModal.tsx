// Delete Confirmation Modal
import { ReactNode } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ta bort',
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-dark p-6 rounded-lg w-96 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="text-gray-300 mb-6">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
