-- CreateTable
CREATE TABLE "voice_sessions" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_deafened" BOOLEAN NOT NULL DEFAULT false,
    "is_speaking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_sessions_channel_id_idx" ON "voice_sessions"("channel_id");

-- CreateIndex
CREATE INDEX "voice_sessions_user_id_idx" ON "voice_sessions"("user_id");

-- CreateIndex
CREATE INDEX "voice_sessions_channel_id_user_id_left_at_idx" ON "voice_sessions"("channel_id", "user_id", "left_at");
