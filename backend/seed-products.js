import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to create URL-friendly slugs
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

const products = [
  {
    name: 'Alba',
    slug: 'alba',
    brand: 'SENSUS PERFUMES',
    description: 'A radiant morning fragrance that captures the first light of dawn. Alba opens with crisp bergamot and fresh grapefruit, blooming into a heart of white tea and lavender, before settling into a warm embrace of white musk and cedarwood.',
    shortDescription: 'A radiant fragrance capturing the essence of dawn.',
    category: 'men',
    image: '/placeholder.svg',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    variants: [
      { size: '30ml', price: 95 },
      { size: '50ml', price: 145 },
      { size: '100ml', price: 195 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Bergamot', 'Grapefruit', 'Green Apple'] },
      { type: 'heart', notes: ['White Tea', 'Lavender', 'Cardamom'] },
      { type: 'base', notes: ['White Musk', 'Cedarwood', 'Ambrette'] },
    ],
    concentration: 'Eau de Parfum',
    featured: true,
    new: true,
    bestseller: false,
    stock: 100,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: 'Fera',
    slug: 'fera',
    brand: 'SENSUS PERFUMES',
    description: 'An untamed, wild fragrance that embodies raw masculinity. Fera unleashes with fierce black pepper and smoky leather, revealing a heart of dark woods and tobacco, grounded by an animalistic base of oud, benzoin, and musk.',
    shortDescription: 'An untamed fragrance embodying raw masculinity.',
    category: 'men',
    image: '/placeholder.svg',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    variants: [
      { size: '30ml', price: 120 },
      { size: '50ml', price: 180 },
      { size: '100ml', price: 250 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Black Pepper', 'Elemi', 'Juniper'] },
      { type: 'heart', notes: ['Leather', 'Tobacco', 'Dark Woods'] },
      { type: 'base', notes: ['Oud', 'Benzoin', 'Animalic Musk'] },
    ],
    concentration: 'Extrait de Parfum',
    featured: true,
    new: false,
    bestseller: true,
    stock: 80,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    slug: 'solis',
    name: 'Solis',
    brand: 'SENSUS PERFUMES',
    description: 'A luminous, solar fragrance that radiates confidence and warmth. Solis bursts open with zesty citrus and aromatic herbs, evolving into a golden heart of saffron and immortelle, resting on a sun-drenched base of amber, sandalwood, and vanilla.',
    shortDescription: 'A luminous solar fragrance radiating confidence.',
    category: 'men',
    image: '/placeholder.svg',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    variants: [
      { size: '30ml', price: 110 },
      { size: '50ml', price: 165 },
      { size: '100ml', price: 220 },
    ],
    fragranceNotes: [
      { type: 'top', notes: ['Blood Orange', 'Lemon', 'Basil'] },
      { type: 'heart', notes: ['Saffron', 'Immortelle', 'Neroli'] },
      { type: 'base', notes: ['Amber', 'Sandalwood', 'Vanilla'] },
    ],
    concentration: 'Eau de Parfum',
    featured: true,
    new: false,
    bestseller: true,
    stock: 120,
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedProducts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('sensus-perfumes');
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Insert products
    const result = await productsCollection.insertMany(products);
    console.log(`✅ Seeded ${result.insertedCount} products successfully!`);
    
    // Show inserted products
    const allProducts = await productsCollection.find({}).toArray();
    console.log('\n📦 Products in database:');
    allProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.category}) - ${p.variants.length} variants`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

seedProducts();
