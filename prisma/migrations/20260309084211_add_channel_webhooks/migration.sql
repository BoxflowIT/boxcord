-- CreateTable
CREATE TABLE "channel_webhooks" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "token" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_webhooks_token_key" ON "channel_webhooks"("token");

-- CreateIndex
CREATE INDEX "channel_webhooks_channel_id_idx" ON "channel_webhooks"("channel_id");

-- CreateIndex
CREATE INDEX "channel_webhooks_token_idx" ON "channel_webhooks"("token");

-- AddForeignKey
ALTER TABLE "channel_webhooks" ADD CONSTRAINT "channel_webhooks_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
