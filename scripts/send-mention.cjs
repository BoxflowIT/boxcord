// Send a message with mention to test push notifications
/* eslint-disable */
// Node.js test script for sending mentions
const io = require('socket.io-client');

const CHANNEL_ID = 'ch-bookings'; // Different channel to avoid mixing with your current chat
// User-2 (Anna Andersson): anna@boxflow.com
const USER2_PAYLOAD = {
  sub: "user-2",
  email: "anna@boxflow.com",
  name: "Anna Andersson",
  workspaces: [{ id: "1", role: "MEMBER" }]
};
const TOKEN = 'mock.' + Buffer.from(JSON.stringify(USER2_PAYLOAD)).toString('base64');

console.log('Connecting to WebSocket...');

const socket = io('http://localhost:3001', {
  auth: { token: TOKEN },
  transports: ['websocket'],
  reconnection: false,
  forceNew: true
});

socket.on('connect', () => {
  console.log('Connected! Socket ID:', socket.id);
  
  // Join the channel first
  console.log(`Joining channel: ${CHANNEL_ID}`);
  socket.emit('channel:join', CHANNEL_ID);
  
  // Wait a bit then send message with mention
  setTimeout(() => {
    const message = {
      channelId: CHANNEL_ID,
      content: 'Hej @jens@boxflow.com, detta är ett test av push notifications från en annan användare! 🔔'
    };
    
    console.log('Sending message with mention:', message.content);
    socket.emit('message:send', message);
    
    // Wait for broadcast then close
    setTimeout(() => {
      console.log('Done! Check for browser notification.');
      socket.close();
      process.exit(0);
    }, 2000);
  }, 1000);
});

socket.on('message:new', (msg) => {
  console.log('✅ Message broadcast received:', msg.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout!');
  socket.close();
  process.exit(1);
}, 10000);
