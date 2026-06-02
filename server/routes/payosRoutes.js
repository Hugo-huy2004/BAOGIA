import express from 'express';
import pkg from '@payos/node';
const PayOS = pkg.PayOS || pkg;

import crypto from 'crypto';
import PaymentLink from '../models/PaymentLink.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'dummy-client-id',
  apiKey: process.env.PAYOS_API_KEY || 'dummy-api-key',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy-checksum-key'
});

// [Admin] Create a new Payment Link
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || !reason) {
      return res.status(400).json({ error: 'Vui lòng cung cấp số tiền và lý do.' });
    }

    // Generate unique Order Code (must be integer, max 53 bit)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
    
    // Generate custom Link ID for frontend
    const customLinkId = crypto.randomBytes(4).toString('hex');
    
    // The domain where the frontend is hosted
    // Should be from process.env or fallback
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000';
    
    const requestData = {
      orderCode,
      amount: Number(amount),
      description: reason.substring(0, 25), // PayOS max 25 chars
      cancelUrl: `${frontendUrl}/pay/${customLinkId}?status=cancelled`,
      returnUrl: `${frontendUrl}/pay/${customLinkId}?status=success`,
    };

    let paymentData;
    try {
      paymentData = await payos.paymentRequests.create(requestData);
    } catch (payosError) {
      console.error("PayOS Error:", payosError);
      return res.status(500).json({ error: 'Lỗi khi gọi PayOS: ' + (payosError.message || 'Unknown') });
    }

    const newLink = new PaymentLink({
      customLinkId,
      orderCode,
      amount: Number(amount),
      reason,
      checkoutUrl: paymentData.checkoutUrl,
      status: 'PENDING',
      bin: paymentData.bin,
      accountNumber: paymentData.accountNumber,
      accountName: paymentData.accountName,
      qrCode: paymentData.qrCode
    });

    await newLink.save();

    res.status(201).json({
      success: true,
      data: newLink
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// [Admin] Get all payment links
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const links = await PaymentLink.find().sort({ createdAt: -1 });
    res.json({ success: true, data: links });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// [Public] Get payment link info
router.get('/info/:customLinkId', async (req, res) => {
  try {
    const link = await PaymentLink.findOne({ customLinkId: req.params.customLinkId });
    if (!link) {
      return res.status(404).json({ error: 'Không tìm thấy link thanh toán.' });
    }

    // Optionally check if it's already paid and update status from PayOS
    try {
      if (link.status === 'PENDING') {
        const paymentInfo = await payos.paymentRequests.get(String(link.orderCode));
        if (paymentInfo.status === 'PAID') {
          link.status = 'PAID';
          await link.save();
        } else if (paymentInfo.status === 'CANCELLED') {
          link.status = 'CANCELLED';
          await link.save();
        }
      }
    } catch (e) {
      console.error('Failed to update status from PayOS silently', e);
    }

    res.json({
      success: true,
      data: {
        customLinkId: link.customLinkId,
        amount: link.amount,
        reason: link.reason,
        status: link.status,
        checkoutUrl: link.checkoutUrl,
        createdAt: link.createdAt,
        bin: link.bin,
        accountNumber: link.accountNumber,
        accountName: link.accountName,
        qrCode: link.qrCode
      }
    });

  } catch (error) {
    console.error('Error fetching link info:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// [Webhook] Receive status updates from PayOS
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature (Requires body to be parsed properly)
    const webhookData = payos.webhooks.verify(req.body);

    if (webhookData && webhookData.code === '00') {
      const { orderCode, success } = webhookData.data;
      if (success) {
        await PaymentLink.findOneAndUpdate(
          { orderCode: Number(orderCode) },
          { status: 'PAID' }
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook data' });
  }
});

export default router;
