import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Log route registration
console.log('Orders router initialized');

// Debug log environment variables
console.log('SMTP Configuration:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER || 'MISSING',
  pass: process.env.SMTP_PASS ? 'SET' : 'MISSING',
  from: process.env.FROM_EMAIL
});

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

    // Verify once on creation
    try {
      transporter.verify(function(error, success) {
        if (error) {
          console.error('⚠️  SMTP Connection Error (non-blocking):', error.message);
        } else {
          console.log('✅ SMTP Server is ready');
        }
      });
    } catch (err) {
      console.error('⚠️  SMTP verification failed:', err.message);
    }
  }
  return transporter;
};

// Create order (authenticated or guest, Cash on Delivery)
router.post('/',
  [
    body('customer_email').isEmail().normalizeEmail(),
    body('customer_name').trim().notEmpty(),
    body('shipping_address').trim().notEmpty(),
    body('total_amount').isNumeric(),
    body('items').isArray({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customer_email, customer_name, shipping_address, total_amount, items } = req.body;
      const db = req.db;

      // Get user_id from token if authenticated
      let user_id = null;
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          user_id = decoded.id;
        } catch (error) {
          // Guest checkout - continue without user_id
        }
      }

      const newOrder = {
        user_id,
        customer_email,
        customer_name,
        shipping_address,
        total_amount: parseFloat(total_amount),
        status: 'pending',
        tracking_number: null,
        notes: null,
        items,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('orders').insertOne(newOrder);
      const createdOrder = {
        id: result.insertedId.toString(),
        ...newOrder
      };

      // Send confirmation email (Cash on Delivery)
      try {
        const formatPKR = (value) =>
          new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(value);

        const getDiscountedUnit = (item) => {
          const base = Number(item.price || 0);
          const globalDiscount = Number(item.globalDiscount || 0);
          const productDiscount = Number(item.productDiscount || 0);

          let discounted = base;
          let discountLabel = '';

          if (globalDiscount > 0) {
            discounted = base * (1 - globalDiscount / 100);
            discountLabel = `Global ${globalDiscount}%`;
          } else if (productDiscount > 0) {
            discounted = base * (1 - productDiscount / 100);
            discountLabel = `Product ${productDiscount}%`;
          }

          return {
            discountedUnit: Math.round(discounted),
            discountLabel
          };
        };

        const itemsWithPrices = items.map((item) => {
          const { discountedUnit, discountLabel } = getDiscountedUnit(item);
          const originalTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const discountedTotal = discountedUnit * Number(item.quantity || 0);

          return {
            ...item,
            discountedUnit,
            originalTotal,
            discountedTotal,
            discountLabel
          };
        });

        const originalSubtotal = itemsWithPrices.reduce((sum, item) => sum + item.originalTotal, 0);
        const discountedSubtotal = itemsWithPrices.reduce((sum, item) => sum + item.discountedTotal, 0);
        const adjustments = Math.round((createdOrder.total_amount - discountedSubtotal) * 100) / 100;

        const itemsSummaryText = itemsWithPrices
          .map((item) => {
            const baseLine = `${item.product_name} x ${item.quantity}`;
            const priceLine = `  Price: ${formatPKR(item.price)} → ${formatPKR(item.discountedUnit)}`;
            const totalLine = `  Line total: ${formatPKR(item.discountedTotal)}`;
            const discountLine = item.discountLabel ? `  Discount: ${item.discountLabel}` : '';
            return [baseLine, priceLine, totalLine, discountLine].filter(Boolean).join('\n');
          })
          .join('\n\n');

        const itemsRowsHtml = itemsWithPrices
          .map((item) => {
            const showDiscount = item.discountLabel && item.discountedUnit !== item.price;
            return `
              <tr>
                <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                  <div style="font-weight:600;color:#0f172a;">${item.product_name}</div>
                  <div style="font-size:12px;color:#64748b;">Qty: ${item.quantity}</div>
                  ${showDiscount ? `<div style=\"font-size:12px;color:#16a34a;\">${item.discountLabel}</div>` : ''}
                </td>
                <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;">
                  ${showDiscount ? `<div style=\"font-size:12px;color:#94a3b8;text-decoration:line-through;\">${formatPKR(item.price)}</div>` : ''}
                  <div style="font-weight:600;color:#0f172a;">${formatPKR(item.discountedUnit)}</div>
                </td>
                <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;font-weight:600;color:#0f172a;">
                  ${formatPKR(item.discountedTotal)}
                </td>
              </tr>
            `;
          })
          .join('');

        console.log('Attempting to send email to:', customer_email);
        
        const mailOptions = {
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: customer_email,
          subject: 'Your Sensus Perfumes Order Confirmation (Cash on Delivery)',
          text: `Dear ${customer_name},

Thank you for your order with Sensus Perfumes.

Order ID: ${createdOrder.id}
Payment Method: Cash on Delivery
Total Amount: ${formatPKR(createdOrder.total_amount)}

Delivery Address:
${shipping_address}

Order Items:
${itemsSummaryText}

Subtotal (before discounts): ${formatPKR(originalSubtotal)}
Subtotal (after discounts): ${formatPKR(discountedSubtotal)}
${adjustments !== 0 ? `Adjustments (delivery/discounts): ${formatPKR(adjustments)}` : ''}

You will pay in cash when your order is delivered to the address above.

Best regards,
Sensus Perfumes
`
        };

        const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#111827;border-radius:14px;padding:16px 18px;color:#fff;">
        <div style="font-size:14px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;">Sensus Perfumes</div>
        <h1 style="margin:6px 0 0;font-size:20px;">Order Confirmation</h1>
        <p style="margin:4px 0 0;font-size:12px;opacity:0.85;">Cash on Delivery</p>
      </div>

      <div style="background:#fff;border-radius:16px;padding:24px;margin-top:18px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <p style="margin:0 0 10px;font-size:16px;">Hi ${customer_name},</p>
        <p style="margin:0 0 18px;font-size:14px;color:#475569;">Thanks for your purchase! Here’s a summary of your order.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:18px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Order ID</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;word-break:break-all;">${createdOrder.id}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Total</td>
              <td style="padding:6px 0;text-align:right;font-weight:700;color:#ea580c;font-size:18px;">${formatPKR(createdOrder.total_amount)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Payment</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;">Cash on Delivery</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom:18px;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Delivery Address</div>
          <div style="font-size:14px;color:#0f172a;line-height:1.5;">${shipping_address}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
          <thead>
            <tr>
              <th align="left" style="padding:10px 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Item</th>
              <th align="right" style="padding:10px 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Unit Price</th>
              <th align="right" style="padding:10px 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#475569;">Subtotal (before discounts)</td>
              <td style="padding:6px 0;font-size:13px;color:#475569;text-align:right;">${formatPKR(originalSubtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#16a34a;">Subtotal (after discounts)</td>
              <td style="padding:6px 0;font-size:13px;color:#16a34a;text-align:right;">${formatPKR(discountedSubtotal)}</td>
            </tr>
            ${adjustments !== 0 ? `
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#0f172a;">Adjustments (delivery/discounts)</td>
              <td style="padding:6px 0;font-size:13px;color:#0f172a;text-align:right;">${formatPKR(adjustments)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:10px 0 0;font-size:16px;font-weight:700;border-top:1px solid #e2e8f0;">Total</td>
              <td style="padding:10px 0 0;font-size:16px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;color:#ea580c;">${formatPKR(createdOrder.total_amount)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
        You will pay in cash when your order is delivered.
      </div>
    </div>
  </body>
</html>`;

        mailOptions.html = html;

        // Send customer confirmation email (without BCC)
        await getTransporter().sendMail(mailOptions);
        console.log('Customer confirmation email sent successfully');

        // Send separate admin notification email
        const adminEmail = process.env.ORDER_NOTIFY_EMAIL || 'sensusperfume@gmail.com';
        const adminSubject = `New order placed by ${createdOrder.customer_name}`;
        
        const adminText = `
NEW ORDER RECEIVED

Order ID: ${createdOrder.id}
Order Date: ${new Date(createdOrder.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
Total Amount: ${formatPKR(createdOrder.total_amount)}
Payment Method: Cash on Delivery

CUSTOMER INFORMATION:
Name: ${createdOrder.customer_name}
Email: ${createdOrder.customer_email}

DELIVERY ADDRESS:
${createdOrder.shipping_address}

ORDER ITEMS:
${createdOrder.items.map((item, index) => {
  const discountPct = item.productDiscount || item.globalDiscount || 0;
  return `
${index + 1}. ${item.product_name}${item.variant ? ` (${item.variant})` : ''}
   Quantity: ${item.quantity}
   Price: ${formatPKR(item.price)}
   Subtotal: ${formatPKR(item.price * item.quantity)}${discountPct > 0 ? ` (${discountPct}% discount applied)` : ''}`;
}).join('\n')}

---
Please process this order promptly.
`;

        const adminHtml = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
      .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
      .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
      .label { font-weight: 600; color: #64748b; }
      .value { color: #0f172a; }
      .items-table { width: 100%; background: white; border-radius: 8px; overflow: hidden; margin: 20px 0; }
      .items-table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; color: #475569; }
      .items-table td { padding: 12px; border-top: 1px solid #e2e8f0; }
      .total { font-size: 20px; font-weight: 700; color: #ea580c; margin-top: 20px; text-align: right; }
      .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin:0;font-size:28px;">🛍️ New Order Received</h1>
        <p style="margin:10px 0 0;opacity:0.9;">Order #${createdOrder.id}</p>
      </div>
      
      <div class="content">
        <div class="alert">
          <strong>Action Required:</strong> A new order has been placed and requires processing.
        </div>

        <div class="order-info">
          <h2 style="margin-top:0;color:#ea580c;">Order Details</h2>
          <div class="info-row">
            <span class="label">Order ID:</span>
            <span class="value"><strong>${createdOrder.id}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Order Date:</span>
            <span class="value">${new Date(createdOrder.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value"><strong>Cash on Delivery</strong></span>
          </div>
        </div>

        <div class="order-info">
          <h2 style="margin-top:0;color:#ea580c;">Customer Information</h2>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${createdOrder.customer_name}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${createdOrder.customer_email}</span>
          </div>
        </div>

        <div class="order-info">
          <h2 style="margin-top:0;color:#ea580c;">Delivery Address</h2>
          <p style="margin:0;line-height:1.8;white-space:pre-wrap;">
            ${createdOrder.shipping_address}
          </p>
        </div>

        <div class="order-info">
          <h2 style="margin-top:0;color:#ea580c;">Order Items</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${createdOrder.items.map(item => {
                const discountPct = item.productDiscount || item.globalDiscount || 0;
                return `
                <tr>
                  <td>
                    <strong>${item.product_name}</strong>${item.variant ? `<br><span style="color:#64748b;font-size:14px;">${item.variant}</span>` : ''}
                    ${discountPct > 0 ? `<br><span style="color:#10b981;font-size:12px;">✓ ${discountPct}% discount applied</span>` : ''}
                  </td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">${formatPKR(item.price)}</td>
                  <td style="text-align:right;font-weight:600;">${formatPKR(item.price * item.quantity)}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          <div class="total">
            Total Amount: ${formatPKR(createdOrder.total_amount)}
          </div>
        </div>

        <div style="text-align:center;margin-top:30px;padding:20px;background:white;border-radius:8px;">
          <p style="margin:0;color:#64748b;">Please log in to the admin panel to process this order.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

        await getTransporter().sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: adminEmail,
          subject: adminSubject,
          text: adminText,
          html: adminHtml
        });
        console.log('Admin notification email sent successfully');
        
      } catch (emailError) {
        console.error('Order created, but failed to send confirmation email:', emailError);
      }

      res.status(201).json(createdOrder);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// Get all orders (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const orders = await db.collection('orders')
      .find()
      .sort({ created_at: -1 })
      .toArray();

    res.json(orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    })));
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Test email endpoint (BEFORE /:id routes)
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = 'razaomer00@gmail.com'; // Replace with your test email
    
    console.log('Sending test email to:', testEmail);
    
    await getTransporter().sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Test Email from Sensus Perfumes',
      text: 'This is a test email to verify SMTP configuration.'
    });
    
    console.log('Test email sent successfully');
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Failed to send test email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// Get user's orders (authenticated) (BEFORE /:id routes)
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const db = req.db;
    const orders = await db.collection('orders')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();

    res.json(orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    })));
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.db;
    
    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...order,
      id: order._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const { status } = req.body;
    const db = req.db;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.collection('orders').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          status,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...result,
      id: result._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order tracking (admin only)
router.patch('/:id/tracking', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const { tracking_number, notes } = req.body;
    const db = req.db;

    const updateFields = { updated_at: new Date() };
    if (tracking_number !== undefined) updateFields.tracking_number = tracking_number;
    if (notes !== undefined) updateFields.notes = notes;

    const result = await db.collection('orders').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...result,
      id: result._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

// Delete order (admin only)
router.delete('/:id', (req, res, next) => {
  console.log('=== DELETE REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Order ID:', req.params.id);
  console.log('Headers:', req.headers);
  next();
}, authenticate, requireAdmin, async (req, res) => {
  try {
    const db = req.db;
    const orderId = req.params.id;

    console.log('Attempting to delete order with ID:', orderId);

    // Verify it's a valid MongoDB ObjectId
    if (!ObjectId.isValid(orderId)) {
      console.error('Invalid ObjectId format:', orderId);
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const result = await db.collection('orders').deleteOne(
      { _id: new ObjectId(orderId) }
    );

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

export default router;
