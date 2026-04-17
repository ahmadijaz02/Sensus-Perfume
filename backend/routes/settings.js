import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const defaultSettings = {
  key: 'store',
  globalDiscountPercent: 0,
  promoCode: '',
  promoDiscountPercent: 0,
  promoDiscountMaxAmount: 0,
  deliveryCost: 0,
  freeDeliveryEnabled: false,
  freeDeliveryMinAmount: 0,
  updated_at: new Date()
};

// Get public store settings
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const existing = await db.collection('settings').findOne({ key: 'store' });

    if (!existing) {
      await db.collection('settings').insertOne(defaultSettings);
      return res.json(defaultSettings);
    }

    return res.json(existing);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update store settings (admin only)
router.put(
  '/',
  authenticate,
  requireAdmin,
  [
    body('globalDiscountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('promoCode').optional().trim().isLength({ max: 32 }),
    body('promoDiscountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('promoDiscountMaxAmount').optional().isFloat({ min: 0 }),
    body('deliveryCost').optional().isFloat({ min: 0 }),
    body('freeDeliveryEnabled').optional().toBoolean(),
    body('freeDeliveryMinAmount').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.db;
      const update = {
        key: 'store',
        globalDiscountPercent: Number(req.body.globalDiscountPercent ?? 0),
        promoCode: (req.body.promoCode ?? '').trim(),
        promoDiscountPercent: Number(req.body.promoDiscountPercent ?? 0),
        promoDiscountMaxAmount: Number(req.body.promoDiscountMaxAmount ?? 0),
        deliveryCost: Number(req.body.deliveryCost ?? 0),
        freeDeliveryEnabled: Boolean(req.body.freeDeliveryEnabled === true || req.body.freeDeliveryEnabled === 'true'),
        freeDeliveryMinAmount: Number(req.body.freeDeliveryMinAmount ?? 0),
        updated_at: new Date()
      };

      console.log('Updating settings:', update);

      await db.collection('settings').updateOne(
        { key: 'store' },
        { $set: update },
        { upsert: true }
      );

      console.log('Settings updated successfully');
      return res.json(update);
    } catch (error) {
      console.error('Failed to update settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

export default router;
