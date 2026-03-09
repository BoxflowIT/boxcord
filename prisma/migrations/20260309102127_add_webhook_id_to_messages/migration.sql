-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "webhook_id" TEXT;

-- CreateIndex
CREATE INDEX "messages_webhook_id_idx" ON "messages"("webhook_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "channel_webhooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
