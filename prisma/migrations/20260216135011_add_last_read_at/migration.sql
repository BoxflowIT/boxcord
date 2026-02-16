-- AlterTable
ALTER TABLE "channel_members"
ADD COLUMN "last_read_at" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "dm_participants"
ADD COLUMN "last_read_at" TIMESTAMP(3);