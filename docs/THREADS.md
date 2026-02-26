# Thread Support

## Overview

Thread support is fully implemented with backend REST API, real-time WebSocket events, Zustand state management, and a complete React component library.

## Features

- ✅ Create threads from any channel message
- ✅ Reply to threads with nested conversations
- ✅ Edit and delete thread replies (author only)
- ✅ Emoji reactions on thread replies (with optimistic updates)
- ✅ Follow/unfollow threads for notifications
- ✅ Auto-follow when replying to a thread
- ✅ Mark threads as read
- ✅ Unread thread count badges
- ✅ Real-time updates via WebSocket (all CRUD operations)
- ✅ Thread sidebar UI with composer
- ✅ Thread context menu (right-click)
- ✅ Following threads list panel
- ✅ Lock threads (for admins/moderators)
- ✅ Thread deletion with full cleanup (replies, reactions, attachments)
- ✅ File attachments in thread replies
- ✅ Keyboard quick reactions (1-5) route to threads when sidebar is open
- ✅ Notification sounds for new thread replies

## Backend API

### REST Endpoints

All endpoints are prefixed with `/api/v1/threads`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/?channelId=X` | List all threads in a channel |
| POST | `/` | Create a new thread |
| GET | `/:id` | Get thread details |
| GET | `/by-message/:messageId` | Get thread by root message |
| PATCH | `/:id` | Update thread (title, lock status) |
| DELETE | `/:id` | Delete thread and all replies |
| GET | `/:id/replies` | Get thread replies (paginated) |
| POST | `/:id/replies` | Add reply to thread |
| PATCH | `/:id/replies/:replyId` | Edit a thread reply |
| DELETE | `/:id/replies/:replyId` | Delete a thread reply |
| POST | `/:id/replies/:replyId/reactions` | Add reaction to reply |
| DELETE | `/:id/replies/:replyId/reactions/:emoji` | Remove reaction from reply |
| POST | `/:id/follow` | Follow/unfollow thread |
| POST | `/:id/read` | Mark thread as read |

**📖 See:** [API.md](API.md#-threads) for complete request/response examples.

### WebSocket Events

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `thread:created` | `{ thread }` | Broadcast when thread is created |
| `thread:reply` | `{ threadId, reply }` | Broadcast when new reply is added |
| `thread:reply:edited` | `{ threadId, replyId, content, userId }` | Broadcast when reply is edited |
| `thread:reply:deleted` | `{ threadId, replyId }` | Broadcast when reply is deleted |
| `thread:reply:reaction` | `{ threadId, replyId, emoji, action, userId }` | Broadcast when reaction is toggled |
| `thread:updated` | `{ thread }` | Broadcast when thread metadata changes |
| `thread:deleted` | `{ threadId }` | Broadcast when thread is deleted |

## Frontend Architecture

### Components

All thread components are in `client/src/components/thread/`:

| Component | Description |
|-----------|-------------|
| `ThreadSidebar` | Main sidebar container, manages open/close state |
| `ThreadHeader` | Thread title bar with close, follow, and info buttons |
| `ThreadReplyList` | Scrollable list of thread replies |
| `ThreadReplyItem` | Individual reply with reactions, edit/delete actions |
| `ThreadReplyActions` | Hover actions for a thread reply (react, edit, delete) |
| `ThreadComposer` | Message input for composing thread replies |
| `ThreadInfo` | Thread metadata panel (participants, creation date) |
| `ThreadContextMenu` | Right-click context menu for thread operations |
| `FollowingThreadsList` | Panel showing all threads the user is following |
| `FollowingThreadItem` | Individual item in the following threads list |

### State Management

Thread state is managed by Zustand with Immer middleware (`client/src/store/thread.ts`):

```typescript
interface ThreadState {
  threads: Record<string, Thread[]>;      // channelId -> threads[]
  activeThreadId: string | null;
  threadReplies: Record<string, ThreadReply[]>; // threadId -> replies[]
  isSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Key actions:**
- `setThreads` / `addThread` / `updateThread` / `removeThread` - Thread CRUD
- `openThreadSidebar` / `closeThreadSidebar` - Sidebar UI
- `setThreadReplies` / `addThreadReply` - Reply management
- `markThreadAsRead` / `setFollowing` - Read state and following

### Hooks

| Hook | File | Description |
|------|------|-------------|
| `useThreadSocket` | `hooks/useThreadSocket.ts` | WebSocket event listeners for all thread events. Uses individual Zustand selectors to prevent unnecessary re-renders. |
| `useThreads` | `hooks/useThreads.ts` | API functions for thread CRUD, replies, reactions, follow/unfollow. |

### Integration Points

**ChannelView** (`components/ChannelView.tsx`):
- Initializes thread socket listeners via `useThreadSocket`
- Renders `ThreadSidebar` alongside the message list
- Routes keyboard quick reactions (1-5) to thread replies when sidebar is open

**MessageItem** (`components/MessageItem.tsx`):
- Displays "X replies" thread indicator button
- `React.memo` comparator includes `hasThread`, `threadReplyCount`, `isPinned`

**MessageListDisplay** (`components/channel/MessageListDisplay.tsx`):
- Thread start/view handlers for messages
- Uses individual Zustand selectors for thread state

**Socket Service** (`services/socket/index.ts`):
- `toggleReaction` uses `queueOrExecute` for reliability during reconnections

**Message Handlers** (`services/socket/handlers/messageHandlers.ts`):
- Filters `message:new` events by `parentId` to separate channel messages from thread replies

## Database Schema

### Thread Model

```prisma
model Thread {
  id               String   @id @default(uuid())
  messageId        String   @unique
  channelId        String
  title            String?
  replyCount       Int      @default(0)
  participantCount Int      @default(0)
  lastReplyAt      DateTime?
  lastReplyBy      String?
  isLocked         Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  message      Message @relation(...)
  participants ThreadParticipant[]
}
```

### ThreadParticipant Model

```prisma
model ThreadParticipant {
  id            String    @id @default(uuid())
  threadId      String
  userId        String
  lastReadAt    DateTime?
  notifyOnReply Boolean   @default(true)
  createdAt     DateTime  @default(now())
  
  thread Thread @relation(...)
  
  @@unique([threadId, userId])
}
```

## Performance Considerations

### Optimistic Updates
- Thread reply reactions use an optimistic-first pattern: UI updates immediately, API call happens in background, rollback on error
- This prevents the "double reaction" bug where both optimistic update and socket event would increment

### Zustand Selectors
- `useThreadSocket` and `MessageListDisplay` use individual Zustand selectors (e.g., `useThreadStore(s => s.addThread)`) instead of subscribing to the entire store
- This prevents cascading re-renders when thread state changes

### Socket Reliability
- `toggleReaction` uses `queueOrExecute` to queue events during socket reconnection windows
- Thread reply reactions validate `response.ok` before processing

### Memoization
- `channelMessages` in `ChannelView` is memoized with `useMemo` to prevent recalculation on unrelated re-renders
- `MessageItem` uses `React.memo` with a custom `areEqual` comparator that includes `hasThread`, `threadReplyCount`, and `isPinned`

## Testing

### Manual Testing

1. **Create a thread:**
   - Send a message in a channel
   - Hover over the message
   - Click the thread icon
   - Thread sidebar opens

2. **Reply to thread:**
   - Open thread sidebar
   - Type a reply in the composer
   - Press Enter or click "Send Reply"
   - Reply appears in real-time

3. **Follow/unfollow:**
   - Click "Follow" button in thread header
   - Button changes to "Following"
   - You'll receive notifications for new replies

4. **Real-time sync:**
   - Open two browser windows
   - Create/reply to thread in one
   - See updates in real-time in the other

### API Testing

```bash
# Create thread
curl -X POST http://localhost:3001/api/v1/threads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messageId": "MESSAGE_ID", "title": "Thread title"}'

# Get threads for channel
curl http://localhost:3001/api/v1/threads?channelId=CHANNEL_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add reply
curl -X POST http://localhost:3001/api/v1/threads/THREAD_ID/replies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "My reply"}'
```

## Possible Future Enhancements

- [ ] Thread search functionality
- [ ] Thread archiving/resolving status
- [ ] Thread analytics (most active threads, etc.)
- [ ] Thread notifications in notification center panel
- [ ] Thread mentions (@user in thread replies)

## Migration

The database migration `20260225145838_add_thread_support` has been applied and includes:

- Thread table
- ThreadParticipant table
- Indexes for performance
- Foreign key constraints

## Notes

- Threads are channel-specific (DMs don't support threads)
- Thread replies use the existing `Message.parentId` field pointing to the root message
- Thread metadata is tracked separately in the Thread table
- Following a thread automatically happens when you reply
- Unread counts are calculated based on `ThreadParticipant.lastReadAt`
- Deleting a thread cascades: all reply messages, their reactions, and attachments are cleaned up
- Thread reply reactions are handled via dedicated endpoints (not the regular message reaction endpoints)

## See Also

- [API Documentation](API.md#-threads) - Complete REST API reference
- [Architecture](ARCHITECTURE.md) - WebSocket-first design
- [Features](FEATURES.md#-threads) - Feature overview
