const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'oneplay1_super_secret_jwt_key_2026';
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { runSeed } = require('./seed');
const { initGameEngine } = require('./game/gameEngine');
const { setupSocketHandler } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/deposit', require('./routes/depositRoutes'));
app.use('/api/withdraw', require('./routes/withdrawRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Serve Production Frontend (Checks all possible dist locations)
const possibleDistPaths = [
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../dist'),
  path.join(process.cwd(), 'dist')
];
const activeDistPath = possibleDistPaths.find(p => fs.existsSync(p));

if (activeDistPath) {
  console.log(`📦 Serving production frontend from: ${activeDistPath}`);
  app.use(express.static(activeDistPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return res.status(404).json({ message: 'API Route Not Found' });
    }
    res.sendFile(path.join(activeDistPath, 'index.html'));
  });
} else {
  console.log(`⚠️ Production dist folder not found. API mode only.`);
}

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.IP || '0.0.0.0';

async function startServer() {
  try {
    // 1. Run Seed
    await runSeed();

    // 2. Initialize Game Engine
    initGameEngine(io);

    // 3. Setup WebSocket Handlers
    setupSocketHandler(io);

    server.listen(PORT, HOST, () => {
      console.log(`🚀 OnePlay1 Server running on http://${HOST}:${PORT}`);
      console.log(`🎮 Game Engine started and broadcasting`);
      console.log(`🔑 Admin ready: Noman / @Nomankhan1`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
  }
}

startServer();
