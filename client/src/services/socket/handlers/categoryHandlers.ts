// Channel Category Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import type { SocketHandlerContext } from '../types';

export interface ChannelCategory {
  id: string;
  workspaceId: string;
  name: string;
  position: number;
  collapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryPayload {
  id: string;
  workspaceId: string;
  name: string;
  position: number;
  collapsed?: boolean;
}

export function registerCategoryHandlers(context: SocketHandlerContext): void {
  const { socket, queryClient } = context;

  // category:created - New category created
  socket.on('category:created', (category: CategoryPayload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.channels(category.workspaceId)
    });
  });

  // category:updated - Category updated (name, collapsed state, position)
  socket.on('category:updated', (category: CategoryPayload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.channels(category.workspaceId)
    });
  });

  // category:deleted - Category deleted
  socket.on(
    'category:deleted',
    ({ workspaceId }: { categoryId: string; workspaceId: string }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels(workspaceId)
      });
    }
  );
}
