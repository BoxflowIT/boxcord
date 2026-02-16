/* eslint-disable */
// Node.js test script for sending DMs
const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3001';
// User-2 (Anna Andersson): anna@boxflow.com
const USER2_PAYLOAD = {
  sub: "user-2",
  email: "anna@boxflow.com",
  name: "Anna Andersson",
  workspaces: [{ id: "1", role: "MEMBER" }]
};
const USER2_TOKEN = 'mock.' + Buffer.from(JSON.stringify(USER2_PAYLOAD)).toString('base64');

// Jens's actual user ID from database
const JENS_USER_ID = "f02cf92c-d0e1-70d4-02de-db967a695a11";

async function sendDM() {
  console.log('Connecting to WebSocket...');
  
  const socket = io(SOCKET_URL, {
    auth: { token: USER2_TOKEN },
    transports: ['websocket']
  });

  socket.on('connect', async () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    
    // First, get or create DM channel between user-2 and jens
    try {
      const response = await fetch('http://localhost:3001/api/v1/dm/channels', {
        headers: {
          'Authorization': `Bearer ${USER2_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('DM Channels:', data);
      
      // Find DM with jens@boxflow.com
      let dmChannel = data.data?.find(dm => 
        dm.participants?.some(p => p.user?.email === 'jens@boxflow.com')
      );
      
      if (!dmChannel) {
        console.log('Creating DM channel with jens@boxflow.com...');
        // Create DM channel - use userId not email
        const createResponse = await fetch('http://localhost:3001/api/v1/dm/channels', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${USER2_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: JENS_USER_ID
          })
        });
        
        const createData = await createResponse.json();
        console.log('Created DM:', createData);
        dmChannel = createData.data;
      }
      
      if (!dmChannel) {
        console.error('Failed to get or create DM channel');
        socket.disconnect();
        process.exit(1);
      }
      
      console.log(`Using DM channel: ${dmChannel.id}`);
      
      // Join DM channel
      socket.emit('dm:join', dmChannel.id);
      console.log(`Joined DM channel: ${dmChannel.id}`);
      
      // Wait a bit for join to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send DM
      const message = 'Hej Jens! Detta är ett test av DM real-time notifications från user-2! 🔔';
      console.log(`Sending DM: ${message}`);
      
      socket.emit('dm:send', {
        channelId: dmChannel.id,
        content: message
      });
      
      // Wait for broadcast confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ DM sent! Check for browser notification and unread badge.');
      socket.disconnect();
      process.exit(0);
      
    } catch (err) {
      console.error('Error:', err);
      socket.disconnect();
      process.exit(1);
    }
  });

  socket.on('dm:new', (message) => {
    console.log('✅ DM broadcast received:', message.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    socket.disconnect();
    process.exit(1);
  });
}

sendDM();
