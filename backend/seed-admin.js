import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('🌱 Seeding admin user...');
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('sensus-perfumes');
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'admin@sensus.com' 
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      await client.close();
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      email: 'admin@sensus.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@sensus.com');
    console.log('🔑 Password: admin123');
    console.log(`🆔 User ID: ${result.insertedId}`);
    
    await client.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
