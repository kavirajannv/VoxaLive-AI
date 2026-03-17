const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// ─── Firebase Admin SDK ────────────────────────────────────────
let admin;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
      console.log('🔥 Firebase Admin SDK initialized');
    } else {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'local' });
      console.warn('⚠️  Firebase Admin started without service account — token verification disabled');
    }
  }
} catch (e) {
  console.warn('⚠️  firebase-admin not installed, auth will use legacy JWT');
}

const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');
const conversationRoutes = require('./routes/conversations');
const setupChatHandler = require('./socket/chatHandler');

const app = express();
const server = http.createServer(app);

const isProd = process.env.NODE_ENV === 'production';

// ─── Security & Performance Middleware ────────────────────────────
if (isProd) {
  // Security headers (relaxed CSP for WebRTC & WebSocket)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "wss:", "ws:", "https://translate.googleapis.com"],
        mediaSrc: ["'self'", "blob:"],
        imgSrc: ["'self'", "data:", "blob:"],
      }
    }
  }));

  // Gzip compression
  app.use(compression());

  // HTTP request logging (combined format for production)
  app.use(morgan('combined'));
} else {
  // Dev logging (concise)
  app.use(morgan('dev'));
}

// Rate limiting on auth routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 20 : 100, // strict in production, relaxed in dev
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: isProd ? (process.env.FRONTEND_URL || false) : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: isProd ? (process.env.FRONTEND_URL || false) : allowedOrigins,
  credentials: true
}));

// ─── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/conversations', conversationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ─── Serve Frontend (Production) ──────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, 'public', 'dist');
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Socket.IO ─────────────────────────────────────────────────────
setupChatHandler(io);

// ─── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-translator');
    console.log('✅ Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
      console.log(`🌐 Socket.IO ready for connections`);
      if (isProd) {
        console.log(`📦 Serving frontend from /public/dist`);
      }
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Starting server without MongoDB...');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}] (no database)`);
      console.log(`🌐 Socket.IO ready for connections`);
    });
  }
};

// ─── Graceful Shutdown ─────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('   HTTP server closed.');
  });
  try {
    await mongoose.connection.close();
    console.log('   MongoDB connection closed.');
  } catch (err) {
    // Ignore errors during shutdown
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
