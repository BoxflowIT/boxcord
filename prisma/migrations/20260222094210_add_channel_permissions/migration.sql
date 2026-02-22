-- CreateTable
CREATE TABLE "channel_permissions" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "can_view_channel" BOOLEAN NOT NULL DEFAULT true,
    "can_send_messages" BOOLEAN NOT NULL DEFAULT true,
    "can_add_reactions" BOOLEAN NOT NULL DEFAULT true,
    "can_attach_files" BOOLEAN NOT NULL DEFAULT true,
    "can_embed" BOOLEAN NOT NULL DEFAULT true,
    "can_mention_everyone" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_messages" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_channel" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_members" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channel_permissions_channel_id_idx" ON "channel_permissions"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_permissions_channel_id_role_key" ON "channel_permissions"("channel_id", "role");

-- AddForeignKey
ALTER TABLE "channel_permissions" ADD CONSTRAINT "channel_permissions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
