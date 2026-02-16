// Custom hook for message editing and deletion
import { useState, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

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
  const [editContent, setEditContentState] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Use refs to avoid re-creating callbacks when state changes
  const editingMessageIdRef = useRef<string | null>(null);
  const editContentRef = useRef('');
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);

  // Keep refs in sync
  editingMessageIdRef.current = editingMessageId;
  editContentRef.current = editContent;
  onEditRef.current = onEdit;
  onDeleteRef.current = onDelete;

  const handleEditMessage = useCallback(
    (messageId: string, currentContent: string) => {
      setEditingMessageId(messageId);
      setEditContentState(currentContent);
      setTimeout(() => editTextareaRef.current?.focus(), 0);
    },
    []
  );

  // IMPORTANT: No dependencies - uses refs to get current values
  const handleSaveEdit = useCallback(async () => {
    const messageId = editingMessageIdRef.current;
    const content = editContentRef.current.trim();
    if (!messageId || !content) return;

    try {
      await onEditRef.current?.(messageId, content);
      setEditingMessageId(null);
      setEditContentState('');
    } catch (err) {
      logger.error('Failed to edit message:', err);
    }
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContentState('');
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    setDeleteMessageId(messageId);
  }, []);

  // IMPORTANT: No dependencies - uses refs
  const handleConfirmDelete = useCallback(async () => {
    const messageId = deleteMessageId;
    if (!messageId) return;

    try {
      await onDeleteRef.current?.(messageId);
      setDeleteMessageId(null);
    } catch (err) {
      logger.error('Failed to delete message:', err);
    }
  }, [deleteMessageId]);

  const handleCancelDelete = useCallback(() => {
    setDeleteMessageId(null);
  }, []);

  const handleEditContentChange = useCallback((content: string) => {
    setEditContentState(content);
  }, []);

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
    setEditContent: handleEditContentChange
  };
}
