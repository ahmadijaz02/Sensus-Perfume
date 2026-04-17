import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing anything else
dotenv.config({ path: `${__dirname}/.env` });

import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import newsletterRoutes from './routes/newsletter.js';
import cartRoutes from './routes/cart.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔧 Server starting...');
console.log('Frontend URL:', process.env.FRONTEND_URL);
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://sensusperfume.com',
      'https://www.sensusperfume.com',
      'http://sensusperfume.com',
      'http://www.sensusperfume.com',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // If no origin (like mobile apps or curl), allow it
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost variations
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow local network IPs
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+/) || 
        origin.match(/^http:\/\/10\.\d+\.\d+\.\d+/) ||
        origin.match(/^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));

// Additional CORS handling for preflight requests
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== CACHING SYSTEM ==========
const cache = {
  products: new Map(),
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes
};

const getCacheEntry = (key) => {
  const entry = cache.products.get(key);
  if (!entry) return null;
  const now = Date.now();
  if ((now - entry.time) < cache.CACHE_TTL) {
    console.log('📦 Using cached products', key);
    return entry.value;
  }
  cache.products.delete(key);
  return null;
};

export const getCachedProducts = (key = 'products:default') => {
  return getCacheEntry(key);
};

export const setCachedProducts = (key, products) => {
  cache.products.set(key, { value: products, time: Date.now() });
  console.log('💾 Products cached', key);
};

export const invalidateProductsCache = () => {
  cache.products.clear();
  console.log('🗑️  Products cache invalidated');
};

// Make cache functions available to routes
app.use((req, res, next) => {
  req.getCachedProducts = getCachedProducts;
  req.setCachedProducts = setCachedProducts;
  req.invalidateProductsCache = invalidateProductsCache;
  next();
});

// MongoDB Connection with pooling
let db;
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primaryPreferred'
    });
    
    await client.connect();
    db = client.db('sensus-perfumes');
    console.log('✅ MongoDB Connected Successfully (with connection pooling)');
    
    // Create indexes for better query performance
    console.log('📊 Creating database indexes...');
    
    // Helper function to safely create indexes
    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        const indexName = options.name || Object.keys(indexSpec).map(k => `${k}_${indexSpec[k]}`).join('_');
        const existingIndexes = await db.collection(collection).indexes();
        const indexExists = existingIndexes.some(idx => idx.name === indexName);
        
        if (indexExists) {
          console.log(`  ✓ Index ${indexName} already exists on ${collection}`);
          return;
        }
        
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(`  ✓ Created index ${indexName} on ${collection}`);
      } catch (error) {
        if (error.code === 86) {
          console.log(`  ⚠ Index conflict on ${collection}, skipping...`);
        } else {
          console.error(`  ✗ Failed to create index on ${collection}:`, error.message);
        }
      }
    };
    
    // User indexes
    await createIndexSafely('users', { email: 1 }, { unique: true });
    
    // Order indexes
    await createIndexSafely('orders', { created_at: -1 });
    
    // Product indexes
    await createIndexSafely('products', { category: 1 });
    await createIndexSafely('products', { name: 1 });
    await createIndexSafely('products', { _id: 1, 'variants.size': 1 }, { background: true });
    
    // ⚡ ULTRA-FAST CART QUERIES - Critical indexes
    console.log('⚡ Optimizing cart queries...');
    await createIndexSafely('carts', { userId: 1 }, { unique: true, background: true });
    await createIndexSafely('carts', { 'items.productId': 1 }, { background: true });
    await createIndexSafely('carts', { updatedAt: -1 }, { background: true });
    
    // Review indexes
    await createIndexSafely('reviews', { productId: 1 });
    await createIndexSafely('reviews', { createdAt: -1 });
    
    console.log('✅ All indexes processed successfully');
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Start server
connectDB().then(() => {
  // Make db available to routes
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Routes
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
      timestamp: new Date().toISOString()
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
