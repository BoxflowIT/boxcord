-- AlterTable
ALTER TABLE "threads" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_resolved" BOOLEAN NOT NULL DEFAULT false;
