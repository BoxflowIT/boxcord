/* eslint-disable */
// Check active voice sessions in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Voice Sessions ===\n');
  
  // Get all voice sessions
  const allSessions = await prisma.voiceSession.findMany({
    orderBy: { joinedAt: 'desc' }
  });

  console.log(`Total sessions: ${allSessions.length}`);
  
  // Get active sessions (not left)
  const activeSessions = allSessions.filter(s => s.leftAt === null);
  
  console.log(`Active sessions (leftAt = null): ${activeSessions.length}\n`);
  
  if (activeSessions.length > 0) {
    console.log('Active Sessions:');
    activeSessions.forEach(s => {
      console.log(`  - User ${s.userId} in Channel ${s.channelId}`);
      console.log(`    Session ID: ${s.id}`);
      console.log(`    Joined: ${s.joinedAt}`);
      console.log(`    Muted: ${s.isMuted}, Deafened: ${s.isDeafened}, Speaking: ${s.isSpeaking}\n`);
    });
  }

  if (allSessions.length > 0) {
    console.log('\nAll sessions (last 10):');
    allSessions.slice(0, 10).forEach(s => {
      console.log(`  - User ${s.userId} in Channel ${s.channelId}`);
      console.log(`    Session ID: ${s.id}`);
      console.log(`    Joined: ${s.joinedAt}`);
      console.log(`    Left: ${s.leftAt || 'STILL ACTIVE'}\n`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
