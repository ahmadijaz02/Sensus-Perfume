import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

/**
 * Returns a cached MongoDB database instance.
 * Safe for Vercel serverless: connection is reused across warm invocations.
 */
export async function connectDB() {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 45000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority',
    readPreference: 'primaryPreferred'
  });

  await client.connect();
  cachedClient = client;
  cachedDb = client.db('sensus-perfumes');

  console.log('✅ MongoDB Connected (serverless)');

  // Create indexes once per function instance (warm reuse skips this)
  if (!indexesEnsured) {
    await ensureIndexes(cachedDb);
    indexesEnsured = true;
  }

  return cachedDb;
}

async function ensureIndexes(db) {
  const createIndexSafely = async (collection, indexSpec, options = {}) => {
    try {
      await db.collection(collection).createIndex(indexSpec, { background: true, ...options });
    } catch (error) {
      if (error.code !== 86) {
        console.warn(`Index warning on ${collection}:`, error.message);
      }
    }
  };

  try {
    await createIndexSafely('users', { email: 1 }, { unique: true });
    await createIndexSafely('orders', { created_at: -1 });
    await createIndexSafely('products', { category: 1 });
    await createIndexSafely('products', { name: 1 });
    await createIndexSafely('products', { created_at: -1 });
    await createIndexSafely('products', { _id: 1, 'variants.size': 1 }); // fast cart variant lookups
    await createIndexSafely('carts', { userId: 1 }, { unique: true });
    await createIndexSafely('carts', { 'items.productId': 1 });
    await createIndexSafely('carts', { updatedAt: -1 });
    await createIndexSafely('reviews', { productId: 1 });
    await createIndexSafely('reviews', { createdAt: -1 });
    console.log('✅ Database indexes ensured');
  } catch (error) {
    console.warn('Index creation warning:', error.message);
  }
}
