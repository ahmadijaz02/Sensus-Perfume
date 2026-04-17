import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create transporter lazily (on first use) to ensure env vars are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.sensusperfume.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'no-reply@sensusperfume.com',
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }
  return transporter;
};

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;
      const db = req.db;

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        email,
        password: hashedPassword,
        name,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);
      
      // Generate JWT
      const token = jwt.sign(
        { 
          id: result.insertedId.toString(),
          email,
          name,
          role: 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.insertedId.toString(),
          email,
          name,
          role: 'user'
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const db = req.db;

      // Find user
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { 
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = req.db;
    const { ObjectId } = await import('mongodb');
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Forgot password - send reset code
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const db = req.db;

      const user = await db.collection('users').findOne({ email });

      // Always respond success to avoid user enumeration
      if (!user) {
        return res.json({ success: true, message: 'If this email exists, a reset code has been sent.' });
      }

      const resetCode = `${Math.floor(100000 + Math.random() * 900000)}`; // 6-digit
      const resetCodeHash = await bcrypt.hash(resetCode, 10);
      const resetCodeExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            reset_code_hash: resetCodeHash,
            reset_code_expires: resetCodeExpires,
            updated_at: new Date()
          }
        }
      );

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'Your Sensus Perfumes Password Reset Code',
        text: `Your password reset code is: ${resetCode}\n\nThis code expires in 2 minutes.`
      };

      const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Code</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:24px;">
      <div style="background:#111827;border-radius:14px;padding:20px;color:#fff;">
        <div style="font-size:16px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Sensus Perfumes</div>
        <h1 style="margin:10px 0 0;font-size:22px;">Password Reset</h1>
      </div>
      <div style="background:#fff;border-radius:14px;padding:22px;margin-top:16px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <p style="margin:0 0 10px;font-size:14px;color:#475569;">Use the code below to reset your password. This code expires in 2 minutes.</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#ea580c;background:#fff7ed;border:1px dashed #fdba74;border-radius:12px;padding:14px;text-align:center;">
          ${resetCode}
        </div>
        <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">If you didn’t request this, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;

      mailOptions.html = html;

      await getTransporter().sendMail(mailOptions);

      res.json({ success: true, message: 'If this email exists, a reset code has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to send reset code' });
    }
  }
);

// Reset password - verify token and update password
router.post('/reset-password',
  [
    body('resetToken').isLength({ min: 20 }).trim(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { resetToken, newPassword } = req.body;
      const db = req.db;

      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const user = await db.collection('users').findOne({ reset_token_hash: resetTokenHash });

      if (!user || !user.reset_token_expires) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            updated_at: new Date()
          },
          $unset: {
            reset_code_hash: '',
            reset_code_expires: '',
            reset_token_hash: '',
            reset_token_expires: ''
          }
        }
      );

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Verify reset code (returns short-lived reset token)
router.post('/verify-reset-code',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 4 }).trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;
      const db = req.db;

      const user = await db.collection('users').findOne({ email });
      if (!user || !user.reset_code_hash || !user.reset_code_expires) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      if (new Date(user.reset_code_expires) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      const isCodeValid = await bcrypt.compare(code, user.reset_code_hash);
      if (!isCodeValid) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            reset_token_hash: resetTokenHash,
            reset_token_expires: resetTokenExpires,
            updated_at: new Date()
          }
        }
      );

      res.json({ success: true, message: 'Code verified', resetToken });
    } catch (error) {
      console.error('Verify reset code error:', error);
      res.status(500).json({ error: 'Failed to verify code' });
    }
  }
);

export default router;
