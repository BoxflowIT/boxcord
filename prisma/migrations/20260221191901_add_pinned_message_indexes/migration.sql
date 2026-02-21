-- AlterTable: Add composite indexes for pinned message queries
-- Optimizes: WHERE channelId = X AND isPinned = true ORDER BY createdAt

-- Messages: Add index for pinned message queries
CREATE INDEX IF NOT EXISTS "messages_channel_id_is_pinned_created_at_idx" 
ON "messages"("channel_id", "is_pinned", "created_at");

-- Direct Messages: Add index for pinned DM queries  
CREATE INDEX IF NOT EXISTS "direct_messages_channel_id_is_pinned_created_at_idx"
ON "direct_messages"("channel_id", "is_pinned", "created_at");
