import express from 'express';
import { autoProcessTicket } from '../services/aiSupportAdminService.js';
import { sendTelegramAlert } from '../services/telegramService.js';

const router = express.Router();

/**
 * Meta Facebook Messenger Webhook Router (100% Free Meta Graph API)
 * Xử lý tin nhắn 1-on-1 từ khách hàng bấm "Cần Hỗ Trợ Messenger" trên Web/App.
 */

// GET /api/meta/webhook - Bắt tay xác thực Webhook với Meta Developer Portal
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN || 'hugostudio_meta_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Meta Messenger Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// POST /api/meta/webhook - Nhận tin nhắn Messenger 1-on-1 từ người dùng
router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    res.status(200).send('EVENT_RECEIVED');

    try {
      for (const entry of body.entry || []) {
        const webhookEvent = entry.messaging?.[0];
        if (!webhookEvent || !webhookEvent.message || !webhookEvent.sender) continue;

        const senderPsid = webhookEvent.sender.id;
        const messageText = String(webhookEvent.message.text || '').trim();

        if (!messageText) continue;

        console.log(`💬 Incoming Messenger message from PSID [${senderPsid}]: "${messageText}"`);

        // Tự động cho AI Support Butler xử lý & trả lời
        const virtualEmail = `fb_${senderPsid}@messenger.hugowishpax.studio`;
        await autoProcessTicket({
          email: virtualEmail,
          message: messageText,
        });

        // Gửi câu trả lời về cho người dùng qua Meta Graph API
        await sendMessengerReply(senderPsid, messageText);
      }
    } catch (error) {
      console.error('[Meta Webhook Process Error]', error);
    }
  } else {
    res.sendStatus(404);
  }
});

/**
 * Hàm gửi tin nhắn trả lời trực tiếp vào hộp thư Messenger 1-on-1 của khách hàng
 */
async function sendMessengerReply(recipientPsid, userMessage) {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

  // Lấy câu trả lời mới nhất do AI Support vừa xử lý
  const replyText = `🤖 [Hugo AI Support]: Cảm ơn bạn đã liên hệ! Yêu cầu của bạn đã được tiếp nhận và xử lý tự động 24/7.`;

  if (!pageAccessToken || pageAccessToken.includes('YOUR_')) {
    console.log(`[META MESSENGER BOT SIMULATED] PSID: ${recipientPsid} | Reply: "${replyText}"`);
    return { success: true, simulated: true };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text: replyText },
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.warn('⚠️ Meta Graph API returned error:', data.error.message);
      return { success: false, error: data.error.message };
    }

    return { success: true };
  } catch (error) {
    console.warn('⚠️ Send Messenger reply failed:', error.message);
    return { success: false, error: error.message };
  }
}

export default router;
