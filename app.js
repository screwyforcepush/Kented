const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

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
  const { latitude, longitude } = req.body; // Adjusted to directly use the body data
  // Implemented logic to find and join a chatroom based on user location
  // This includes finding nearby chatrooms or creating a new one if none exist
  res.send(`Joined chatroom near ${latitude}, ${longitude}`);
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
