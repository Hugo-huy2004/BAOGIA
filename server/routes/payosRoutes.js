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

import InAppNotification from '../models/InAppNotification.js';

// [Admin] Request Payment from a specific user
router.post('/request-payment', requireAdmin, async (req, res) => {
  try {
    const { email, amount, reason } = req.body;
    
    if (!email || !amount || !reason) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email, số tiền và lý do.' });
    }

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
    const customLinkId = crypto.randomBytes(4).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000';
    
    const requestData = {
      orderCode,
      amount: Number(amount),
      description: reason.substring(0, 25),
      cancelUrl: `${frontendUrl}/pay/${customLinkId}?status=cancelled`,
      returnUrl: `${frontendUrl}/pay/${customLinkId}?status=success`,
    };

    let paymentData;
    try {
      paymentData = await payos.paymentRequests.create(requestData);
    } catch (payosError) {
      console.error("PayOS Error:", payosError);
      return res.status(500).json({ error: 'Lỗi khi gọi PayOS' });
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

    // Send In-App Notification to the user
    await InAppNotification.create({
      email,
      type: 'warning',
      category: 'payment',
      title: 'Yêu cầu thanh toán',
      message: `Admin đã gửi một yêu cầu thanh toán trị giá ${(Number(amount)).toLocaleString('vi-VN')} ₫. Lý do: ${reason}`,
      actionUrl: `/pay/${customLinkId}`
    });

    res.status(201).json({
      success: true,
      data: newLink,
      message: `Đã gửi yêu cầu thanh toán đến ${email}`
    });

  } catch (error) {
    console.error('Error requesting payment:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// [Public] Create a Donation Link
router.post('/donate', async (req, res) => {
  try {
    const { amount, name } = req.body;
    
    // Allowed amounts: 9.999, 19.999, 29.999, 59.999, 99.999
    const allowedAmounts = [9999, 19999, 29999, 59999, 99999];
    if (!allowedAmounts.includes(Number(amount))) {
      return res.status(400).json({ error: 'Số tiền ủng hộ không hợp lệ.' });
    }

    const donatorName = name ? name.substring(0, 15).toUpperCase() : 'GUEST';
    const reason = `DONATE ${donatorName}`.substring(0, 25);

    // Generate unique Order Code (must be integer, max 53 bit)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
    
    // Generate custom Link ID for frontend
    const customLinkId = crypto.randomBytes(4).toString('hex');
    
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000';
    
    const requestData = {
      orderCode,
      amount: Number(amount),
      description: reason,
      cancelUrl: `${frontendUrl}/pay/${customLinkId}?status=cancelled`,
      returnUrl: `${frontendUrl}/pay/${customLinkId}?status=success`,
    };

    let paymentData;
    try {
      paymentData = await payos.paymentRequests.create(requestData);
    } catch (payosError) {
      console.error("PayOS Error in /donate:", payosError);
      return res.status(500).json({ error: 'Lỗi khi kết nối đến ngân hàng. Vui lòng thử lại.' });
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
    console.error('Error creating donation link:', error);
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

// [Admin] Cancel/Delete payment link
router.post('/cancel/:customLinkId', requireAdmin, async (req, res) => {
  try {
    const link = await PaymentLink.findOne({ customLinkId: req.params.customLinkId });
    if (!link) {
      return res.status(404).json({ error: 'Không tìm thấy link thanh toán.' });
    }

    // Call PayOS cancel API only if it is currently PENDING
    if (link.status === 'PENDING') {
      try {
        // First verify status with PayOS to be sure it wasn't already paid
        const paymentInfo = await payos.paymentRequests.get(String(link.orderCode));
        if (paymentInfo.status === 'PAID') {
          link.status = 'PAID';
          await link.save();
          return res.status(400).json({ error: 'Giao dịch đã được thanh toán thành công, không thể hủy.' });
        }

        await payos.paymentRequests.cancel(link.orderCode, 'Admin hủy giao dịch');
      } catch (payosError) {
        console.error('Error calling PayOS cancel:', payosError);
        // If payment not found or already cancelled, we can continue.
      }
    }

    // Delete the payment link from MongoDB
    await PaymentLink.deleteOne({ customLinkId: req.params.customLinkId });

    res.json({
      success: true,
      message: 'Hủy và xóa giao dịch thành công.'
    });
  } catch (error) {
    console.error('Error cancelling payment link:', error);
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

// Background loop to poll PayOS API for PENDING links (created in the last 24 hours)
const autoVerifyPendingPayments = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingLinks = await PaymentLink.find({ 
      status: 'PENDING',
      createdAt: { $gte: oneDayAgo }
    });
    
    for (const link of pendingLinks) {
      try {
        const paymentInfo = await payos.paymentRequests.get(String(link.orderCode));
        if (paymentInfo.status === 'PAID') {
          link.status = 'PAID';
          await link.save();
          console.log(`[Auto-Verify] Link ${link.customLinkId} (Order ${link.orderCode}) updated to PAID`);
        } else if (paymentInfo.status === 'CANCELLED') {
          link.status = 'CANCELLED';
          await link.save();
          console.log(`[Auto-Verify] Link ${link.customLinkId} (Order ${link.orderCode}) updated to CANCELLED`);
        }
      } catch (payosErr) {
        console.error(`[Auto-Verify] Error checking order ${link.orderCode}:`, payosErr.message);
      }
    }
  } catch (err) {
    console.error('[Auto-Verify] Background job error:', err);
  }
};

// Start background task (polling every 10 seconds)
setInterval(autoVerifyPendingPayments, 10000);

export default router;
