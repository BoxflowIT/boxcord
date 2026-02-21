-- Add pinned message columns and indexes
-- Step 1: Add columns to messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "pinned_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "pinned_by" TEXT;

-- Step 2: Add columns to direct_messages table  
ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "pinned_at" TIMESTAMP(3);
ALTER TABLE "direct_messages" ADD COLUMN IF NOT EXISTS "pinned_by" TEXT;

-- Step 3: Create composite indexes for optimized pinned message queries
CREATE INDEX IF NOT EXISTS "messages_channel_id_is_pinned_created_at_idx" 
ON "messages"("channel_id", "is_pinned", "created_at");

CREATE INDEX IF NOT EXISTS "direct_messages_channel_id_is_pinned_created_at_idx"
ON "direct_messages"("channel_id", "is_pinned", "created_at");
