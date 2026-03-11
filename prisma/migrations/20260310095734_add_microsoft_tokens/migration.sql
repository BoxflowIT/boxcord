-- CreateTable
CREATE TABLE "microsoft_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scopes" TEXT NOT NULL,
    "ms_user_id" TEXT,
    "ms_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "microsoft_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "microsoft_tokens_user_id_key" ON "microsoft_tokens"("user_id");

-- CreateIndex
CREATE INDEX "microsoft_tokens_user_id_idx" ON "microsoft_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "microsoft_tokens" ADD CONSTRAINT "microsoft_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
