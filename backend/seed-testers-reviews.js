import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Pakistani names for reviews
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
  'Sara Khan', 'Ayesha Ali', 'Fatima Hassan', 'Zainab Ahmed', 'Hina Malik',
  'Nida Khan', 'Rabia Hassan', 'Safia Ahmad', 'Tayyaba Ahmed', 'Ummah Malik',
];

// Review titles specific to tester packs
const reviewTitles = [
  'Perfect way to try multiple fragrances',
  'Best tester pack ever',
  'Great value for sampling',
  'Excellent for testing before buying',
  'Perfect gift for fragrance lovers',
  'Love the variety in this pack',
  'Amazing quality testers',
  'Worth every rupee',
  'Great way to explore new scents',
  'Highly recommend this pack',
  'Perfect sampler set',
  'Excellent variety',
  'Best tester value',
  'Love this sampling pack',
  'Great introduction to the brand',
  'Perfect for finding your favorite',
  'Fantastic tester collection',
  'Best sample pack available',
  'Love trying all three',
  'Great for discovering scents',
  'Perfect travel companion',
  'Excellent quality samples',
  'Amazing introduction pack',
  'Love the selection here',
  'Best way to sample fragrances',
  'Fantastic value package',
  'Perfect starter pack',
  'Great for collectors',
  'Love having multiple options',
  'Best tester kit',
  'Exceptional sample quality',
  'Perfect for making choices',
  'Great pack for exploration',
  'Absolutely loved testing these',
  'Perfect introduction set',
];

// Reviews for tester packs
const reviewMessages = [
  'Perfect way to try all three fragrances before committing to a full bottle. Each scent is unique and well-crafted.',
  'Loved this pack! Got to experience three amazing fragrances without breaking the bank. Definitely recommend.',
  'Great value for money. The testers are genuine and the scents are exactly as described. Very happy with this purchase.',
  'Perfect for someone who wants to explore the brand. All three fragrances have different profiles which is awesome.',
  'Best tester pack I have ever bought. The quality is exceptional and the variety is outstanding.',
  'Absolutely love this! It is the perfect way to sample before investing in full bottles. Highly recommend.',
  'Great introduction to the fragrance collection. Each tester is generous in size and quality is top-notch.',
  'Perfect gift for fragrance enthusiasts. The variety and quality make it an excellent choice.',
  'Love having three different scents to try. This pack is definitely worth the investment.',
  'Fantastic tester pack. Got to experience the quality of the brand without a big commitment. Very satisfied.',
  'Perfect for making an informed decision. Each fragrance has its own charm and character.',
  'This tester pack is amazing! The scents are diverse and high quality. Recommend to everyone.',
  'Love the variety. Each tester is well-made and the fragrance profiles are well-balanced.',
  'Great pack for exploring different scent families. Each fragrance is unique and exceptional.',
  'Perfect way to find your signature scent. All three fragrances are gorgeous.',
  'Absolutely love this collection. The testers are generous and the scents are authentic.',
  'Best tester pack for the price. Quality is premium and the variety is excellent.',
  'This pack is perfect for anyone who loves fragrances. Great introduction to quality scents.',
  'Love having multiple options to choose from. Each tester is well-crafted and long-lasting.',
  'Perfect for someone indecisive like me. All three scents are amazing in their own way.',
  'Exceptional tester pack. The fragrances are premium quality and the value is unbeatable.',
  'Great way to experience the brand. Each tester showcases different fragrance families beautifully.',
  'Love this pack! It is perfect for travel, sampling, and decision-making. Highly satisfied.',
  'Best investment for fragrance lovers. The testers are authentic and quality is fantastic.',
  'Perfect introduction set. The variety is impressive and each scent is well-executed.',
  'This tester pack is outstanding. Got exactly what I expected and more. Very happy.',
  'Love the quality and variety in this pack. Each fragrance is unique and special.',
  'Perfect for exploring before buying full bottles. All three testers are excellent quality.',
  'Absolutely amazing! The pack offers great variety and the scent quality is premium.',
  'Great tester collection. Each fragrance has its own character and charm. Highly recommend.',
  'Perfect package for fragrance exploration. The testers are generous and quality is top-notch.',
  'Love this pack so much! Each tester is amazing and the variety is perfect for exploration.',
  'Fantastic value for a tester pack. The fragrances are authentic and quality is guaranteed.',
  'Best three-scent sampler I have ever purchased. Quality and variety are both exceptional.',
  'Perfect for making comparisons and finding favorites. All three testers are outstanding.',
  'Great introduction to premium fragrances. Each tester is well-made and genuinely good.',
  'Love having three different fragrances to experience. This pack is definitely a winner.',
  'Perfect pack for any fragrance enthusiast. The variety and quality make it worth every rupee.',
  'Absolutely stellar tester pack. Loved every single fragrance in this collection.',
  'Best way to experience multiple scents. This pack is perfect for anyone wanting to explore.',
];

async function seedTesterReviews() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('sensus-perfumes');

    // Find the "Pack of 3 Fragrance Testers" product
    const product = await db.collection('products').findOne({ 
      name: { $regex: 'Pack of 3 Fragrance Testers', $options: 'i' } 
    });

    if (!product) {
      console.error('❌ Product "Pack of 3 Fragrance Testers" not found!');
      console.log('Available products:');
      const allProducts = await db.collection('products').find({}, { projection: { _id: 1, name: 1 } }).toArray();
      allProducts.forEach(p => console.log(`  - ${p.name} (ID: ${p._id})`));
      return;
    }

    console.log(`Found product: "${product.name}" (ID: ${product._id})`);

    // Delete existing reviews for this product
    const deletedResult = await db.collection('reviews').deleteMany({ 
      productId: product._id.toString() 
    });
    console.log(`Cleared ${deletedResult.deletedCount} existing reviews.`);

    // Generate 35 reviews
    const reviewCount = 35;
    const reviews = [];
    const usedNames = new Set();

    for (let i = 0; i < reviewCount; i++) {
      // Get unique name
      let name;
      let attempts = 0;
      do {
        name = pakistaniNames[Math.floor(Math.random() * pakistaniNames.length)];
        attempts++;
      } while (usedNames.has(name) && attempts < 50);
      
      usedNames.add(name);

      // Random rating (mostly 4-5 stars, some 3-4)
      const ratingWeights = [5, 5, 5, 5, 5, 5, 4, 4, 4, 4]; // 60% 5-star, 40% 4-star
      const rating = ratingWeights[Math.floor(Math.random() * ratingWeights.length)];

      // Select random title and message
      const title = reviewTitles[i % reviewTitles.length];
      const message = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];

      const review = {
        productId: product._id.toString(),
        rating,
        title,
        comment: message,
        authorName: name,
        authorEmail: `${name.toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 10000)}@gmail.com`,
        helpful: Math.floor(Math.random() * 20),
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        updated_at: new Date()
      };

      reviews.push(review);
    }

    // Insert reviews
    const result = await db.collection('reviews').insertMany(reviews);
    
    console.log(`\n✅ Successfully added ${result.insertedIds.length} reviews for "${product.name}"`);
    
    // Calculate stats
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    const fiveStarCount = reviews.filter(r => r.rating === 5).length;
    const fourStarCount = reviews.filter(r => r.rating === 4).length;
    
    console.log(`\n📊 Review Statistics:`);
    console.log(`   Average Rating: ${avgRating}/5`);
    console.log(`   5-Star Reviews: ${fiveStarCount}`);
    console.log(`   4-Star Reviews: ${fourStarCount}`);
    console.log(`   Total Reviews: ${reviews.length}`);

  } catch (error) {
    console.error('Error seeding reviews:', error);
  } finally {
    await client.close();
  }
}

seedTesterReviews().catch(console.error);
