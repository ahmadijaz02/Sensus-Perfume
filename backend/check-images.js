import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkImages() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('sensus-perfumes');
    const products = await db.collection('products').find({ featured: true }).limit(3).toArray();
    
    console.log('Featured products in database:');
    products.forEach(p => {
      console.log(`  ${p.name}: ${p.image}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkImages();
