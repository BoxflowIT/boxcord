# Database Index Optimization Analysis

## Analysis Date
2026-02-21

## Current Index Coverage
✅ Good coverage for:
- Primary key lookups (all tables)
- Foreign key relationships (most relations indexed)
- Composite queries on VoiceSession (channelId, userId, leftAt)
- Time-based queries on Messages and DirectMessages (channelId, createdAt)

## Query Pattern Analysis

### 1. Pinned Messages (HIGH PRIORITY)
**Current Query:**
```prisma
message.findMany({
  where: { channelId: X, isPinned: true },
  orderBy: { createdAt: 'desc' }
})
```

**Current Index:** `@@index([channelId, createdAt])`
**Issue:** Index doesn't help with `isPinned = true` filter
**Solution:** Add composite index `@@index([channelId, isPinned, createdAt])`
**Impact:** Significant speedup for pinned message queries (used in UI pin panel)

### 2. Direct Message Pins (HIGH PRIORITY)
**Same issue as Message.isPinned**
**Solution:** Add `@@index([channelId, isPinned, createdAt])` to DirectMessage

### 3. User Search by Email (ALREADY OPTIMIZED)
**Query:** `user.findMany({ where: { email: { contains: query } } })`
**Current Index:** `@unique` on email (supports prefix searches)
**Status:** ✅ Already optimized

### 4. User Presence Status Filtering (MEDIUM PRIORITY)
**Query:** `userPresence.findMany({ where: { status: { not: 'OFFLINE' } } })`
**Current Index:** None on status
**Solution:** Add `@@index([status])` if status filtering is frequent
**Note:** Primary key is userId, so status index only helps for batch queries

### 5. Channel Type Filtering (LOW PRIORITY)
**Query:** `channel.findMany({ where: { workspaceId: X, type: 'VOICE' } })`
**Current Index:** `@@index([workspaceId])`
**Solution:** Add `@@index([workspaceId, type])` if type filtering is common
**Impact:** Marginal - workspaces typically have <100 channels

### 6. Channel isPrivate Filtering (LOW PRIORITY)
**Similar to type filtering**
**Solution:** `@@index([workspaceId, isPrivate])` if needed
**Impact:** Marginal - boolean field with low selectivity

## Recommendations

### Immediate Implementation
1. ✅ **Add composite index for Message pinned queries**
   - `@@index([channelId, isPinned, createdAt])`
   - High impact, used in UI

2. ✅ **Add composite index for DirectMessage pinned queries**
   - `@@index([channelId, isPinned, createdAt])`
   - High impact, used in DM pins

### Monitor and Evaluate
3. **UserPresence.status index** - Monitor query logs first
4. **Channel.type / Channel.isPrivate** - Likely unnecessary due to low cardinality

## Performance Metrics to Monitor
- Query execution time for `getPinnedMessages()`
- Query execution time for DM pinned messages
- Database slow query logs (>100ms queries)
- Index size growth after additions

## Migration Strategy
1. Create migration with new indexes
2. Apply in development environment
3. Test query performance before/after
4. Deploy to production during low-traffic window
5. Monitor database metrics post-deployment

## Index Size Estimates
- Message table: ~10K-100K rows expected
- DirectMessage table: ~5K-50K rows expected
- Composite indexes add ~5-10% storage overhead
- Trade-off: Storage vs query speed → **Worth it**
