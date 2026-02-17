import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useCreateWorkspace, useDeleteWorkspace, queryKeys } from './useQuery';
import type { Workspace } from '../types';

interface UseWorkspaceOperationsProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onWorkspaceSelect: (workspace: Workspace | null) => void;
}

export function useWorkspaceOperations({
  workspaces,
  currentWorkspace,
  onWorkspaceSelect
}: UseWorkspaceOperationsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createWorkspaceMutation = useCreateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (name: string) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspaceMutation.mutateAsync({ name });
      onWorkspaceSelect(workspace);
      return workspace;
    } catch (err) {
      logger.error('Failed to create workspace:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (
    id: string,
    data: { name: string; description: string; iconUrl?: string }
  ) => {
    try {
      await api.updateWorkspace(id, data);
    } catch (err) {
      logger.error('Failed to update workspace:', err);
      throw err;
    }
  };

  const handleDelete = async (workspaceId: string) => {
    try {
      await deleteWorkspaceMutation.mutateAsync(workspaceId);

      // Navigate away if current workspace was deleted
      if (currentWorkspace?.id === workspaceId) {
        const remaining = workspaces.filter((w) => w.id !== workspaceId);
        if (remaining.length > 0) {
          onWorkspaceSelect(remaining[0]);
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      logger.error('Failed to delete workspace:', err);
      throw err;
    }
  };

  const handleLeave = async (workspaceId: string) => {
    try {
      await api.leaveWorkspace(workspaceId);

      // Invalidate workspaces query to refresh list
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });

      // Navigate away if current workspace was left
      if (currentWorkspace?.id === workspaceId) {
        const remaining = workspaces.filter((w) => w.id !== workspaceId);
        if (remaining.length > 0) {
          onWorkspaceSelect(remaining[0]);
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      logger.error('Failed to leave workspace:', err);
      throw err;
    }
  };

  return {
    isCreating,
    createWorkspace: handleCreate,
    updateWorkspace: handleUpdate,
    deleteWorkspace: handleDelete,
    leaveWorkspace: handleLeave
  };
}
