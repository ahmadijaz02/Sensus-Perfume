import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get users count (admin only)
router.get('/count', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const count = await db.collection('users').countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Failed to count users' });
  }
});

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const users = await db.collection('users')
      .find()
      .project({ password: 0 }) // Exclude password field
      .toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const { password, _id, ...updateData } = req.body;
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      },
      { 
        returnDocument: 'after',
        projection: { password: 0 }
      }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const result = await db.collection('users').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
