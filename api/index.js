import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { connectDB } from './lib/db.js';

import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import newsletterRoutes from './routes/newsletter.js';
import cartRoutes from './routes/cart.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    // Allow same-origin (Vercel serves frontend + API from same domain)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://sensusperfume.com',
      'https://www.sensusperfume.com',
      'http://sensusperfume.com',
      'http://www.sensusperfume.com',
    ];

    // Allow Vercel preview deployments (*.vercel.app)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── MongoDB middleware ────────────────────────────────────────────────────────
// Connects (or reuses cached connection) on every request
app.use(async (req, res, next) => {
  try {
    req.db = await connectDB();
    next();
  } catch (error) {
    console.error('DB connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sensus Perfumes API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ── Export ───────────────────────────────────────────────────────────────────
// Vercel serverless handler (Vercel natively supports Express)
export default app;
export { app };
