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

  // Note: No mock messages - let users create real messages
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
