import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  // Kolla DM-kanaler och participants
  const dmChannels = await prisma.dMChannel.findMany({
    include: {
      participants: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  console.log('\n=== DM CHANNELS ===');
  for (const ch of dmChannels) {
    console.log(`Channel: ${ch.id.slice(-8)}`);
    console.log(`  Created: ${ch.createdAt}`);
    console.log(`  Last message: ${ch.messages[0]?.createdAt || 'None'}`);
    for (const p of ch.participants) {
      console.log(`  Participant: ${p.userId.slice(-8)}, lastReadAt: ${p.lastReadAt}`);
    }
  }
  
  // Kolla users
  const users = await prisma.user.findMany();
  console.log('\n=== USERS ===');
  for (const u of users) {
    console.log(`User: ${u.id.slice(-8)} - ${u.email}`);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
