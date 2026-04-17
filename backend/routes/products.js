import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Ensure critical indexes exist for fast queries
let indexesEnsured = false;
const ensureIndexes = async (db) => {
  if (indexesEnsured) return;
  try {
    // Index for review queries - CRITICAL for product detail page performance
    await db.collection('reviews').createIndex({ productId: 1 }, { background: true });
    await db.collection('reviews').createIndex({ productId: 1, created_at: -1 }, { background: true });
    
    // Index for category filtering
    await db.collection('products').createIndex({ category: 1 }, { background: true });
    
    // Index for product sorting by creation date (newest first)
    await db.collection('products').createIndex({ created_at: -1 }, { background: true });
    
    console.log('✅ Database indexes ensured');
    indexesEnsured = true;
  } catch (error) {
    console.error('Index creation error:', error.message);
  }
};

// Get products count (public)
router.get('/count', async (req, res) => {
  try {
    const db = req.db;
    const count = await db.collection('products').countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting products:', error);
    res.status(500).json({ error: 'Failed to count products' });
  }
});

// Get all products with caching and pagination (public)
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    
    // Ensure indexes exist on first request
    await ensureIndexes(db);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const cacheKey = `products:page:${page}:limit:${limit}`;

    // Try cache first for first page
    if (page === 1) {
      const cached = req.getCachedProducts(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=30, s-maxage=30, must-revalidate');
        return res.json(cached);
      }
    }

    // Fetch from DB - return ALL fields for complete data
    // Performance optimized with:
    // 1. Pagination (limit results per request)
    // 2. In-memory caching (5 min TTL for first page)
    // 3. Database indexes (fast queries)
    // This is MORE efficient than projection + multiple requests
    const products = await db.collection('products')
      .find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Aggregate review counts and ratings for each product
    const productIds = products.map(p => p._id.toString());
    const reviews = await db.collection('reviews')
      .find({ productId: { $in: productIds } })
      .toArray();

    // Calculate review stats for each product
    const reviewStats = {};
    reviews.forEach(review => {
      if (!reviewStats[review.productId]) {
        reviewStats[review.productId] = { total: 0, sumRating: 0 };
      }
      reviewStats[review.productId].total++;
      reviewStats[review.productId].sumRating += review.rating;
    });

    // Add review stats to products
    const productsWithReviews = products.map(product => {
      const productId = product._id.toString();
      const stats = reviewStats[productId] || { total: 0, sumRating: 0 };
      return {
        ...product,
        totalReviews: stats.total,
        averageRating: stats.total > 0 ? Math.round((stats.sumRating / stats.total) * 10) / 10 : 0
      };
    });

    const total = await db.collection('products').countDocuments();

    const response = {
      data: productsWithReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Log complete field information
    console.log('📊 Products Response Summary:', {
      page,
      itemsReturned: productsWithReviews.length,
      totalProducts: total,
      cacheStatus: page === 1 ? 'Will be cached' : 'Not cached',
      sampleProductFields: productsWithReviews.length > 0 ? Object.keys(productsWithReviews[0]) : 'No products',
      reviewsProcessed: reviews.length
    });

    // Cache only first page
    if (page === 1) {
      req.setCachedProducts(cacheKey, response);
      if (limit >= 1000) {
        req.setCachedProducts('products:all', response);
      }
    }
    res.set('Cache-Control', 'public, max-age=30, s-maxage=30, must-revalidate');
    res.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (public) - with caching
// Supports both slug and ID lookups
router.get('/:identifier', async (req, res) => {
  try {
    const db = req.db;
    const identifier = req.params.identifier;
    
    // Check if identifier is a valid ObjectId or a slug
    const isObjectId = ObjectId.isValid(identifier) && identifier.length === 24;
    
    // Don't use cache for admin requests - they need full data
    // Cache is only useful for public product detail pages
    const isAdmin = req.headers.authorization ? true : false;
    
    if (!isAdmin) {
      // Get from cache first (basic check) for public requests
      const cached = req.getCachedProducts('products:all');
      if (cached?.data) {
        const cachedProduct = cached.data.find(p => {
          if (isObjectId) {
            return p._id?.toString() === identifier || p.id?.toString() === identifier;
          } else {
            return p.slug === identifier;
          }
        });
        if (cachedProduct) {
          console.log('📦 Product found in cache');
          res.set('Cache-Control', 'public, max-age=30, s-maxage=30, must-revalidate');
          return res.json(cachedProduct);
        }
      }
    }

    // Build query based on identifier type
    const query = isObjectId 
      ? { _id: new ObjectId(identifier) }
      : { slug: identifier };

    // Fetch from DB with all fields for detail view or admin edit
    console.log('Fetching full product details for:', identifier, isObjectId ? '(ID)' : '(slug)');
    const product = await db.collection('products').findOne(query);
    
    if (!product) {
      console.error('Product not found:', req.params.id);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Aggregate review stats for this product
    const productId = product._id.toString();
    const reviews = await db.collection('reviews')
      .find({ productId })
      .toArray();

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10 
      : 0;

    const productWithReviews = {
      ...product,
      totalReviews,
      averageRating
    };
    
    console.log('Product found:', { 
      name: product.name, 
      hasDescription: !!product.description, 
      hasVariants: !!product.variants,
      totalReviews,
      averageRating
    });
    if (!isAdmin) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    }
    res.json(productWithReviews);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const product = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('products').insertOne(product);
    
    // Invalidate cache so new product shows immediately
    req.invalidateProductsCache();
    
    // Tell browsers/CDN to revalidate
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.status(201).json({ 
      ...product, 
      _id: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const productId = req.params.id;
    const { _id, ...updateData } = req.body;
    
    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      console.error('Invalid ObjectId:', productId);
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    console.log('=== UPDATE PRODUCT ===');
    console.log('Product ID:', productId);
    console.log('User ID:', req.user?.id);
    console.log('Update fields:', Object.keys(updateData));
    
    const objectId = new ObjectId(productId);
    console.log('Converted ObjectId:', objectId.toString());

    // Find existing product first
    const existingProduct = await db.collection('products').findOne({
      _id: objectId
    });

    if (!existingProduct) {
      console.error('Product not found for update:', productId);
      console.log('Querying all products to debug:');
      const allProducts = await db.collection('products').find().limit(3).toArray();
      console.log('Sample products IDs:', allProducts.map(p => p._id.toString()));
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Found existing product:', { name: existingProduct.name, id: existingProduct._id.toString() });

    // Update with explicit options - MongoDB 6.3.0 compatible
    const result = await db.collection('products').findOneAndUpdate(
      { _id: objectId },
      { 
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    console.log('findOneAndUpdate result:', {
      type: typeof result,
      isNull: result === null,
      isUndefined: result === undefined,
      keys: result ? Object.keys(result) : 'N/A',
      hasOk: result?.ok,
      hasValue: result?.value !== undefined,
      valueType: typeof result?.value
    });
    
    // MongoDB 6.3.0 returns the document directly or as result.value
    const updatedProduct = result?.value || result;
    
    if (!updatedProduct || (typeof updatedProduct === 'object' && !updatedProduct._id)) {
      console.error('Update returned invalid result:', { result, productId });
      // Fallback: fetch the product directly
      const verifyProduct = await db.collection('products').findOne({ _id: objectId });
      if (verifyProduct) {
        console.log('✅ Fallback successful - product updated');
        return res.json(verifyProduct);
      }
      return res.status(500).json({ error: 'Update failed' });
    }

    console.log('✅ Product updated successfully:', { 
      name: updatedProduct.name,
      id: updatedProduct._id.toString()
    });

    // Invalidate cache so updated product shows immediately on frontend
    req.invalidateProductsCache();

    // Tell browsers/CDN to revalidate - critical for live updates
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const result = await db.collection('products').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Invalidate cache so deleted product is removed immediately from frontend
    req.invalidateProductsCache();
    
    // Tell browsers/CDN to revalidate
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get product reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const db = req.db;
    
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Fetch all reviews for the product (sorted by most recent)
    const reviews = await db.collection('reviews')
      .find({ productId: req.params.id })
      .project({
        _id: 1,
        rating: 1,
        title: 1,
        comment: 1,
        authorName: 1,
        helpful: 1,
        created_at: 1
      })
      .sort({ created_at: -1 })
      .toArray();

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create review
router.post('/:id/reviews', async (req, res) => {
  try {
    const db = req.db;
    
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const { rating, title, comment, authorName, authorEmail } = req.body;

    // Validation
    if (!rating || !title || !comment || !authorName || !authorEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment.length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' });
    }

    // Check if product exists
    const product = await db.collection('products').findOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const review = {
      productId: req.params.id,
      rating: parseInt(rating),
      title,
      comment,
      authorName,
      authorEmail,
      helpful: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('reviews').insertOne(review);
    
    res.status(201).json({ 
      ...review, 
      _id: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review', message: error.message });
  }
});

// Delete review
router.delete('/:id/reviews/:reviewId', authenticate, async (req, res) => {
  try {
    const db = req.db;
    
    if (!ObjectId.isValid(req.params.reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const result = await db.collection('reviews').deleteOne({ 
      _id: new ObjectId(req.params.reviewId),
      productId: req.params.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful
router.patch('/:id/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const db = req.db;
    
    if (!ObjectId.isValid(req.params.reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const result = await db.collection('reviews').findOneAndUpdate(
      { 
        _id: new ObjectId(req.params.reviewId),
        productId: req.params.id
      },
      { 
        $inc: { helpful: 1 },
        $set: { updated_at: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

export default router;
