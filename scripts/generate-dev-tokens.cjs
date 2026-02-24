#!/usr/bin/env node
/* eslint-disable */
/**
 * Generate mock JWT tokens for local development
 * 
 * Usage: node scripts/generate-dev-tokens.cjs
 * 
 * Creates mock tokens for all seeded users to use in development.
 * These tokens bypass Cognito authentication in dev mode.
 */

// Seeded users from prisma/seed.ts
const users = [
  {
    id: 'user-admin',
    email: 'admin@boxflow.se',
    firstName: 'Admin',
    lastName: 'Superanvändare',
    role: 'SUPER_ADMIN'
  },
  {
    id: 'user-erik',
    email: 'erik.johansson@boxflow.se',
    firstName: 'Erik',
    lastName: 'Johansson',
    role: 'ADMIN'
  },
  {
    id: 'user-anna',
    email: 'anna.andersson@boxflow.se',
    firstName: 'Anna',
    lastName: 'Andersson',
    role: 'STAFF'
  },
  {
    id: 'user-maria',
    email: 'maria.svensson@boxflow.se',
    firstName: 'Maria',
    lastName: 'Svensson',
    role: 'STAFF'
  },
  {
    id: 'user-jonas',
    email: 'jonas.berg@boxflow.se',
    firstName: 'Jonas',
    lastName: 'Berg',
    role: 'STAFF'
  },
  {
    id: 'user-lisa',
    email: 'lisa.karlsson@boxflow.se',
    firstName: 'Lisa',
    lastName: 'Karlsson',
    role: 'STAFF'
  },
  {
    id: 'user-david',
    email: 'david.nilsson@boxflow.se',
    firstName: 'David',
    lastName: 'Nilsson',
    role: 'STAFF'
  },
  {
    id: 'user-sofia',
    email: 'sofia.larsson@boxflow.se',
    firstName: 'Sofia',
    lastName: 'Larsson',
    role: 'STAFF'
  },
  {
    id: 'user-peter',
    email: 'peter.olsson@boxflow.se',
    firstName: 'Peter',
    lastName: 'Olsson',
    role: 'STAFF'
  },
  {
    id: 'user-emma',
    email: 'emma.gustafsson@boxflow.se',
    firstName: 'Emma',
    lastName: 'Gustafsson',
    role: 'STAFF'
  }
];

console.log('🔑 Mock JWT Tokens for Local Development\n');
console.log('Copy these tokens to use as Bearer tokens in API requests or browser localStorage:\n');
console.log('=' .repeat(80));

users.forEach((user, index) => {
  const payload = {
    sub: user.id,
    email: user.email,
    given_name: user.firstName,
    family_name: user.lastName,
    role: user.role,
    'custom:role': user.role
  };

  const token = 'mock.' + Buffer.from(JSON.stringify(payload)).toString('base64');

  console.log(`\n${index + 1}. ${user.firstName} ${user.lastName} (${user.role})`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Token: ${token}`);
  
  if (user.role === 'SUPER_ADMIN') {
    console.log('   ⭐ SUPER ADMIN - Full access to all features');
  } else if (user.role === 'ADMIN') {
    console.log('   👑 ADMIN - Workspace management access');
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n📝 How to use:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application → Local Storage → http://localhost:5173');
console.log('3. Add key "auth-token" with one of the tokens above');
console.log('4. Refresh page - you\'re logged in!');

console.log('\n🔧 Or use in API requests:');
console.log('   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/users/me');

console.log('\n✨ Recommendation: Start with admin@boxflow.se (SUPER_ADMIN)\n');
