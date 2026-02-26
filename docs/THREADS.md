# Thread Support Implementation

## Overview

Thread support has been fully implemented with backend infrastructure, real-time WebSocket events, and frontend React components.

## Features

- ✅ Create threads from any message
- ✅ Reply to threads with nested conversations
- ✅ Follow/unfollow threads for notifications
- ✅ Mark threads as read
- ✅ Real-time updates via WebSocket
- ✅ Thread sidebar UI
- ✅ Unread thread count badges
- ✅ Lock threads (for admins/moderators)

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
| DELETE | `/:id` | Delete thread |
| GET | `/:id/replies` | Get thread replies (paginated) |
| POST | `/:id/replies` | Add reply to thread |
| POST | `/:id/follow` | Follow/unfollow thread |
| POST | `/:id/read` | Mark thread as read |

### WebSocket Events

#### Client → Server

- `thread:create` - Create a thread from a message
- `thread:reply` - Add a reply to a thread
- `thread:updated` - Update thread metadata
- `thread:deleted` - Delete a thread
- `thread:follow` - Follow/unfollow a thread
- `thread:read` - Mark thread as read

#### Server → Client

- `thread:created` - Broadcast when thread is created
- `thread:reply` - Broadcast when new reply is added
- `thread:updated` - Broadcast when thread metadata changes
- `thread:deleted` - Broadcast when thread is deleted

## Frontend Integration

### 1. Add ThreadSidebar to App Layout

Import and add the ThreadSidebar component to your main App layout:

```tsx
import { ThreadSidebar } from './components/thread/ThreadSidebar';

function App() {
  return (
    <div className="app">
      {/* Your existing layout */}
      <MainContent />
      
      {/* Add thread sidebar */}
      <ThreadSidebar />
    </div>
  );
}
```

### 2. Initialize WebSocket Listener

In your socket initialization, add the thread socket hook:

```tsx
import { useThreadSocket } from './hooks/useThreadSocket';

function YourComponent() {
  const socket = useSocket(); // Your socket instance
  
  // Initialize thread WebSocket listeners
  useThreadSocket(socket);
  
  // ... rest of component
}
```

### 3. Add Thread Button to Messages

Update your message component to include thread actions:

```tsx
import { useThreadStore } from './store/thread';
import { createThread } from './hooks/useThreads';

function MessageComponent({ message }) {
  const openThreadSidebar = useThreadStore((state) => state.openThreadSidebar);
  
  const handleStartThread = async () => {
    try {
      // Check if thread already exists
      const existingThread = await getThreadByMessageId(message.id);
      
      if (existingThread) {
        // Open existing thread
        openThreadSidebar(existingThread.id);
      } else {
        // Create new thread
        const thread = await createThread(message.id);
        openThreadSidebar(thread.id);
      }
    } catch (err) {
      console.error('Failed to start thread:', err);
    }
  };
  
  return (
    <MessageActions
      messageId={message.id}
      onStartThread={handleStartThread}
      hasThread={message.threadId != null}
      threadReplyCount={message.thread?.replyCount || 0}
      // ... other props
    />
  );
}
```

### 4. Load Threads for Channel

In your channel view, fetch and display threads:

```tsx
import { useThreads } from './hooks/useThreads';

function ChannelView({ channelId }) {
  const { threads, loading, error } = useThreads(channelId);
  
  // Threads are automatically synced via WebSocket
  // You can display thread count or active threads UI here
  
  return (
    <div>
      {/* Your channel content */}
      
      {threads.length > 0 && (
        <div className="thread-indicator">
          {threads.length} active threads
        </div>
      )}
    </div>
  );
}
```

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

## State Management

The thread store (Zustand) manages:

- Thread list per channel
- Active thread (sidebar state)
- Thread replies
- Unread counts
- Loading/error states

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

## Next Steps

- [ ] Add thread indicators in message list UI
- [ ] Add "Threads" tab/panel to show all active threads
- [ ] Add thread notifications to notification center
- [ ] Add thread search functionality
- [ ] Add thread archiving/resolving
- [ ] Add thread moderator controls (lock, delete)
- [ ] Add thread analytics (most active threads, etc.)

## Migration

The database migration `20260225145838_add_thread_support` has been applied and includes:

- Thread table
- ThreadParticipant table
- Indexes for performance
- Foreign key constraints

## Notes

- Threads are channel-specific (DMs don't support threads)
- Thread replies use the existing `Message.parentId` field
- Thread metadata is tracked separately in the Thread table
- Following a thread automatically happens when you reply
- Unread counts are calculated based on `ThreadParticipant.lastReadAt`
