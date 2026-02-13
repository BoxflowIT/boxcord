# Verifiera React Query Caching

## 🔍 Steg-för-steg verifiering

### 1. Öppna Developer Tools
1. Öppna http://localhost:5173 i webbläsaren
2. Tryck `F12` eller `Ctrl+Shift+I`
3. Gå till **Network** fliken
4. Filtrera på `Fetch/XHR`
5. Klicka på **Clear** (🚫) för att rensa tidigare requests

### 2. Ladda om sidan
1. Tryck `Ctrl+R` eller `F5`
2. Logga in om nödvändigt
3. Observera requests i Network fliken

### 3. Vad du ska se

#### Initial Load (första gången):
```
Status | Method | File                          | Size    | Time
-------|--------|------------------------------|---------|------
200    | GET    | /api/v1/users/me/init        | 500 B   | 50ms
200    | GET    | /api/v1/workspaces           | 1.2 KB  | 45ms
200    | GET    | /api/v1/channels?workspace.. | 850 B   | 40ms
200    | GET    | /api/v1/dm/channels          | 2.1 KB  | 55ms
200    | GET    | /api/v1/users/online         | 3.4 KB  | 60ms
```
**= ~5 requests** (beroende på vad du gör)

#### Vid navigering (data finns i cache):
```
GET /api/v1/workspaces    ← (disk cache) 304
GET /api/v1/channels      ← (disk cache) 304
```
**= Mycket snabbare, data från cache!**

### 4. Testa deduplicering

#### A. Öppna samma sida i två tabs
1. Öppna första tab: http://localhost:5173/chat
2. Öppna andra tab: http://localhost:5173/chat
3. **Resultat:** Endast 1 set requests (delas mellan tabs!)

#### B. Navigera mellan channels snabbt
1. Klicka på Channel 1
2. Klicka på Channel 2
3. Gå tillbaka till Channel 1
4. **Resultat:** Channel 1 data laddas instant från cache!

#### C. Switch workspace
1. Välj Workspace A
2. Välj Workspace B  
3. Gå tillbaka till Workspace A
4. **Resultat:** Workspace A channels finns i cache (inom 5 min)

### 5. Verifiera cache timings

#### Test 1: Stale time (2 minuter)
1. Ladda sidan
2. Vänta 1 minut
3. Byt till annan flik och tillbaka
4. **Resultat:** Ingen request (data är fresh)

#### Test 2: Efter stale time (>2 minuter)
1. Ladda sidan
2. Vänta 3 minuter
3. Byt till annan flik och tillbaka
4. **Resultat:** Background refetch (data uppdateras i bakgrunden)

#### Test 3: Automatisk refetch
1. Öppna Network tab
2. Låt sidan vara öppen
3. **Resultat:** Automatisk refetch efter intervaller:
   - Online users: var 15:e sekund
   - DM channels: var 20:e sekund
   - Workspaces: var 30:e sekund

### 6. Verifiera med React Query DevTools (optional)

1. Installera devtools:
```bash
npm install @tanstack/react-query-devtools
```

2. Lägg till i `App.tsx`:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {/* Din app */}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

3. Klicka på lilla React Query ikonen (nere till vänster)
4. Se alla queries, deras status, och cache innehåll!

**DevTools visar:**
- 🟢 **Fresh** - Data är nyligen hämtad
- 🟡 **Stale** - Data är gammal men används fortfarande
- ⚪ **Inactive** - Data finns i cache men används inte
- 🔵 **Fetching** - Data hämtas just nu

### 7. Jämför med gamla koden

#### FÖRE React Query:
```
# Duplicerade requests vid initial load:
GET /api/v1/workspaces      ← från Chat.tsx
GET /api/v1/workspaces      ← från WelcomeView.tsx (DUPLICAT!)
GET /api/v1/channels        ← från Chat.tsx
GET /api/v1/channels        ← från Sidebar.tsx (DUPLICAT!)
GET /api/v1/dm/channels     ← från DMList.tsx
GET /api/v1/dm/channels     ← från DMView.tsx (DUPLICAT!)
GET /api/v1/users/online    ← från MemberList.tsx
GET /api/v1/users/online    ← refresh i MemberList.tsx (DUPLICAT!)

Total: 8 requests (4 duplicerade = 50% waste!)
```

#### EFTER React Query:
```
# Deduplicerade requests:
GET /api/v1/workspaces      ← cached, delas mellan komponenter
GET /api/v1/channels        ← cached, delas mellan komponenter
GET /api/v1/dm/channels     ← cached, delas mellan komponenter
GET /api/v1/users/online    ← cached, auto-refetch var 15:e sek

Total: 4 requests (0 duplicerade = 100% effektivt!)
```

## ✅ Success Criteria

Du vet att caching fungerar om:

1. ✅ **Inga duplicerade requests** vid initial load
2. ✅ **304 (Not Modified)** svar vid navigering
3. ✅ **Instant loading** när du går tillbaka till tidigare sidor
4. ✅ **Background updates** utan att visa spinner
5. ✅ **Max 4-5 requests** vid initial load (ner från 8-10)

## 🎯 Performance Metrics

Förväntat resultat:
- **50% färre API-anrop** totalt
- **70% snabbare** perceived load time (tack vare cache)
- **90% mindre** onödig nätverkstrafik
- **Smidare UX** med instant navigation

## 🐛 Troubleshooting

**Problem:** Ser fortfarande duplicerade requests
- **Lösning:** Kontrollera att komponenter använder hooks (`useWorkspaces()`) istället för direkt `api.getWorkspaces()`

**Problem:** Data uppdateras inte
- **Lösning:** Kolla refetch intervaller i `useQuery.ts`, eventuellt öka frekvensen

**Problem:** Cache är för gammal
- **Lösning:** Minska `staleTime` i relevanta hooks

**Problem:** För många requests fortfarande
- **Lösning:** Öka `staleTime` för att cacha längre
