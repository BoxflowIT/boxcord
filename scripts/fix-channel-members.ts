// Script to add ChannelMembers for all workspace members to existing channels
// Run with: npx tsx scripts/fix-channel-members.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixChannelMembers() {
  console.log('🔧 Fixing channel members...');

  // Get all workspaces
  const workspaces = await prisma.workspace.findMany({
    include: {
      members: true,
      channels: true
    }
  });

  let totalAdded = 0;

  for (const workspace of workspaces) {
    console.log(`\n📦 Workspace: ${workspace.name} (${workspace.id})`);
    console.log(`   Members: ${workspace.members.length}`);
    console.log(`   Channels: ${workspace.channels.length}`);

    for (const channel of workspace.channels) {
      for (const member of workspace.members) {
        try {
          await prisma.channelMember.create({
            data: {
              channelId: channel.id,
              userId: member.userId
            }
          });
          totalAdded++;
        } catch (err) {
          // Ignore duplicate errors
          const message = err instanceof Error ? err.message : String(err);
          if (!message.includes('Unique constraint')) {
            console.error(`   ❌ Error adding ${member.userId} to ${channel.name}:`, message);
          }
        }
      }
    }
  }

  console.log(`\n✅ Done! Added ${totalAdded} channel memberships`);
}

fixChannelMembers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
