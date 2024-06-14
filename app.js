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

// WebSocket connection for real-time communication
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message: ' + message);
    // Determine the chatroom based on user location and send message to that room
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Logic to ensure message is sent to the correct chatroom based on location
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Route to handle location-based chatroom joining
app.post('/location', (req, res) => {
  const { latitude, longitude } = req.body;
  // Find the nearest chatroom or create a new one if none are close enough
  let nearestChatroom = chatrooms.find(chatroom => geolocation.distance({lat: latitude, lon: longitude}, {lat: chatroom.latitude, lon: chatroom.longitude}) < 5000);
  if (!nearestChatroom) {
    const chatroomName = `Chatroom at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    nearestChatroom = { name: chatroomName, latitude, longitude, members: [] };
    chatrooms.push(nearestChatroom);
  }
  // Logic to add user to the nearest chatroom
  nearestChatroom.members.push({ ws });
  res.json({ chatroom: nearestChatroom.name, activeChatrooms: chatrooms.map(chatroom => chatroom.name) });
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
