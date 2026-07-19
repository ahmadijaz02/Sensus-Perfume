import express from 'express';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Handle both 'id' (from auth.js) and 'userId' (legacy format)
    req.userId = decoded.id || decoded.userId;
    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Get user's cart - OPTIMIZED with batch queries
router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await req.db.collection('carts').findOne({
      userId: new ObjectId(req.userId)
    });

    if (!cart || !cart.items.length) {
      return res.json({
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    // Convert all productIds to ObjectId for batch query
    const productIds = cart.items.map(item => {
      const id = item.productId;
      if (typeof id === 'string') {
        try {
          return new ObjectId(id);
        } catch (e) {
          return null;
        }
      }
      return id;
    }).filter(id => id !== null);

    // BATCH QUERY: Fetch all products at once instead of N queries
    console.log(`⚡ Fetching ${productIds.length} products with batch query`);
    const products = await req.db.collection('products')
      .find({ _id: { $in: productIds } })
      .project({
        _id: 1,
        name: 1,
        brand: 1,
        image: 1,
        images: 1,
        concentration: 1,
        category: 1,
        variants: 1,
        discountPercent: 1
      })
      .toArray();

    // Create a map for fast lookup
    const productMap = new Map();
    products.forEach(p => {
      productMap.set(p._id.toString(), p);
    });

    // Build cart items with product details
    const itemsWithDetails = cart.items.map(item => {
      let productId = item.productId;
      if (typeof productId === 'string') {
        try {
          productId = new ObjectId(productId);
        } catch (e) {
          return null;
        }
      }

      const product = productMap.get(productId.toString());
      if (!product) {
        console.error('Product not found in cart:', item.productId);
        return null;
      }

      const variant = product.variants.find(v => v.size === item.size);
      if (!variant) {
        console.error('Variant not found:', { productId: item.productId, size: item.size });
        return null;
      }

      return {
        product: {
          _id: product._id.toString(),
          id: product._id.toString(),
          name: product.name,
          images: product.images || [],
          image: product.image || product.images?.[0],
          concentration: product.concentration,
          category: product.category,
          brand: product.brand,
          discountPercent: product.discountPercent || 0
        },
        variant: {
          size: variant.size,
          price: variant.price,
          originalPrice: variant.originalPrice
        },
        quantity: item.quantity
      };
    }).filter(item => item !== null);

    const totalItems = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = itemsWithDetails.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );

    res.json({
      items: itemsWithDetails,
      totalItems,
      totalPrice
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to cart - ULTRA-OPTIMIZED for speed
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    console.log('⚡ Cart Add (Fast Mode):', { productId, size, quantity });

    if (!productId || !size || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { productId, size, quantity }
      });
    }

    const userId = new ObjectId(req.userId);

    // Convert productId to ObjectId
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // FAST PATH: Skip product verification for speed (will be caught later if invalid)
    // Instead, do a quick upsert directly
    const productIdStr = productId.toString();
    
    const result = await req.db.collection('carts').findOneAndUpdate(
      { userId },
      [
        {
          $set: {
            items: {
              $cond: {
                if: {
                  $in: [
                    true,
                    {
                      $map: {
                        input: { $ifNull: ['$items', []] },
                        as: 'item',
                        in: {
                          $and: [
                            { $eq: [{ $toString: '$$item.productId' }, productIdStr] },
                            { $eq: ['$$item.size', size] }
                          ]
                        }
                      }
                    }
                  ]
                },
                then: {
                  $map: {
                    input: { $ifNull: ['$items', []] },
                    as: 'item',
                    in: {
                      $cond: {
                        if: {
                          $and: [
                            { $eq: [{ $toString: '$$item.productId' }, productIdStr] },
                            { $eq: ['$$item.size', size] }
                          ]
                        },
                        then: {
                          $mergeObjects: [
                            '$$item',
                            { quantity: { $add: ['$$item.quantity', quantity] } }
                          ]
                        },
                        else: '$$item'
                      }
                    }
                  }
                },
                else: {
                  $concatArrays: [
                    { $ifNull: ['$items', []] },
                    [{ productId: productObjectId, size, quantity }]
                  ]
                }
              }
            },
            updatedAt: new Date()
          }
        }
      ],
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );

    const cart = result.value || result;
    const totalItems = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

    console.log('⚡ Cart updated instantly:', { totalItems, itemCount: cart.items?.length });

    // Return minimal response for speed
    res.json({ 
      success: true,
      cartItemCount: totalItems,
      items: [] // Client will refresh to get full details
    });

  } catch (error) {
    console.error('⚠️ Cart add error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Remove from cart
router.post('/remove', verifyToken, async (req, res) => {
  try {
    const { productId, size } = req.body;
    const userId = new ObjectId(req.userId);

    // Convert productId to ObjectId if it's a valid MongoDB ID
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (e) {
      productObjectId = productId; // Fall back to string comparison
    }

    const result = await req.db.collection('carts').updateOne(
      { userId },
      {
        $pull: {
          items: {
            $or: [
              { productId: productObjectId, size },
              { productId: productId.toString(), size }
            ]
          }
        },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    console.log('✓ Item removed from cart:', { productId, size, deletedCount: result.deletedCount });
    res.json({ 
      success: true,
      message: 'Item removed from cart',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Update quantity
router.post('/update', verifyToken, async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    const userId = new ObjectId(req.userId);

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      let productObjectId;
      try {
        productObjectId = new ObjectId(productId);
      } catch (e) {
        productObjectId = productId;
      }

      const result = await req.db.collection('carts').updateOne(
        { userId },
        {
          $pull: {
            items: {
              $or: [
                { productId: productObjectId, size },
                { productId: productId.toString(), size }
              ]
            }
          },
          $set: { updatedAt: new Date() }
        }
      );
      console.log('✓ Item removed (quantity ≤ 0):', { productId, size });
      return res.json({ 
        success: true,
        message: 'Item removed from cart' 
      });
    }

    // Convert productId to ObjectId if it's a valid MongoDB ID
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (e) {
      productObjectId = productId;
    }

    const result = await req.db.collection('carts').updateOne(
      { userId },
      {
        $set: {
          'items.$[item].quantity': quantity,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [
          {
            $or: [
              { 'item.productId': productObjectId },
              { 'item.productId': productId.toString() },
              { 'item.productId': { $eq: productId } }
            ],
            'item.size': size
          }
        ]
      }
    );

    if (result.matchedCount === 0) {
      console.error('Cart item not found:', { userId, productId, size });
      return res.status(404).json({ 
        error: 'Cart item not found',
        tried: { productId, productObjectId: productObjectId?.toString(), size }
      });
    }

    console.log('✓ Quantity updated:', { productId, size, quantity, modifiedCount: result.modifiedCount });
    res.json({ 
      success: true,
      message: 'Quantity updated',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// Clear cart
router.post('/clear', verifyToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.userId);

    await req.db.collection('carts').updateOne(
      { userId },
      {
        $set: {
          items: [],
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
