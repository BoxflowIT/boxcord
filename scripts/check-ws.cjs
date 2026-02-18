const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const ws = await prisma.workspace.findFirst({
    where: { id: '24d306cc-ef47-4e76-a3ad-4af229931659' },
    include: { 
      members: {
        include: { user: true }
      }
    }
  });
  
  if (!ws) {
    console.log('Workspace not found');
  } else {
    console.log('Workspace:', ws.name);
    console.log('Members:');
    for (const m of ws.members) {
      console.log('  -', m.user.email, 'role:', m.role);
    }
  }
  
  // Check current user
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'jens' } }
  });
  console.log('\nCurrent user:', user?.email, 'id:', user?.id);
  
  await prisma.$disconnect();
})();
