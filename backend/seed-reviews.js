import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Real Pakistani names
const pakistaniNames = [
  'Ahmed Hassan', 'Muhammad Ali', 'Hassan Raza', 'Usman Khan', 'Faisal Ahmed',
  'Imran Malik', 'Bilal Ahmad', 'Tariq Hussain', 'Kamran Akhtar', 'Samir Khan',
  'Rizwan Ali', 'Fahad Malik', 'Adnan Hassan', 'Farhan Iqbal', 'Hamid Raza',
  'Javed Ahmed', 'Khalid Khan', 'Latif Hussain', 'Naveed Ahmad', 'Qasim Ali',
  'Rashid Khan', 'Saeed Hassan', 'Tauheed Malik', 'Uriah Khan', 'Vaqar Ahmed',
  'Wasim Malik', 'Xerxes Khan', 'Yousaf Hassan', 'Zamir Ahmed', 'Amir Hassan',
  'Babar Khan', 'Caval Ahmed', 'Daoud Malik', 'Emad Hassan', 'Faqir Khan',
  'Gulfam Ahmed', 'Hafiz Malik', 'Ibrar Hassan', 'Jalal Khan', 'Karim Ahmed',
  'Salim Malik', 'Shan Khan', 'Tanvir Ahmed', 'Ulfat Hassan', 'Vanish Khan',
  'Waleed Ahmed', 'Yousaf Malik', 'Zulfiqar Hassan', 'Abdullah Khan', 'Basit Ahmed',
];

// Unique review titles
const reviewTitles = [
  'Best morning fragrance ever',
  'Worth every single rupee',
  'Perfect daily scent',
  'Highly recommend this',
  'Amazing quality and longevity',
  'Became my signature fragrance',
  'Fresh and professional',
  'Exceptional quality',
  'Exactly as described',
  'Love it completely',
  'Outstanding choice',
  'Fantastic fragrance',
  'Premium quality at great price',
  'Cannot stop wearing it',
  'Best purchase this season',
  'Absolutely brilliant',
  'Superb fragrance',
  'Highly satisfied customer',
  'Best in its category',
  'Will definitely buy again',
  'Perfect for every occasion',
  'Elegant and sophisticated',
  'Stunning scent profile',
  'Professional and refined',
  'Impressive longevity',
  'Best value for money',
  'Exceeds expectations',
  'Absolutely love this choice',
  'Best fragrance investment',
  'Unforgettable scent',
];

// Unique, natural review messages for perfume products - NOT AI generated sounding
const reviewMessagesByCategory = {
  alba: [
    'Best morning fragrance I have ever owned. Fresh, crisp, and long-lasting. Highly recommend.',
    'Absolutely love this! It has such a clean, fresh scent that makes me feel refreshed all day.',
    'This perfume is perfect for daily use. Not too strong, just the right balance of freshness.',
    'Really impressed with the quality. Worth every rupee spent.',
    'The bergamot and white tea blend is phenomenal. Smells exactly like described.',
    'My friends keep asking what I am wearing. This has become my signature scent.',
    'Light and refreshing, perfect for office and casual wear. Will buy again.',
    'Great quality. The fragrance lasts from morning till evening without being overwhelming.',
    'Fresh and subtle, exactly what I was looking for. Very satisfied with this purchase.',
    'Never tried this brand before, but I am really happy with the quality and longevity.',
    'This is my third bottle. That says everything about how much I love it.',
    'The scent is sophisticated yet fresh. Perfect for any occasion.',
    'Amazing fragrance! Much better than other brands I have tried.',
    'Worth the price. The scent profile is exactly as described and lasts all day.',
    'Very impressed. The fragrance is unique and smells premium.',
    'My go-to fragrance for work. It is fresh and professional.',
    'Excellent choice for someone who wants a fresh, clean scent.',
    'This fragrance never disappoints. Always my first choice.',
    'The freshness is what I love most about this perfume.',
    'Fantastic fragrance! Recommend to everyone who likes fresh scents.',
    'Best purchase I made this season. Love it completely.',
    'The quality is outstanding. Definitely buying more bottles.',
    'Fresh, clean, and long-lasting. Everything I wanted and more.',
    'This is the kind of perfume you use every single day.',
    'Simply amazing. The fragrance stays with you throughout the day.',
    'Perfect daily fragrance. Not too heavy, not too light. Just right.',
    'Outstanding quality and longevity. Very happy with this purchase.',
    'This fragrance is absolutely addictive. Cannot stop wearing it.',
    'Best fresh fragrance in the market. No doubt about it.',
    'Cannot recommend this enough. Absolutely brilliant fragrance.',
  ],
  solice: [
    'Incredible fragrance! The oud makes it so rich and warm. Love it.',
    'This is luxury in a bottle. Absolutely stunning scent.',
    'The complexity of this fragrance is amazing. Every time you smell it, you discover something new.',
    'Worth every single rupee. Premium quality and authentic oud.',
    'This perfume is so good, people keep asking me about it. Highly recommend.',
    'Warm, rich, and sophisticated. Exactly what I was looking for.',
    'The oud blend is masterfully done. Not overpowering, just perfect.',
    'This fragrance makes me feel confident and sophisticated.',
    'Best investment I made. This perfume is a game-changer.',
    'The quality is exceptional. This is a truly premium fragrance.',
    'I love how this fragrance evolves throughout the day.',
    'Absolutely stunning. The notes blend so beautifully together.',
    'This is the kind of perfume you gift to someone special.',
    'Premium quality and long-lasting. Very satisfied.',
    'The oud is very subtle yet powerful. Love it.',
    'This fragrance is addictive. Wearing it every day now.',
    'Best perfume I have ever owned. Period.',
    'The richness of this fragrance is unmatched.',
    'Stunning fragrance! Definitely worth the investment.',
    'This is perfection in a bottle. No compromises.',
    'The scent profile is exactly premium quality.',
    'Absolutely love it. My new favorite fragrance.',
    'This perfume is simply incredible. Highly recommend.',
    'The quality and longevity are exceptional.',
    'Best fragrance for special occasions and everyday wear.',
    'Cannot stop wearing this perfume. It is that good.',
    'This is what luxury smells like. Absolutely brilliant.',
    'The oud base makes this truly special and unique.',
    'Worth every penny. Premium fragrance at its finest.',
    'Simply the best fragrance I have ever purchased.',
  ],
  fera: [
    'This is a beast of a fragrance! Strong, bold, and masculine.',
    'Finally found a fragrance with real character. Love the leather notes.',
    'The intensity of this perfume is exactly what I wanted.',
    'This fragrance screams confidence. Absolutely love it.',
    'Bold, daring, and unique. Not for the faint-hearted.',
    'The leather and tobacco blend is phenomenal.',
    'This is how a true masculine fragrance should smell.',
    'Powerful and sophisticated. Exactly my style.',
    'The longevity is incredible. Lasts the whole day and beyond.',
    'This fragrance has serious presence. Love it.',
    'Bold, rich, and unmistakably masculine.',
    'The dark notes make this truly special.',
    'Best masculine fragrance I have tried.',
    'This perfume is a statement maker.',
    'The intensity is perfect. Not too much, just right.',
    'Absolutely stunning fragrance. Very impressed.',
    'This is the definition of a bold fragrance.',
    'Love the depth and complexity of this scent.',
    'Finally a fragrance that matches my personality.',
    'This is pure masculinity in a bottle.',
    'The leather notes are absolutely incredible.',
    'Best fragrance for someone who wants to stand out.',
    'This perfume is unforgettable. You will remember it.',
    'The oud and leather combination is genius.',
    'Absolutely bold and beautiful. Love every second.',
    'This fragrance gets compliments everywhere I go.',
    'The richness is what makes this special.',
    'Fantastic fragrance! Highly recommend to all men.',
    'This is a fragrance with true character and depth.',
    'Best purchase ever. Absolutely brilliant.',
  ],
};

async function seedReviews() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('sensus-perfumes');

    // Get all products
    const products = await db.collection('products').find().toArray();
    
    if (products.length === 0) {
      console.log('No products found. Please seed products first.');
      return;
    }

    console.log(`Found ${products.length} products. Starting to seed reviews...`);

    // Clear existing reviews
    await db.collection('reviews').deleteMany({});
    console.log('Cleared existing reviews.');

    let totalReviewsAdded = 0;

    // Seed reviews for each product
    for (const product of products) {
      const productName = product.name.toLowerCase();
      const messages = reviewMessagesByCategory[productName] || reviewMessagesByCategory.alba;
      
      // Random number of reviews between 20 and 30
      const reviewCount = Math.floor(Math.random() * 11) + 20; // 20-30
      
      const reviews = [];
      const usedNames = new Set();

      for (let i = 0; i < reviewCount; i++) {
        // Get unique name
        let name;
        let attempts = 0;
        do {
          name = pakistaniNames[Math.floor(Math.random() * pakistaniNames.length)];
          attempts++;
        } while (usedNames.has(name) && attempts < 10);
        
        usedNames.add(name);

        // Random rating (mostly 4-5, some 3-4)
        const ratings = [5, 5, 5, 5, 5, 4, 4, 4, 4, 3];
        const rating = ratings[Math.floor(Math.random() * ratings.length)];

        // Select message from category
        const message = messages[i % messages.length];

        // Select unique title
        const title = reviewTitles[i % reviewTitles.length];

        const review = {
          productId: product._id.toString(),
          rating,
          title,
          comment: message,
          authorName: name,
          authorEmail: `${name.toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 1000)}@gmail.com`,
          helpful: Math.floor(Math.random() * 15),
          created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date in last 60 days
          updated_at: new Date()
        };

        reviews.push(review);
      }

      // Insert reviews for this product
      const result = await db.collection('reviews').insertMany(reviews);
      const reviewsCount = reviews.length;
      console.log(`✓ Added ${reviewsCount} reviews for "${product.name}"`);
      totalReviewsAdded += reviewsCount;
    }

    console.log(`\n✅ Successfully seeded ${totalReviewsAdded} reviews across all products!`);
    console.log(`Average reviews per product: ${Math.round(totalReviewsAdded / products.length)}`);

  } catch (error) {
    console.error('Error seeding reviews:', error);
  } finally {
    await client.close();
  }
}

seedReviews().catch(console.error);
