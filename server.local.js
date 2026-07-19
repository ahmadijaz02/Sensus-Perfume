/**
 * Local development server — NOT used in Vercel production.
 * Run: node server.local.js
 * This starts Express on port 5000 so Vite can proxy /api requests.
 */
import dotenv from 'dotenv';
dotenv.config();

import { app } from './api/index.js';
import { connectDB } from './api/lib/db.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Local API server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
