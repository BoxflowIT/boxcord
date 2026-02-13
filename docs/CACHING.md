# React Query Caching - Dokumentation

## Översikt

Vi använder **@tanstack/react-query** för att automatiskt cacha API-anrop och undvika onödiga requests.

## ✅ Vad vi har implementerat

### 1. Global QueryClient Setup
**Fil:** `client/src/App.tsx`
- QueryClientProvider wraps hela appen
- Globala cache-inställningar:
  - `staleTime: 2 minuter` - Data är "fresh" i 2 minuter
  - `gcTime: 5 minuter` - Cache behålls i 5 minuter (tidigare cacheTime)
  - `retry: 1` - Max 1 omförsök vid fel
  - Automatisk refetch när användaren kommer tillbaka till fliken
  - Automatisk refetch när internet kopplas på igen

### 2. Custom Hooks
**Fil:** `client/src/hooks/useQuery.ts`

#### Tillgängliga hooks:

**useWorkspaces()**
- Cachas i 5 minuter
- Automatisk refetch var 30:e sekund
- Används i: Chat.tsx

**useChannels(workspaceId)**
- Cachas i 5 minuter per workspace
- Automatisk refetch var 30:e sekund
- Används i: Chat.tsx

**useDMChannels()**
- Cachas i 3 minuter
- Automatisk refetch var 20:e sekund
- Används av: DMList.tsx

**useOnlineUsers()**
- Cachas i 30 sekunder
- Automatisk refetch var 15:e sekund
- Används av: MemberList.tsx

**useCurrentUser()**
- Cachas i 10 minuter
- Används av: ProfileModal.tsx

**useUser(userId)**
- Cachas i 5 minuter per användare
- Används av: ProfileModal.tsx

**useUsers(userIds[])**
- Cachas i 5 minuter per batch
- Hämtar flera users samtidigt
- Används av: DMList.tsx för att hämta alla DM participants i ett svep

**useReactions(messageId)**
- Cachas i 30 sekunder
- Uppdateras även i realtid via WebSocket
- Används av: MessageReactions.tsx

**useMessages(channelId, cursor?)**
- Cachas i 1 minut
- Uppdateras i realtid via WebSocket
- Används av: WelcomeView.tsx

**useCreateChannel()**
- Invaliderar channels cache för specifik workspace
- Automatisk refetch av channels

**useDeleteWorkspace()**
- Invaliderar workspaces cache efter borttagen workspace

**useDeleteChannel()**
- Invaliderar alla channels queries efter borttagen channel

**useUpdateProfile()**
- Invaliderar current user cache efter profiländring
- Automatisk refetch av användare
- Används av: ProfileModal.tsx

**useUpdateUserRole()**
- Invaliderar user cache för specifik användare
- Invaliderar online users cache
- Används av: ProfileModal.tsx för admin-funktioner

**useCreateChannel()**
- Invaliderar channels cache för specifik workspace
- Automatisk refetch av channels

**useDeleteWorkspace()**
- Invaliderar workspaces cache efter borttagen workspace

**useDeleteChannel()**
- Invaliderar alla channels queries efter borttagen channel

## 🚀 Fördelar

### 1. **Deduplicering**
Om två komponenter anropar samma endpoint samtidigt → **endast 1 request skickas!**

**Exempel:**
```tsx
// Båda dessa anrop dedupliceras automatiskt
const { data: ws1 } = useWorkspaces(); // Component A
const { data: ws2 } = useWorkspaces(); // Component B
// → Endast 1 API-anrop till /api/v1/workspaces
```

### 2. **Instant Loading från Cache**
När data redan finns i cache → **instant visning, ingen laddning!**

**Exempel:**
```tsx
// Första gången: laddar från API
const { data, isLoading } = useWorkspaces();
// isLoading = true, sedan false när data laddats

// Andra gången (inom 5 min): instant från cache
const { data, isLoading } = useWorkspaces();
// isLoading = false direkt, data visas omedelbart
```

### 3. **Background Refetch**
Data uppdateras i bakgrunden utan att visa spinner

**Exempel:**
```tsx
// Data visas direkt från cache (2 min gamla)
const { data } = useWorkspaces();
// ✅ Data visas omedelbart

// I bakgrunden: refetch efter 30 sekunder
// ✅ Uppdaterad data ersätter cache smidigt
```

### 4. **Automatisk Uppdatering**
- När användaren fokuserar på fliken igen
- När internet kopplas på igen
- Med konfigurerade intervall (15-30 sek)

## 📊 Cache Timings

| Hook             | Stale Time | Refetch Intervall | Användning                 |
|------------------|------------|-------------------|----------------------------|
| useWorkspaces    | 5 min      | 30 sek            | Workspace lista            |
| useChannels      | 5 min      | 30 sek            | Channel lista              |
| useDMChannels    | 3 min      | 20 sek            | DM channel lista           |
| useOnlineUsers   | 30 sek     | 15 sek            | Online användare (presence)|
| useCurrentUser   | 10 min     | -                 | Nuvarande användare        |
| useUser          | 5 min      | -                 | User profiler              |
| useMessages      | 1 min      | -                 | Channel meddelanden        |
| useDMMessages    | 1 min      | -                 | DM meddelanden             |

## 📊 Före vs Efter

### FÖRE (utan caching):
```
Chat.tsx: api.getWorkspaces()      → Request 1
WelcomeView: api.getWorkspaces()   → Request 2 (duplicat!) 
Chat.tsx: api.getChannels()        → Request 3
Sidebar.tsx: api.getChannels()     → Request 4 (duplicat!)
DMList.tsx: api.getDMChannels()    → Request 5
DMView.tsx: api.getDMChannels()    → Request 6 (duplicat!)
DMList.tsx: api.getUser(user1)     → Request 7
DMList.tsx: api.getUser(user2)     → Request 8
DMList.tsx: api.getUser(user3)     → Request 9
... (om du har 15 DMs = 15 extra getUser requests!)
ProfileModal: api.getCurrentUser() → Request 10
ProfileModal: api.getUser()        → Request 11 (öppnas igen)
MemberList: api.getOnlineUsers()   → Request 12

Total: 12+ requests (hälften duplicerade!)
```

### EFTER (med React Query):
```
Chat.tsx: useWorkspaces()          → Request 1 → cache
WelcomeView: useWorkspaces()       → ✅ från cache (0 requests)
Chat.tsx: useChannels()            → Request 2 → cache
Sidebar: workspace switch          → ✅ från cache (0 requests)
DMList: useDMChannels()            → Request 3 → cache
DMView: useDMChannels()            → ✅ från cache (0 requests)
DMList: useUsers([15 user ids])    → Request 4 → cache alla users
ProfileModal: useCurrentUser()     → Request 5 → cache
ProfileModal: öppnas igen          → ✅ från cache (0 requests)
MemberList: useOnlineUsers()       → Request 6 → cache

Total: 6 requests (alla andra från cache!)
→ 50-70% färre API-anrop! 🎉
```

## 🔍 Debug React Query

För att se cache status under utveckling, installera:

```bash
npm install @tanstack/react-query-devtools
```

Lägg till i App.tsx:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {/* Din app */}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## 🎯 Best Practices

1. **Använd hooks istället för direkta API-anrop**
   ```tsx
   // ❌ Gammal metod
   useEffect(() => {
     api.getWorkspaces().then(setData);
   }, []);
   
   // ✅ Ny metod med caching
   const { data } = useWorkspaces();
   ```

2. **Invalidera cache efter mutations**
   ```tsx
   const { mutate } = useCreateWorkspace();
   mutate({ name: 'New' }, {
     onSuccess: () => {
       // Cache invalideras automatiskt!
     }
   });
   ```

3. **Använd enabled för conditional queries**
   ```tsx
   const { data } = useChannels(workspaceId, {
     enabled: !!workspaceId // Kör bara om workspaceId finns
   });
   ```

## 📈 Resultat

- ✅ **Färre API-anrop** - Deduplicering + cache
- ✅ **Snabbare UX** - Instant loading från cache
- ✅ **Mindre belastning** - På både frontend och backend
- ✅ **Bättre offline support** - Data finns i cache även offline
- ✅ **Automatisk synk** - Background refetch håller data uppdaterad
