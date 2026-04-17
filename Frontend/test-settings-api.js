import express from 'express';
import { MongoClient } from 'mongodb';
import settingsRoutes from './backend/routes/settings.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

// Create a test Express app
const app = express();
app.use(express.json());

// Mock middleware for db
app.use(async (req, res, next) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    req.db = client.db('sensus-perfumes');
    req.client = client; // Keep client reference to close later
    next();
  } catch (e) {
    console.error('DB Connection error:', e.message);
    res.status(500).json({ error: 'DB connection failed' });
  }
});

app.use('/api/settings', settingsRoutes);

// Test the API
const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`\n🧪 Testing Settings API on http://localhost:${port}\n`);
  
  try {
    // Test GET
    console.log('📤 Testing GET /api/settings...');
    const getResponse = await fetch(`http://localhost:${port}/api/settings`);
    const getData = await getResponse.json();
    
    console.log(`✅ GET Status: ${getResponse.status}`);
    console.log(`✅ Response keys: ${Object.keys(getData).join(', ')}`);
    console.log(`✅ Sample data:`, JSON.stringify(getData).substring(0, 150));
    
  } catch (e) {
    console.error('❌ GET /api/settings FAILED:', e.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
