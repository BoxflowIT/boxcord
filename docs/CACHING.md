# React Query Caching - Documentation

## Overview

We use **@tanstack/react-query** to automatically cache API calls and avoid unnecessary requests.

## ✅ What We Have Implemented

### 1. Global QueryClient Setup

**File:** `client/src/App.tsx`

- QueryClientProvider wraps the entire app
- Global cache settings:
  - `staleTime: 2 minutes` - Data is "fresh" for 2 minutes
  - `gcTime: 5 minutes` - Cache retained for 5 minutes (formerly cacheTime)
  - `retry: 1` - Maximum 1 retry on error
  - Automatic refetch when user returns to tab
  - Automatic refetch when internet reconnects

### 2. Custom Hooks

**File:** `client/src/hooks/useQuery.ts`

#### Available Hooks

**useWorkspaces()**
- Cached for 5 minutes
- Automatic refetch every 30 seconds
- Used in: Chat.tsx

**useChannels(workspaceId)**
- Cached for 5 minutes per workspace
- Automatic refetch every 30 seconds
- Used in: Chat.tsx

**useDMChannels()**
- Cached for 3 minutes
- Automatic refetch every 20 seconds
- Used by: DMList.tsx

**useOnlineUsers()**
- Cached for 30 seconds
- Automatic refetch every 15 seconds
- Used by: MemberList.tsx

**useCurrentUser()**
- Cached for 10 minutes
- Used by: ProfileModal.tsx

**useUser(userId)**
- Cached for 5 minutes per user
- Used by: ProfileModal.tsx

**useUsers(userIds[])**
- Cached for 5 minutes per batch
- Fetches multiple users simultaneously
- Used by: DMList.tsx to fetch all DM participants in one sweep

**useReactions(messageId)**
- Cached for 30 seconds
- Also updated in real-time via WebSocket
- Used by: MessageReactions.tsx

**useMessages(channelId, cursor?)**
- Cached for 1 minute
- Updated in real-time via WebSocket
- Used by: WelcomeView.tsx

**useCreateChannel()**
- Invalidates channels cache for specific workspace
- Automatic refetch of channels

**useDeleteWorkspace()**
- Invalidates workspaces cache after deletion

**useDeleteChannel()**
- Invalidates all channels queries after deletion

**useUpdateProfile()**
- Invalidates current user cache after profile change
- Automatic refetch of user data
- Used by: ProfileModal.tsx

**useUpdateUserRole()**
- Invalidates user cache for specific user
- Invalidates online users cache
- Used by: ProfileModal.tsx for admin functions

## 🚀 Benefits

### 1. **Deduplication**

If two components call the same endpoint simultaneously → **only 1 request is sent!**

**Example:**

```tsx
// Both calls are automatically deduplicated
const { data: ws1 } = useWorkspaces(); // Component A
const { data: ws2 } = useWorkspaces(); // Component B
// → Only 1 API call to /api/v1/workspaces
```

### 2. **Instant Loading from Cache**

When data already exists in cache → **instant display, no loading!**

**Example:**

```tsx
// First time: loads from API
const { data, isLoading } = useWorkspaces();
// isLoading = true, then false when data loaded

// Second time (within 5 min): instant from cache
const { data, isLoading } = useWorkspaces();
// isLoading = false immediately, data shown instantly
```

### 3. **Background Refetch**

Data updates in background without showing spinner

**Example:**

```tsx
// Data shown directly from cache (2 min old)
const { data } = useWorkspaces();
// ✅ Data displayed immediately

// In background: refetch after 30 seconds
// ✅ Updated data smoothly replaces cache
```

### 4. **Automatic Updates**

- When user focuses on tab again
- When internet reconnects
- With configured intervals (15-30 sec)

## 📊 Cache Timings

| Hook             | Stale Time | Refetch Interval | Usage                      |
|------------------|------------|------------------|----------------------------|
| useWorkspaces    | 5 min      | 30 sec           | Workspace list             |
| useChannels      | 5 min      | 30 sec           | Channel list               |
| useDMChannels    | 3 min      | 20 sec           | DM channel list            |
| useOnlineUsers   | 30 sec     | 15 sec           | Online users (presence)    |
| useCurrentUser   | 10 min     | -                | Current user               |
| useUser          | 5 min      | -                | User profiles              |
| useMessages      | 1 min      | -                | Channel messages           |
| useDMMessages    | 1 min      | -                | DM messages                |

## 📊 Before vs After

### BEFORE (without caching)

```
Chat.tsx: api.getWorkspaces()      → Request 1
WelcomeView: api.getWorkspaces()   → Request 2 (duplicate!)
Chat.tsx: api.getChannels()        → Request 3
Sidebar.tsx: api.getChannels()     → Request 4 (duplicate!)
DMList.tsx: api.getDMChannels()    → Request 5
DMView.tsx: api.getDMChannels()    → Request 6 (duplicate!)
DMList.tsx: api.getUser(user1)     → Request 7
DMList.tsx: api.getUser(user2)     → Request 8
DMList.tsx: api.getUser(user3)     → Request 9
... (if you have 15 DMs = 15 extra getUser requests!)
ProfileModal: api.getCurrentUser() → Request 10
ProfileModal: api.getUser()        → Request 11 (opened again)
MemberList: api.getOnlineUsers()   → Request 12

Total: 12+ requests (half duplicated!)
```

### AFTER (with React Query)

```
Chat.tsx: useWorkspaces()          → Request 1 → cache
WelcomeView: useWorkspaces()       → ✅ from cache (0 requests)
Chat.tsx: useChannels()            → Request 2 → cache
Sidebar: workspace switch          → ✅ from cache (0 requests)
DMList: useDMChannels()            → Request 3 → cache
DMView: useDMChannels()            → ✅ from cache (0 requests)
DMList: useUsers([15 user ids])    → Request 4 → cache all users
ProfileModal: useCurrentUser()     → Request 5 → cache
ProfileModal: opened again         → ✅ from cache (0 requests)
MemberList: useOnlineUsers()       → Request 6 → cache

Total: 6 requests (all others from cache!)
→ 50-70% fewer API calls! 🎉
```

## 🔍 Debug React Query

To see cache status during development, install:

```bash
npm install @tanstack/react-query-devtools
```

Add to App.tsx:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {/* Your app */}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## 🎯 Best Practices

1. **Use hooks instead of direct API calls**

   ```tsx
   // ❌ Old method
   useEffect(() => {
     api.getWorkspaces().then(setData);
   }, []);
   
   // ✅ New method with caching
   const { data } = useWorkspaces();
   ```

2. **Invalidate cache after mutations**

   ```tsx
   const { mutate } = useCreateWorkspace();
   mutate({ name: 'New' }, {
     onSuccess: () => {
       // Cache invalidated automatically!
     }
   });
   ```

3. **Use enabled for conditional queries**

   ```tsx
   const { data } = useChannels(workspaceId, {
     enabled: !!workspaceId // Only run if workspaceId exists
   });
   ```

## 📈 Results

- ✅ **Fewer API calls** - Deduplication + cache
- ✅ **Faster UX** - Instant loading from cache
- ✅ **Less load** - On both frontend and backend
- ✅ **Better offline support** - Data available in cache even offline
- ✅ **Automatic sync** - Background refetch keeps data updated

