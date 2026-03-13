# Boxcord Architecture - Discord-Style Real-time System

## 🎯 Core Principle: WebSocket-First

Boxcord follows Discord's proven architecture: **WebSocket Gateway as the primary data source**, with HTTP REST API only for initial loads and explicit user actions.

---

## 📡 How it Works

### **1. Connection Flow**

```
User logs in
    ↓
HTTP: GET /users/me/init         (fetch user data)
HTTP: GET /workspaces            (fetch workspaces)
HTTP: GET /channels?workspace=X  (fetch channels)
    ↓
WebSocket: Connect with JWT token
WebSocket: Auto-join workspace rooms
    ↓
🟢 Connected! Now 100% real-time via WebSocket
```

### **2. Message Flow (Discord-style)**

```
┌──────────────────────────────────────────────┐
│  USER SENDS MESSAGE                          │
├──────────────────────────────────────────────┤
│                                              │
│  1. User types and hits Enter               │
│     ↓                                        │
│  2. HTTP: POST /messages (send to server)   │
│     ↓                                        │
│  3. Server broadcasts via WebSocket:        │
│     socket.to('channel:123')                │
│           .emit('message:new', message)     │
│     ↓                                        │
│  4. ALL clients receive WebSocket event     │
│     ↓                                        │
│  5. React Query cache updated directly      │
│     queryClient.setQueryData(...)           │
│     ↓                                        │
│  6. UI updates instantly (no refetch!)      │
│                                              │
└──────────────────────────────────────────────┘

Result: Zero unnecessary HTTP requests!
```

### **3. Channel Operations (with Optimistic Updates)**

```
┌──────────────────────────────────────────────┐
│  CREATE CHANNEL                              │
├──────────────────────────────────────────────┤
│                                              │
│  1. User clicks "Create Channel"            │
│     ↓                                        │
│  2. OPTIMISTIC UPDATE (instant UI)          │
│     - Add temp channel to cache             │
│     - UI shows it immediately               │
│     ↓                                        │
│  3. HTTP: POST /channels                    │
│     ↓                                        │
│  4. Server returns real channel             │
│     - Replace temp with real in cache       │
│     ↓                                        │
│  5. Server broadcasts to workspace:         │
│     socket.to('workspace:X')                │
│           .emit('channel:created', ch)      │
│     ↓                                        │
│  6. All other clients get it via WS         │
│     - Update their React Query cache        │
│     - UI syncs automatically                │
│                                              │
└──────────────────────────────────────────────┘

If error: Rollback optimistic update
```

---

## 🔄 Data Flow Comparison

### ❌ OLD WAY (Polling / Refetch)

```
Initial load:    HTTP GET /messages
After 60s:       HTTP GET /messages  (automatic refetch)
After 120s:      HTTP GET /messages  (automatic refetch)
After 180s:      HTTP GET /messages  (automatic refetch)
...forever...

Result: 
- Tons of unnecessary requests
- Delayed updates (up to 60s)
- Wastes bandwidth
- Server load increases
```

### ✅ NEW WAY (WebSocket-First)

```
Initial load:    HTTP GET /messages  (ONE TIME)
After that:      WebSocket events only
  - message:new
  - message:edit
  - message:delete
  - All in real-time (<100ms)

Load history:    HTTP GET /messages?cursor=X  (user scrolls up)
Search:          HTTP GET /messages/search     (user searches)

Result:
- Minimal HTTP requests
- Real-time updates (<100ms)
- Much lower bandwidth
- Server scales better
```

---

## 🎨 React Query Cache Strategy

All cache times are defined in `client/src/hooks/queries/constants.ts`.

### **Core Entities (staleTime: Infinity)**

```typescript
// Messages, Channels, Workspaces, Users — ALL use Infinity
export const CACHE_TIMES = {
  WORKSPACES:   { stale: Infinity, gc: 60 * 60 * 1000 },   // 1h gc
  CHANNELS:     { stale: Infinity, gc: 60 * 60 * 1000 },   // 1h gc
  MESSAGES:     { stale: Infinity, gc: 10 * 60 * 1000 },   // 10min gc
  USERS:        { stale: Infinity, gc: 30 * 60 * 1000 },   // 30min gc
  CURRENT_USER: { stale: Infinity, gc: 60 * 60 * 1000 },   // 1h gc
};
```

**Why Infinity for everything?**

- WebSocket events update cache immediately via `setQueryData`
- No need to refetch from server — data is always 100% fresh
- Zero background polling — WebSocket handles all real-time updates
- Discord uses the exact same pattern

### **Non-Core Entities (time-based staleTime)**

| Hook | staleTime | Why? |
|------|-----------|------|
| Voice channel users | `10s` | Presence changes frequently |
| Pinned messages/DMs | `30s` | Pins change infrequently |
| Bookmarks / count | `30s` | Not updated via WebSocket |
| Permissions | `30s` | Rarely change |

### **Centralized API Service**

All hooks use `client/src/services/api.ts` — a single HTTP layer with auth headers, 401 auto-refresh, and typed responses. No raw `fetch()` calls anywhere.

- **401 auto-refresh** — On 401, the API tries refreshing the Cognito token via a locked `refreshOnce()` promise (prevents concurrent refresh races). Falls back to logout only if refresh fails.
- **Socket reconnect** — On `connect_error` with token errors, the socket handler refreshes the token and updates `socket.auth` before the next retry.
- **Desktop sleep/wake** — `powerMonitor.resume` triggers token refresh → socket reconnect → cache invalidation.

### **WebSocket → Cache Updates**

Socket events use targeted `setQueryData` instead of `invalidateQueries`:

```typescript
// ✅ Direct cache update — zero refetch
socket.on('user:update', (user) => {
  queryClient.setQueryData(['user', user.id], user);
  queryClient.setQueryData(['onlineUsers'], (old) =>
    old?.map(u => u.id === user.id ? { ...u, ...user } : u)
  );
});
```

### **Optimization Techniques**

- **Batch user fetching:** `useUsers(ids)` checks cache first, batch-fetches uncached via `POST /users/batch`
- **Derived bookmark status:** `useIsBookmarked(id)` reads from `useBookmarks()` cache — zero API calls
- **Shared query hooks:** Components reuse the same hooks → React Query deduplicates requests
- **Debounced embeds:** `MessageEmbed` uses 500ms debounce on `POST /embeds/parse`

**📖 See:** [CACHING.md](CACHING.md) for complete hook reference and cache timings

---

## 🚀 Performance Characteristics

### **Request Reduction:**

```
WITHOUT WebSocket-First:
- Login: 12 requests
- Every minute: 3-5 requests (polling)
- Per hour: ~200 requests
- Per day: ~4,800 requests

WITH WebSocket-First:
- Login: 12 requests
- Per hour: ~0-2 requests (only user actions)
- Per day: ~50 requests

Reduction: ~99% fewer requests! 🎯
```

### **Latency:**

```
Polling (60s interval):
- Average: 30 seconds delay
- Worst: 60 seconds delay

WebSocket:
- Average: <100ms
- Worst: <500ms

300x faster! ⚡
```

### **Bandwidth:**

```
Polling:
- Each poll: ~2-5KB
- Per day: ~10-25MB

WebSocket:
- Connection: ~0.5KB/hour (heartbeat)
- Events: ~0.1-0.5KB each
- Per day: ~1-2MB

90% less bandwidth! 💰
```

---

## 🛡️ Reliability

### **What if WebSocket disconnects?**

```typescript
// socket.ts handles reconnection automatically:
reconnection: true
reconnectionAttempts: 5
reconnectionDelay: 1000ms

On reconnect:
1. Re-authenticate with JWT
2. Re-join all rooms (channels, workspaces)
3. Catch up on missed events (if any)
```

### **What if event is missed?**

- **Cache stays valid** (staleTime: Infinity)
- User can manually refresh if needed
- On channel switch, data reloads from cache (instant)
- Very rare in practice (WebSocket very reliable)

---

## 📊 Comparison with Other Systems

| Feature | Boxcord | Discord | Slack | Teams |
|---------|---------|---------|-------|-------|
| Primary transport | WebSocket ✅ | WebSocket ✅ | WebSocket ✅ | WebSocket ✅ |
| Optimistic updates | Yes ✅ | Yes ✅ | Yes ✅ | Yes ✅ |
| Background polling | NO ✅ | NO ✅ | Minimal 🟡 | Some ❌ |
| Cache strategy | React Query | Custom | Redux | Custom |
| Fallback | HTTP REST | HTTP REST | HTTP REST | HTTP REST |

**Result:** Boxcord now matches Discord's architecture! 🎉

---

## 🔧 When HTTP API is Used

Only for these scenarios:

1. **Initial Load** - First time entering app
2. **Load More** - Scrolling up for message history
3. **Search** - Explicit user search actions
4. **Profile Updates** - User changes avatar/name
5. **File Uploads** - Sending attachments
6. **Admin Actions** - Creating workspaces, managing members
7. **Thread Operations** - Create/delete threads, add/edit/delete replies, toggle reactions, follow/read

**NOT used for:**

- ❌ Background polling
- ❌ Auto-refresh on interval
- ❌ Checking for new messages
- ❌ Syncing channel lists
- ❌ Syncing thread replies (WebSocket handles real-time updates)

---

## 💡 Key Takeaways

1. **WebSocket is NOT expensive** - One connection handles everything
2. **Polling is expensive** - Many HTTP requests, delayed updates
3. **Optimistic updates feel instant** - Discord's secret sauce
4. **Cache with Infinity staleTime** - Trust WebSocket to keep fresh
5. **HTTP only for user actions** - Not background operations

This is how all modern real-time apps work! 🚀

---

## 🔗 Microsoft 365 Integration Architecture

### **OAuth 2.0 Flow**

```
User clicks "Connect Microsoft 365"
    ↓
Client redirects to Microsoft login (PKCE)
    ↓
Microsoft redirects back with auth code
    ↓
Server exchanges code for tokens
    ↓
Tokens stored in MicrosoftToken table (encrypted)
    ↓
🟢 Connected! Graph API requests use stored tokens
```

### **Token Management**

```
Request to Graph API
    ↓
Check token expiry
    ↓ (expired?)
Per-user mutex lock → Refresh token → Update DB
    ↓
Make Graph API call with valid token
```

- **In-memory cache** avoids DB lookups on every request
- **Per-user mutex** prevents concurrent refresh race conditions
- **Auto-retry** on 401 with fresh token

### **Data Flow (Polling-Based)**

Unlike chat messages (WebSocket-first), Microsoft 365 data uses React Query polling:

```
OneDrive files:    Poll every 30 seconds
Calendar events:   Poll every 60 seconds
SharePoint sites:  Poll every 5 minutes
```

**Why polling?** Microsoft Graph does not provide WebSocket subscriptions for most resources. React Query's background refetch keeps data reasonably fresh.

### **Service Layer**

```
client/src/hooks/queries/microsoft.ts    → React Query hooks
client/src/services/api.ts               → microsoft365Api endpoints
    ↓ HTTP
src/apps/api/routes/microsoft.routes.ts  → Fastify route handlers
    ↓
src/02-application/services/microsoft-graph.service.ts → Graph API calls
    ↓ HTTP
Microsoft Graph API (graph.microsoft.com)
```

### **SharePoint CSP Limitation**

SharePoint Online sets `frame-ancestors` headers that block iframe embedding from non-Microsoft domains. Current workaround: open HelloFlow intranet as external link. Planned: Electron desktop app with `<webview>` tag (bypasses CSP, same approach as Microsoft Teams).
