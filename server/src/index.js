const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection, getIsConnected } = require('./db');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const queueRoutesFactory = require('./routes/queue');
const vitalsRoutesFactory = require('./routes/vitals');
const consultationRoutesFactory = require('./routes/consultations');
const store = require('./db/store');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutesFactory(io));
app.use('/api/vitals', vitalsRoutesFactory(io));
app.use('/api/consultations', consultationRoutesFactory(io));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    postgresConnected: getIsConnected(),
    persistenceMode: getIsConnected() ? 'PostgreSQL (Cloud / Local)' : 'Resilient In-Memory / Hybrid Sandbox Mode',
    service: 'Public Clinic Smart Queue & EHR API'
  });
});

// Serve frontend build if available
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Socket.io Real-Time Channel
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('[Server] Testing PostgreSQL connection...');
  await testConnection();

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Public Clinic Smart Queue & EHR System`);
    console.log(` Server & Web App: http://localhost:${PORT}`);
    console.log(` Persistence: ${getIsConnected() ? 'PostgreSQL Active' : 'In-Memory Fallback Active'}`);
    console.log(` Real-time WebSockets: Active on port ${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();

module.exports = { app, server };
