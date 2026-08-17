import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import {
  diagnoseSystemHealth,
  processAdminPrompt,
  autoDraftTicketReply,
  generateAndSendUserEmail
} from '../services/adminBrainService.js';

const router = express.Router();

// Tự động yêu cầu quyền Admin cho toàn bộ route Bộ Não Máy Tính
router.use(requireAdmin);

/**
 * GET /api/admin/brain/diagnose
 * Chẩn đoán tình hình an ninh, sức khỏe hệ thống & biến động JOY
 */
router.get('/diagnose', async (req, res) => {
  try {
    const result = await diagnoseSystemHealth();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /diagnose:', error);
    res.status(500).json({ error: error.message || 'Lỗi chẩn đoán hệ thống từ Bộ Não Máy Tính' });
  }
});

/**
 * POST /api/admin/brain/chat
 * Trò chuyện & Ra lệnh cho Bộ Não Máy Tính Admin
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, extraContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Nội dung prompt/chỉ thị là bắt buộc' });
    }

    const result = await processAdminPrompt(prompt, extraContext);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /brain/chat:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý câu lệnh AI Brain' });
  }
});

/**
 * POST /api/admin/brain/draft-reply
 * Tự động soạn phản hồi hỗ trợ ticket
 */
router.post('/draft-reply', async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId là bắt buộc' });
    }

    const result = await autoDraftTicketReply(ticketId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /draft-reply:', error);
    res.status(500).json({ error: error.message || 'Lỗi soạn dự thảo phản hồi ticket' });
  }
});

/**
 * POST /api/admin/brain/send-email
 * Soạn & gửi email chuyên nghiệp cho người dùng
 */
router.post('/send-email', async (req, res) => {
  try {
    const { toEmail, subject, instructions, fromName } = req.body;
    if (!toEmail || !subject || !instructions) {
      return res.status(400).json({ error: 'toEmail, subject và instructions là bắt buộc' });
    }

    const result = await generateAndSendUserEmail({ toEmail, subject, instructions, fromName });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /send-email:', error);
    res.status(500).json({ error: error.message || 'Lỗi gửi email cho người dùng' });
  }
});

export default router;
