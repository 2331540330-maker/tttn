import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import checkinRoutes from './routes/checkin.js';
import checkoutRoutes from './routes/checkout.js';
import parkingRoutes from './routes/parking.js';
import statsRoutes from './routes/stats.js';
import attendanceRoutes from './routes/attendance.js';
import usersRoutes from './routes/users.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import twoFactorRoutes from './routes/twoFactor.js';
import surveillanceRoutes from './routes/surveillance.js';
import remoteCustomerAuthRoutes from './routes/remoteCustomerAuth.js';

// Import middleware
import { apiLimiter, downloadLimiter } from './middleware/rateLimiter.js';

// Import jobs
import { initializeAlertMonitor } from './jobs/alertMonitor.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS - Cho phép cả localhost (dev) lẫn Render.com domain (production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép không có origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking-system')
  .then(() => {
    console.log('✅ MongoDB connected');
    // Initialize alert monitoring after DB connection
    initializeAlertMonitor(io);
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', downloadLimiter, reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/surveillance', surveillanceRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/remote-auth', remoteCustomerAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    version: '2.0.0',
    features: ['reports', 'alerts', '2fa', 'rate-limiting']
  });
});

// ── Serve React Build (Production) ──────────────────────
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname  = path.dirname(__filename);
  const clientDist = path.join(__dirname, '..', 'client', 'dist');

  app.use(express.static(clientDist));

  // SPA fallback: moi route khong phai /api -> tra ve index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });

  console.log(`📦 Serving React build from: ${clientDist}`);
}

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Security features enabled: Helmet, Rate Limiting`);
  console.log(`📊 Advanced features: Reports, Alerts, 2FA`);
});

export { io };
