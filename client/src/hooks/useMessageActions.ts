// Custom hook for message editing and deletion
import { useState, useRef } from 'react';

export interface UseMessageActionsOptions {
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export interface UseMessageActionsReturn {
  editingMessageId: string | null;
  editContent: string;
  deleteMessageId: string | null;
  editTextareaRef: React.RefObject<HTMLTextAreaElement>;
  handleEditMessage: (messageId: string, currentContent: string) => void;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;
  handleDeleteMessage: (messageId: string) => void;
  handleConfirmDelete: () => Promise<void>;
  handleCancelDelete: () => void;
  setEditContent: (content: string) => void;
}

export function useMessageActions({
  onEdit,
  onDelete
}: UseMessageActionsOptions = {}): UseMessageActionsReturn {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
    setTimeout(() => editTextareaRef.current?.focus(), 0);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      await onEdit?.(editingMessageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeleteMessageId(messageId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteMessageId) return;

    try {
      await onDelete?.(deleteMessageId);
      setDeleteMessageId(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleCancelDelete = () => {
    setDeleteMessageId(null);
  };

  return {
    editingMessageId,
    editContent,
    deleteMessageId,
    editTextareaRef,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleConfirmDelete,
    handleCancelDelete,
    setEditContent
  };
}
