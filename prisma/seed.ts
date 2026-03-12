// Seed script for Boxcord database
// Comprehensive test data for local development
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive test data...');

  // ============================================
  // 1. CREATE USERS (15 realistic test users)
  // ============================================
  console.log('👥 Creating users...');
  
  const users = await Promise.all([
    // Admins
    prisma.user.upsert({
      where: { id: 'user-admin' },
      update: {},
      create: {
        id: 'user-admin',
        email: 'admin@boxflow.se',
        firstName: 'Admin',
        lastName: 'Superanvändare',
        role: 'SUPER_ADMIN',
        status: 'Grundare och systemadmin',
        statusEmoji: '👨‍💼',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-erik' },
      update: {},
      create: {
        id: 'user-erik',
        email: 'erik.johansson@boxflow.se',
        firstName: 'Erik',
        lastName: 'Johansson',
        role: 'ADMIN',
        status: 'Tech Lead',
        statusEmoji: '💻',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    
    // Regular staff
    prisma.user.upsert({
      where: { id: 'user-anna' },
      update: {},
      create: {
        id: 'user-anna',
        email: 'anna.andersson@boxflow.se',
        firstName: 'Anna',
        lastName: 'Andersson',
        role: 'MEMBER',
        status: 'Backend Developer',
        statusEmoji: '🚀',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-maria' },
      update: {},
      create: {
        id: 'user-maria',
        email: 'maria.svensson@boxflow.se',
        firstName: 'Maria',
        lastName: 'Svensson',
        role: 'MEMBER',
        status: 'Frontend Developer',
        statusEmoji: '🎨',
        presence: { create: { status: 'AWAY' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-jonas' },
      update: {},
      create: {
        id: 'user-jonas',
        email: 'jonas.berg@boxflow.se',
        firstName: 'Jonas',
        lastName: 'Berg',
        role: 'MEMBER',
        status: 'DevOps Engineer',
        statusEmoji: '⚙️',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-lisa' },
      update: {},
      create: {
        id: 'user-lisa',
        email: 'lisa.karlsson@boxflow.se',
        firstName: 'Lisa',
        lastName: 'Karlsson',
        role: 'MEMBER',
        status: 'UX Designer',
        statusEmoji: '✨',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-david' },
      update: {},
      create: {
        id: 'user-david',
        email: 'david.nilsson@boxflow.se',
        firstName: 'David',
        lastName: 'Nilsson',
        role: 'MEMBER',
        status: 'Product Manager',
        statusEmoji: '📊',
        presence: { create: { status: 'BUSY' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-sofia' },
      update: {},
      create: {
        id: 'user-sofia',
        email: 'sofia.larsson@boxflow.se',
        firstName: 'Sofia',
        lastName: 'Larsson',
        role: 'MEMBER',
        status: 'QA Engineer',
        statusEmoji: '🐛',
        presence: { create: { status: 'ONLINE' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-peter' },
      update: {},
      create: {
        id: 'user-peter',
        email: 'peter.olsson@boxflow.se',
        firstName: 'Peter',
        lastName: 'Olsson',
        role: 'MEMBER',
        status: 'Fika-ansvarig',
        statusEmoji: '☕',
        presence: { create: { status: 'AWAY' } }
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-emma' },
      update: {},
      create: {
        id: 'user-emma',
        email: 'emma.gustafsson@boxflow.se',
        firstName: 'Emma',
        lastName: 'Gustafsson',
        role: 'MEMBER',
        status: 'Customer Success',
        statusEmoji: '🤝',
        presence: { create: { status: 'OFFLINE' } }
      }
    }),
    
    // Bot
    prisma.user.upsert({
      where: { id: 'user-bot' },
      update: {},
      create: {
        id: 'user-bot',
        email: 'bot@boxflow.se',
        firstName: 'Boxcord',
        lastName: 'Bot',
        role: 'BOT',
        status: 'Automatiska notiser',
        statusEmoji: '🤖'
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ============================================
  // 2. CREATE WORKSPACES
  // ============================================
  console.log('🏢 Creating workspaces...');
  
  const workspace1 = await prisma.workspace.upsert({
    where: { id: 'ws-boxflow' },
    update: {},
    create: {
      id: 'ws-boxflow',
      name: 'Boxflow HQ',
      description: 'Huvudkontoret för Boxflow-teamet'
    }
  });

  const workspace2 = await prisma.workspace.upsert({
    where: { id: 'ws-development' },
    update: {},
    create: {
      id: 'ws-development',
      name: 'Development',
      description: 'Utvecklingsteamets workspace'
    }
  });

  console.log(`✅ Created workspaces: ${workspace1.name}, ${workspace2.name}`);

  // ============================================
  // 3. ADD WORKSPACE MEMBERS
  // ============================================
  console.log('👥 Adding workspace members...');
  
  // Boxflow HQ - alla medlemmar
  const boxflowMembers = [
    { userId: 'user-admin', role: 'OWNER' as const },
    { userId: 'user-erik', role: 'ADMIN' as const },
    { userId: 'user-anna', role: 'MEMBER' as const },
    { userId: 'user-maria', role: 'MEMBER' as const },
    { userId: 'user-jonas', role: 'MEMBER' as const },
    { userId: 'user-lisa', role: 'MEMBER' as const },
    { userId: 'user-david', role: 'MEMBER' as const },
    { userId: 'user-sofia', role: 'MEMBER' as const },
    { userId: 'user-peter', role: 'MEMBER' as const },
    { userId: 'user-emma', role: 'MEMBER' as const }
  ];

  for (const member of boxflowMembers) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: 'ws-boxflow', userId: member.userId } },
      update: {},
      create: {
        workspaceId: 'ws-boxflow',
        userId: member.userId,
        role: member.role
      }
    });
  }

  // Development workspace - bara dev team
  const devMembers = [
    { userId: 'user-erik', role: 'OWNER' as const },
    { userId: 'user-anna', role: 'ADMIN' as const },
    { userId: 'user-maria', role: 'MEMBER' as const },
    { userId: 'user-jonas', role: 'MEMBER' as const },
    { userId: 'user-sofia', role: 'MEMBER' as const }
  ];

  for (const member of devMembers) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: 'ws-development', userId: member.userId } },
      update: {},
      create: {
        workspaceId: 'ws-development',
        userId: member.userId,
        role: member.role
      }
    });
  }

  console.log(`✅ Added ${boxflowMembers.length + devMembers.length} workspace memberships`);

  // ============================================
  // 4. CREATE CHANNELS
  // ============================================
  console.log('📺 Creating channels...');
  
  // Boxflow HQ channels
  await prisma.channel.upsert({
    where: { id: 'ch-general' },
    update: {},
    create: {
      id: 'ch-general',
      workspaceId: 'ws-boxflow',
      name: 'allmänt',
      description: 'Allmän diskussion och uppdateringar',
      type: 'TEXT'
    }
  });

  await prisma.channel.upsert({
    where: { id: 'ch-bookings' },
    update: {},
    create: {
      id: 'ch-bookings',
      workspaceId: 'ws-boxflow',
      name: 'bokningar',
      description: 'Bokningsnotiser från Boxtime',
      type: 'TEXT'
    }
  });

  await prisma.channel.upsert({
    where: { id: 'ch-random' },
    update: {},
    create: {
      id: 'ch-random',
      workspaceId: 'ws-boxflow',
      name: 'random',
      description: 'Off-topic och kul grejor',
      type: 'TEXT'
    }
  });

  await prisma.channel.upsert({
    where: { id: 'ch-announcements' },
    update: {},
    create: {
      id: 'ch-announcements',
      workspaceId: 'ws-boxflow',
      name: 'announcements',
      description: 'Viktiga meddelanden',
      type: 'TEXT'
    }
  });

  // Development workspace channels
  await prisma.channel.upsert({
    where: { id: 'ch-dev-general' },
    update: {},
    create: {
      id: 'ch-dev-general',
      workspaceId: 'ws-development',
      name: 'general',
      description: 'Utvecklingsdiskussioner',
      type: 'TEXT'
    }
  });

  await prisma.channel.upsert({
    where: { id: 'ch-bugs' },
    update: {},
    create: {
      id: 'ch-bugs',
      workspaceId: 'ws-development',
      name: 'bugs',
      description: 'Buggrapporter och fixes',
      type: 'TEXT'
    }
  });

  await prisma.channel.upsert({
    where: { id: 'ch-code-review' },
    update: {},
    create: {
      id: 'ch-code-review',
      workspaceId: 'ws-development',
      name: 'code-review',
      description: 'PR reviews och diskussioner',
      type: 'TEXT'
    }
  });

  console.log('✅ Created 7 channels');

  // ============================================
  // 5. CREATE MESSAGES (60+ realistic messages)
  // ============================================
  console.log('💬 Creating messages and conversations...');
  
  // General channel - welcome messages
  const msg1 = await prisma.message.create({
    data: {
      id: 'msg-1',
      channelId: 'ch-general',
      authorId: 'user-admin',
      content: 'Välkomna till Boxflow HQ! 🎉 Här är vår huvudkanal för allmänna uppdateringar och diskussioner.',
      isPinned: true,
      pinnedAt: new Date(),
      pinnedBy: 'user-admin',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    }
  });

  const msg2 = await prisma.message.create({
    data: {
      channelId: 'ch-general',
      authorId: 'user-erik',
      content: 'Tack! Glad att vara här! 🚀',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
    }
  });

  const msg3 = await prisma.message.create({
    data: {
      channelId: 'ch-general',
      authorId: 'user-anna',
      content: 'Ser fram emot att jobba med er alla! 😊',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000)
    }
  });

  // General channel - dagens konversation
  await prisma.message.create({
    data: {
      channelId: 'ch-general',
      authorId: 'user-david',
      content: 'Morgon alla! ☀️ Hur ser schemat ut idag?',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-general',
      authorId: 'user-lisa',
      content: 'Standup kl 9, sen har vi design review kl 10!',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-general',
      authorId: 'user-jonas',
      content: 'Perfekt! Jag deployar den nya versionen till staging efter standup 🚀',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000)
    }
  });

  // Random channel - casual konversation
  await prisma.message.create({
    data: {
      channelId: 'ch-random',
      authorId: 'user-peter',
      content: 'Någon som vill ha kaffe? ☕',
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-random',
      authorId: 'user-maria',
      content: 'Ja tack! Tar en cappuccino 😊',
      createdAt: new Date(Date.now() - 28 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-random',
      authorId: 'user-emma',
      content: 'Latte för mig! 🙌',
      createdAt: new Date(Date.now() - 27 * 60 * 1000)
    }
  });

  // Announcements - viktigt meddelande
  const announcement = await prisma.message.create({
    data: {
      channelId: 'ch-announcements',
      authorId: 'user-admin',
      content: '📢 Viktigt: Vi uppgraderar servern på fredag kväll. Förvänta 30 min downtime kl 22:00.',
      isPinned: true,
      pinnedAt: new Date(),
      pinnedBy: 'user-admin',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });

  // Development channels - tech diskussioner
  await prisma.message.create({
    data: {
      channelId: 'ch-dev-general',
      authorId: 'user-erik',
      content: 'Ska vi migrera till Prisma 7? Senaste versionen har bra performance improvements',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-dev-general',
      authorId: 'user-anna',
      content: 'Ja absolut! Jag såg att query performance är 30% bättre',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 5 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-dev-general',
      authorId: 'user-jonas',
      content: 'Breaking changes verkar minimala. Kör på! 🚀',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 10 * 60 * 1000)
    }
  });

  // Bugs channel
  await prisma.message.create({
    data: {
      channelId: 'ch-bugs',
      authorId: 'user-sofia',
      content: '🐛 Hittade ett bug: användare kan inte ladda upp bilder större än 5MB',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-bugs',
      authorId: 'user-maria',
      content: 'På det! Jag kollar på file upload-logiken nu',
      createdAt: new Date(Date.now() - 55 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-bugs',
      authorId: 'user-maria',
      content: 'Fixed! Körde en PR: #234',
      createdAt: new Date(Date.now() - 20 * 60 * 1000)
    }
  });

  // Code review channel
  await prisma.message.create({
    data: {
      channelId: 'ch-code-review',
      authorId: 'user-anna',
      content: 'PR #235 är redo för review: refactor/backend-cleanup',
      createdAt: new Date(Date.now() - 40 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-code-review',
      authorId: 'user-erik',
      content: 'Approved! 👍 Snygg cleanup, bra jobbat!',
      createdAt: new Date(Date.now() - 35 * 60 * 1000)
    }
  });

  // Booking channel - bot notifications
  await prisma.message.create({
    data: {
      channelId: 'ch-bookings',
      authorId: 'user-bot',
      content: '📅 Ny bokning: Konferensrum A bokad av David (14:00-15:00)',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  });

  await prisma.message.create({
    data: {
      channelId: 'ch-bookings',
      authorId: 'user-bot',
      content: '📅 Ny bokning: Mötesrum B bokad av Lisa (15:00-16:00)',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Created 20+ messages');

  // ============================================
  // 6. ADD REACTIONS TO MESSAGES
  // ============================================
  console.log('😊 Adding reactions...');
  
  await prisma.reaction.createMany({
    data: [
      { messageId: msg1.id, userId: 'user-erik', emoji: '🎉' },
      { messageId: msg1.id, userId: 'user-anna', emoji: '🎉' },
      { messageId: msg1.id, userId: 'user-maria', emoji: '👍' },
      { messageId: msg1.id, userId: 'user-lisa', emoji: '❤️' },
      { messageId: msg2.id, userId: 'user-admin', emoji: '👍' },
      { messageId: msg3.id, userId: 'user-erik', emoji: '😊' },
      { messageId: announcement.id, userId: 'user-erik', emoji: '👀' },
      { messageId: announcement.id, userId: 'user-anna', emoji: '👀' },
      { messageId: announcement.id, userId: 'user-maria', emoji: '✅' }
    ]
  });

  console.log('✅ Added 9 reactions');

  // ============================================
  // 7. CREATE DM CHANNELS & MESSAGES
  // ============================================
  console.log('💬 Creating DM conversations...');
  
  // DM: Erik <-> Anna
  const dmChannel1 = await prisma.directMessageChannel.create({
    data: {
      id: 'dm-erik-anna',
      participants: {
        create: [
          { userId: 'user-erik' },
          { userId: 'user-anna' }
        ]
      }
    }
  });

  await prisma.directMessage.createMany({
    data: [
      {
        channelId: dmChannel1.id,
        authorId: 'user-erik',
        content: 'Hej Anna! Kan du kolla på det bug Sofia rapporterade?',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        channelId: dmChannel1.id,
        authorId: 'user-anna',
        content: 'Absolut! Jag kollar på det direkt efter standup',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 2 * 60 * 1000)
      },
      {
        channelId: dmChannel1.id,
        authorId: 'user-erik',
        content: 'Perfekt, tack! 👍',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 5 * 60 * 1000)
      }
    ]
  });

  // DM: David <-> Lisa
  const dmChannel2 = await prisma.directMessageChannel.create({
    data: {
      id: 'dm-david-lisa',
      participants: {
        create: [
          { userId: 'user-david' },
          { userId: 'user-lisa' }
        ]
      }
    }
  });

  await prisma.directMessage.createMany({
    data: [
      {
        channelId: dmChannel2.id,
        authorId: 'user-david',
        content: 'Lisa, är design mockups för nya funktionen klara?',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        channelId: dmChannel2.id,
        authorId: 'user-lisa',
        content: 'Ja! Jag delar Figma-länken i #general om 10 min',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 3 * 60 * 1000)
      }
    ]
  });

  console.log('✅ Created 2 DM channels with 5 messages');

  // ============================================
  // 8. ADD BOOKMARKS
  // ============================================
  console.log('🔖 Adding bookmarks...');
  
  await prisma.bookmarkedMessage.createMany({
    data: [
      {
        userId: 'user-admin',
        workspaceId: 'ws-boxflow',
        messageId: msg1.id
      },
      {
        userId: 'user-erik',
        workspaceId: 'ws-boxflow',
        messageId: announcement.id
      },
      {
        userId: 'user-anna',
        workspaceId: 'ws-boxflow',
        messageId: announcement.id
      }
    ]
  });

  console.log('✅ Added 3 bookmarks');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Seeding complete!');
  console.log('📊 Summary:');
  console.log(`  - ${users.length} users (1 super admin, 1 admin, 8 staff, 1 bot)`);
  console.log('  - 2 workspaces (Boxflow HQ, Development)');
  console.log('  - 7 channels (4 in Boxflow HQ, 3 in Development)');
  console.log('  - 20+ channel messages with realistic conversations');
  console.log('  - 2 DM channels with 5 direct messages');
  console.log('  - 9 reactions on messages');
  console.log('  - 2 pinned messages');
  console.log('  - 3 bookmarks');
  console.log('\n🚀 Ready for development!');
  console.log('📝 Login as: admin@boxflow.se (SUPER_ADMIN)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
