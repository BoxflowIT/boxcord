// Seed script for Boxcord database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { id: 'user-1' },
    update: {},
    create: {
      id: 'user-1',
      email: 'test@boxflow.se',
      firstName: 'Test',
      lastName: 'Användare',
      role: 'ADMIN',
      presence: {
        create: {
          status: 'ONLINE'
        }
      }
    }
  });

  const user2 = await prisma.user.upsert({
    where: { id: 'user-2' },
    update: {},
    create: {
      id: 'user-2',
      email: 'anna@boxflow.se',
      firstName: 'Anna',
      lastName: 'Andersson',
      role: 'STAFF',
      presence: {
        create: {
          status: 'ONLINE'
        }
      }
    }
  });

  const user3 = await prisma.user.upsert({
    where: { id: 'user-3' },
    update: {},
    create: {
      id: 'user-3',
      email: 'bot@boxflow.se',
      firstName: 'Boxcord',
      lastName: 'Bot',
      role: 'BOT'
    }
  });

  console.log('✅ Created users:', user1.email, user2.email, user3.email);

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'ws-1' },
    update: {},
    create: {
      id: 'ws-1',
      name: 'Boxflow HQ',
      description: 'Huvudkontoret för Boxflow-teamet'
    }
  });

  console.log('✅ Created workspace:', workspace.name);

  // Add members to workspace
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-1' } },
    update: {},
    create: {
      workspaceId: 'ws-1',
      userId: 'user-1',
      role: 'OWNER'
    }
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-2' } },
    update: {},
    create: {
      workspaceId: 'ws-1',
      userId: 'user-2',
      role: 'MEMBER'
    }
  });

  console.log('✅ Added workspace members');

  // Create channels
  const generalChannel = await prisma.channel.upsert({
    where: { id: 'ch-general' },
    update: {},
    create: {
      id: 'ch-general',
      workspaceId: 'ws-1',
      name: 'allmänt',
      description: 'Allmän diskussion',
      type: 'TEXT'
    }
  });

  const bookingsChannel = await prisma.channel.upsert({
    where: { id: 'ch-bookings' },
    update: {},
    create: {
      id: 'ch-bookings',
      workspaceId: 'ws-1',
      name: 'bokningar',
      description: 'Bokningsnotiser från Boxtime',
      type: 'TEXT'
    }
  });

  const randomChannel = await prisma.channel.upsert({
    where: { id: 'ch-random' },
    update: {},
    create: {
      id: 'ch-random',
      workspaceId: 'ws-1',
      name: 'random',
      description: 'Slumpmässigt snack',
      type: 'TEXT'
    }
  });

  console.log('✅ Created channels:', generalChannel.name, bookingsChannel.name, randomChannel.name);

  // Create some test messages
  await prisma.message.createMany({
    data: [
      {
        id: 'msg-1',
        channelId: 'ch-general',
        authorId: 'user-1',
        content: 'Välkommen till Boxcord! 🎉',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 'msg-2',
        channelId: 'ch-general',
        authorId: 'user-2',
        content: 'Hej! Kul att vara här! 👋',
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        id: 'msg-3',
        channelId: 'ch-general',
        authorId: 'user-1',
        content: 'Testa /help för att se tillgängliga kommandon',
        createdAt: new Date(Date.now() - 900000)
      },
      {
        id: 'msg-4',
        channelId: 'ch-general',
        authorId: 'user-3',
        content: '🤖 **Boxcord Bot**\nJag är redo att hjälpa! Använd `/help` för kommandon.',
        createdAt: new Date(Date.now() - 600000)
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Created test messages');

  // Add some reactions
  await prisma.reaction.createMany({
    data: [
      { messageId: 'msg-1', userId: 'user-2', emoji: '🎉' },
      { messageId: 'msg-1', userId: 'user-2', emoji: '👍' },
      { messageId: 'msg-2', userId: 'user-1', emoji: '👋' }
    ],
    skipDuplicates: true
  });

  console.log('✅ Added reactions');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
