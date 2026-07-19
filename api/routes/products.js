import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

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

// Get all products with pagination (public)
router.get('/', async (req, res) => {
  try {
    const db = req.db;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch from DB
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

    console.log('DEBUG First product before sending:', Object.keys(productsWithReviews[0]).join(', '));
    console.log('DEBUG First product featured value:', productsWithReviews[0].featured);

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

    res.set('Cache-Control', 'public, max-age=30, s-maxage=30, must-revalidate');
    res.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (public) — supports both slug and ID lookups
router.get('/:identifier', async (req, res) => {
  try {
    const db = req.db;
    const identifier = req.params.identifier;

    // Check if identifier is a valid ObjectId or a slug
    const isObjectId = ObjectId.isValid(identifier) && identifier.length === 24;
    const isAdmin = req.headers.authorization ? true : false;

    // Build query based on identifier type
    const query = isObjectId
      ? { _id: new ObjectId(identifier) }
      : { slug: identifier };

    const product = await db.collection('products').findOne(query);

    if (!product) {
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

    const productWithReviews = { ...product, totalReviews, averageRating };

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

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const objectId = new ObjectId(productId);

    const existingProduct = await db.collection('products').findOne({ _id: objectId });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

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

    // MongoDB 6.x returns the document directly or as result.value
    const updatedProduct = result?.value || result;

    if (!updatedProduct || (typeof updatedProduct === 'object' && !updatedProduct._id)) {
      // Fallback: fetch the product directly
      const verifyProduct = await db.collection('products').findOne({ _id: objectId });
      if (verifyProduct) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.json(verifyProduct);
      }
      return res.status(500).json({ error: 'Update failed' });
    }

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
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

    if (!rating || !title || !comment || !authorName || !authorEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment.length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' });
    }

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
