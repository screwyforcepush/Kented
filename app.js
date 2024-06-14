const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const geolocation = require('geolocation-utils'); // For calculating distances based on coordinates

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(express.json()); // To parse JSON bodies

let chatrooms = []; // Store chatrooms with their locations and names

// Function to broadcast the updated list of active chatrooms
function broadcastActiveChatrooms() {
  const activeChatrooms = chatrooms.map(chatroom => chatroom.name);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'activeChatrooms', activeChatrooms }));
    }
  });
}

// WebSocket connection for real-time communication
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message: ' + message);
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === 'message') {
      // Find the chatroom to which the message belongs
      const chatroom = chatrooms.find(chatroom => chatroom.members.some(member => member.ws === ws));
      if (chatroom) {
        // Store the message in the chatroom's messages array
        if (!chatroom.messages) {
          chatroom.messages = [];
        }
        chatroom.messages.push(parsedMessage.message);
        // Broadcast the message to all members of the chatroom
        chatroom.members.forEach(member => {
          if (member.ws !== ws && member.ws.readyState === WebSocket.OPEN) {
            member.ws.send(JSON.stringify({ type: 'message', message: parsedMessage.message }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Update chatroom members and broadcast active chatrooms on client disconnect
    chatrooms.forEach(chatroom => {
      chatroom.members = chatroom.members.filter(member => member.ws !== ws);
    });
    broadcastActiveChatrooms();
  });

  // Send chat history to the client when they join a chatroom
  ws.on('join', (chatroomName) => {
    const chatroom = chatrooms.find(chatroom => chatroom.name === chatroomName);
    if (chatroom && chatroom.messages) {
      ws.send(JSON.stringify({ type: 'history', messages: chatroom.messages }));
    }
  });
});

// Route to handle location-based chatroom joining
app.post('/location', (req, res) => {
  const { latitude, longitude } = req.body;
  // Find the nearest chatroom or create a new one if none are close enough
  let nearestChatroom = chatrooms.find(chatroom => geolocation.distance({lat: latitude, lon: longitude}, {lat: chatroom.latitude, lon: chatroom.longitude}) < 5000);
  if (!nearestChatroom) {
    const chatroomName = `Chatroom at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    nearestChatroom = { name: chatroomName, latitude, longitude, members: [], messages: [] };
    chatrooms.push(nearestChatroom);
  }
  // Logic to add user to the nearest chatroom
  nearestChatroom.members.push({ ws });
  // Broadcast the updated list of active chatrooms whenever a new user joins
  broadcastActiveChatrooms();
  res.json({ chatroom: nearestChatroom.name, activeChatrooms: chatrooms.map(chatroom => chatroom.name) });
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
