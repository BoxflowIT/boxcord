# Boxcord Optimization Analysis & Action Plan

## 🔍 Comprehensive Code Review (Pre-Video Implementation)

### ❌ CRITICAL ISSUES (Fix innan video)

#### 1. **Dubbel State Management - React Query + Zustand** 🚨

**Problem:**
```typescript
// Zustand store:
messages: Message[]  // Global array med ALLA messages
channels: Channel[]  // Duplicerad från React Query
workspaces: Workspace[]  // Duplicerad från React Query

// React Query:
useMessages() // Cachar samma messages
useChannels() // Cachar samma channels  
useWorkspaces() // Cachar samma workspaces

// WebSocket uppdaterar BÅDA:
socket.on('message:new', (msg) => {
  useChatStore.getState().addMessage(msg);  // Zustand
  queryClient.setQueryData(...); // React Query
});
```

**Konsekvens:**
- Dubbel memory usage
- Sync-problem mellan stores
- Extra complexity
- Svårt att debugga

**Lösning:**
```typescript
// Option A: Använd BARA React Query (rekommenderat för chat)
✅ React Query för ALL data (messages, channels, workspaces)
✅ Zustand BARA för UI state (currentChannel, currentWorkspace)
✅ WebSocket uppdaterar BARA React Query cache

// Option B: Använd BARA Zustand (enklare men mindre optimerat)
❌ Inte rekommenderat - React Query är bättre för server data
```

---

#### 2. **Messages Global State = Memory Leak Risk** 🚨

**Problem:**
```typescript
// chatStore.ts - ALLA messages i EN array
messages: Message[]  // växer oändligt!

// Ingen cleanup
// Ingen per-channel isolation
// Ingen memory management
```

**Konsekvens:**
- Efter 1h chattande: ~10,000 messages i minnet
- Efter 1 dag: ~100,000+ messages
- Browser blir långsam
- Memory leak

**Lösning:**
```typescript
// React Query's automatic garbage collection
useMessages(channelId) {
  staleTime: Infinity,
  gcTime: 10 * 60 * 1000  // Rensas efter 10min när unmounted
}

// Per-channel caching
queryKeys.messages(channelId)  // Isolerad per channel
// När du lämnar channel → garbage collected automatiskt!
```

---

#### 3. **Type Duplication** 🟡

**Problem:**
```typescript
// store/chat.ts
export interface Message { id, content, ... }

// types/message.ts  
export interface Message { id, content, ... }

// 2 olika definitions = sync-problem
```

**Lösning:**
```typescript
// types/message.ts (single source of truth)
export interface Message { ... }

// store/chat.ts
import type { Message } from '../types/message';
```

---

#### 4. **Ingen Error Handling UI** 🟡

**Problem:**
```typescript
try {
  await api.createChannel(...);
} catch (err) {
  console.error('Failed:', err);  // Användaren ser INGET!
}
```

**Saknas:**
- Error Boundaries
- Toast notifications
- Retry buttons
- User feedback

**Lösning:**
```typescript
// Add error handling med toast
import { toast } from 'react-hot-toast';

onError: (error) => {
  toast.error('Failed to create channel. Try again?');
}
```

---

#### 5. **För Många useState (Overcomplex Components)** 🟡

**Problem:**
```typescript
// Sidebar.tsx - 12 useState hooks! 😱
const [showNewChannel, setShowNewChannel] = useState(false);
const [showNewWorkspace, setShowNewWorkspace] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [editingChannel, setEditingChannel] = useState(null);
const [editingWorkspace, setEditingWorkspace] = useState(null);
const [deleteChannel, setDeleteChannel] = useState(null);
const [deleteWorkspace, setDeleteWorkspace] = useState(null);
// ... etc
```

**Lösning:**
```typescript
// useReducer för state machine
type ModalState = 
  | { type: 'idle' }
  | { type: 'creating-channel' }
  | { type: 'editing-channel', channel: Channel }
  | { type: 'deleting-channel', channel: Channel };

const [modalState, dispatch] = useReducer(modalReducer, { type: 'idle' });
```

---

### 🎥 VIDEO CALL PREPARATION (Saknas helt!)

#### 6. **Ingen WebRTC Infrastructure** 🚨

**Saknas:**
- Media permissions (camera/mic)
- Peer connection management  
- Signaling via WebSocket
- Ice candidate handling
- Audio/Video tracks management
- Screen sharing
- Call state management

**Behövs:**
```typescript
// client/src/services/webrtc.ts
class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  private remoteStreams: Map<string, MediaStream>;
  
  async getLocalMedia(audio: boolean, video: boolean);
  async createOffer(userId: string);
  async handleAnswer(userId: string, answer: RTCSessionDescription);
  async handleIceCandidate(userId: string, candidate: RTCIceCandidate);
}

// Signaling events via Socket
socket.on('call:offer', handleOffer);
socket.on('call:answer', handleAnswer);
socket.on('call:ice-candidate', handleIceCandidate);
socket.on('call:ended', handleCallEnd);
```

**Database schema för calls:**
```prisma
model Call {
  id          String   @id @default(cuid())
  channelId   String
  initiatorId String
  participants CallParticipant[]
  status      CallStatus  // RINGING, ACTIVE, ENDED
  startedAt   DateTime
  endedAt     DateTime?
}

model CallParticipant {
  id         String @id @default(cuid())
  callId     String
  userId     String
  joinedAt   DateTime
  leftAt     DateTime?
  audioEnabled Boolean @default(true)
  videoEnabled Boolean @default(true)
}
```

---

### 🔄 ARCHITECTURAL IMPROVEMENTS

#### 7. **Flytta från Zustand till React Query** (Rekommenderat)

**Varför:**
- React Query är GJORT för server state
- Automatic caching, garbage collection
- Optimistic updates built-in
- DevTools for debugging
- Mindre kod, mer features

**Nuvarande:**
```
┌─────────────────────────────────────┐
│  React Query (server data cache)   │
│  ↕ sync ↕                           │
│  Zustand (duplicate state)          │
│  ↕                                  │
│  React Components                   │
└─────────────────────────────────────┘
```

**Bättre:**
```
┌─────────────────────────────────────┐
│  React Query (ALL server data)     │ ← Single source
│    ↓                                │
│  Zustand (UI state only)           │ ← currentChannel, etc
│    ↓                                │
│  React Components                   │
└─────────────────────────────────────┘
```

---

#### 8. **Message Pagination Saknas** 🟡

**Problem:**
```typescript
// Laddar ALLA messages från början
useMessages(channelId) // → 10,000 messages!
```

**Lösning:**
```typescript
// Infinite query med cursors
useInfiniteQuery({
  queryKey: ['messages', channelId],
  queryFn: ({ pageParam }) => api.getMessages(channelId, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor
});

// Load more when scrolling up
<button onClick={() => fetchNextPage()}>Load older messages</button>
```

**Bonus: Virtualized Scrolling**
```typescript
// react-virtual för 60fps scrolling med 100,000+ messages
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

#### 9. **Ingen Error Boundary** 🟡

**Problem:**
- En crash i ChannelView = hela appen crashar
- Ingen graceful error handling

**Lösning:**
```typescript
// components/ErrorBoundary.tsx
<ErrorBoundary fallback={<ErrorView />}>
  <ChannelView />
</ErrorBoundary>
```

---

#### 10. **Ingen Loading States Strategy** 🟡

**Problem:**
```typescript
const { data, isLoading } = useMessages(channelId);

// Men vad med:
// - Initial load?
// - Background refetch?
// - Optimistic updates?
// - Stale data?
```

**Lösning:**
```typescript
const {
  data,
  isLoading,        // First load
  isFetching,       // Background refetch  
  isRefetching,     // User-triggered refetch
  isStale,          // Data might be old
  error             // Error state
} = useMessages(channelId);

// Show different UI for each state
```

---

### 📊 PERFORMANCE BEST PRACTICES (Saknas)

#### 11. **Ingen Memoization** 🟡

**Problem:**
```typescript
// ChannelView.tsx - re-renders på varje keystroke
const channelMessages = messages.filter(m => m.channelId === channelId);
// Ny array varje render!
```

**Lösning:**
```typescript
const channelMessages = useMemo(
  () => messages.filter(m => m.channelId === channelId),
  [messages, channelId]
);
```

#### 12. **Callbacks Inte Memoized** 🟡

**Problem:**
```typescript
<MessageItem
  onEdit={(id) => handleEdit(id)}  // Ny function varje render
  onDelete={(id) => handleDelete(id)}
/>
```

**Lösning:**
```typescript
const handleEdit = useCallback((id: string) => {
  // ...
}, [dependencies]);
```

---

## 🎯 PRIORITERAD ACTION PLAN

### **PHASE 1: Critical Fixes (Before Video)** 🔴

1. **Consolidate State Management** (2-3h)
   - [ ] Ta bort messages från Zustand
   - [ ] Använd BARA React Query för server data
   - [ ] Zustand bara för UI state (currentChannel, etc)

2. **Fix Type Duplication** (30min)
   - [ ] En Message interface (types/message.ts)
   - [ ] Import överallt

3. **Add Error Handling** (1h)
   - [ ] Install react-hot-toast
   - [ ] Add toast.error() i alla mutations
   - [ ] Add Error Boundary

4. **Reduce useState Complexity** (1-2h)
   - [ ] Refactor Sidebar till useReducer
   - [ ] Extract custom hooks

### **PHASE 2: WebRTC Foundation** 🎥

5. **WebRTC Service** (4-6h)
   - [ ] Create webrtc.ts service
   - [ ] Media permissions
   - [ ] Peer connection setup
   - [ ] Signaling via WebSocket

6. **Call UI Components** (4-6h)
   - [ ] CallButton component
   - [ ] CallWindow component
   - [ ] Video grid layout
   - [ ] Audio/Video controls

7. **Database Schema** (1h)
   - [ ] Call model
   - [ ] CallParticipant model
   - [ ] Migration

### **PHASE 3: Performance** ⚡

8. **Message Pagination** (2-3h)
   - [ ] useInfiniteQuery
   - [ ] Cursor-based pagination
   - [ ] "Load more" button

9. **Virtualized Scrolling** (2-3h)
   - [ ] Install @tanstack/react-virtual
   - [ ] Implement in MessageList
   - [ ] Test with 10,000+ messages

10. **Memoization** (1-2h)
    - [ ] useMemo för filtered lists
    - [ ] useCallback för event handlers
    - [ ] React.memo för components

---

## 📋 QUICK WINS (Do Now!)

### **1. Remove Message Duplication** ⚡
```bash
# Ta bort messages från Zustand store
# Använd BARA React Query
```

### **2. Add Toast Notifications** ⚡
```bash
npm install react-hot-toast
```

### **3. Fix Type Duplication** ⚡
```typescript
// Ta bort duplicate Message interface
// Import från types/message.ts överallt
```

---

## 🎯 ESTIMATED TIME

| Phase | Time | Priority |
|-------|------|----------|
| Phase 1 (Critical Fixes) | 5-7h | 🔴 HIGH |
| Phase 2 (WebRTC) | 10-15h | 🟡 MEDIUM |
| Phase 3 (Performance) | 6-10h | 🟢 LOW |

**Total:** ~20-30h of work

---

## 🚀 RECOMMENDED ORDER

1. **Fix State Management** (MUST innan video)
2. **Add Error Handling** (MUST för UX)
3. **WebRTC Infrastructure** (för video)
4. **Call UI**  (för video)
5. **Performance** (nice-to-have)

---

## 💡 FINAL RECOMMENDATIONS

### **DO:**
✅ Flytta till full React Query för server state
✅ Zustand bara för UI state
✅ WebRTC service layer
✅ Error boundaries + toast notifications
✅ useReducer för complex state

### **DON'T:**
❌ Behåll dubbel state (React Query + Zustand messages)
❌ Ignorera error handling
❌ Implementera video utan WebRTC service
❌ Glöm pagination (memory leak risk)

---

## 🎬 READY FOR VIDEO?

**Not yet!** Fix these first:
1. State management (Phase 1)
2. Error handling (Phase 1)  
3. WebRTC service (Phase 2)

**Then:** Video calls will be built on solid foundation! 🎥
