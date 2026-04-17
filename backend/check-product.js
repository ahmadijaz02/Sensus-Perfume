import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

async function checkProduct() {
  try {
    await client.connect();
    const db = client.db();
    
    const productId = '6969393b95e5cca4db948b81';
    console.log('Checking for product:', productId);
    
    // Try to find the product
    const product = await db.collection('products').findOne({ 
      _id: new ObjectId(productId) 
    });
    
    if (product) {
      console.log('✅ Product found:', product.name);
    } else {
      console.log('❌ Product NOT found');
      
      // Show all products
      const allProducts = await db.collection('products').find().toArray();
      console.log('\n📊 All products in database:');
      console.log('Total:', allProducts.length);
      allProducts.forEach(p => {
        console.log(`  - ${p._id.toString()}: ${p.name}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkProduct();
