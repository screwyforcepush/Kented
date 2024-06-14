const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const geolocation = require('geolocation');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

// Middleware to check and handle geolocation data
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/location') {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).send('Location data is required');
    }
    req.location = { latitude, longitude };
  }
  next();
});

// WebSocket connection for real-time communication
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message: ' + message);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
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
  const { latitude, longitude } = req.location;
  // Logic to find and join a chatroom based on user location goes here
  res.send(`Joined chatroom near ${latitude}, ${longitude}`);
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
