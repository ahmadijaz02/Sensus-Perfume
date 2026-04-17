import express from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';

const router = express.Router();

// Create transporter lazily to ensure env vars are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.sensusperfume.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'no-reply@sensusperfume.com',
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

router.post('/subscribe', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const db = req.db;
  const { email } = req.body;

  try {
    const existing = await db.collection('newsletter_subscribers').findOne({ email });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already subscribed' });
    }

    await db.collection('newsletter_subscribers').insertOne({
      email,
      created_at: new Date(),
      source: 'website',
    });

    // Optional: send welcome email (ignore errors)
    try {
      await getTransporter().sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'Welcome to Sensus Perfume',
        text: 'Thank you for subscribing to Sensus Perfume. You will now receive exclusive offers and updates.',
      });
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }

    return res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
});

export default router;
