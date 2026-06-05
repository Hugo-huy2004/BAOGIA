import express from 'express';
import CompanionHistory from '../models/CompanionHistory.js';

const router = express.Router();

// GET: Fetch or initialize companion history for a specific email
router.get('/history', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let historyDoc = await CompanionHistory.findOne({ email });
    if (!historyDoc) {
      historyDoc = new CompanionHistory({
        email,
        healingActive: false,
        healingDuration: 30,
        historyLogs: []
      });
      await historyDoc.save();
    }

    res.json(historyDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Save or update companion history for a specific email
router.post('/history', async (req, res) => {
  try {
    const {
      email,
      healingActive,
      healingDuration,
      healingStartDate,
      lastCheckinDate,
      chatDistressCount,
      lastTestDate,
      historyLogs,
      chatMessages
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let historyDoc = await CompanionHistory.findOne({ email });
    if (!historyDoc) {
      historyDoc = new CompanionHistory({ email });
    }

    if (healingActive !== undefined) historyDoc.healingActive = healingActive;
    if (healingDuration !== undefined) historyDoc.healingDuration = healingDuration;
    if (healingStartDate !== undefined) historyDoc.healingStartDate = healingStartDate;
    if (lastCheckinDate !== undefined) historyDoc.lastCheckinDate = lastCheckinDate;
    if (chatDistressCount !== undefined) historyDoc.chatDistressCount = chatDistressCount;
    if (lastTestDate !== undefined) historyDoc.lastTestDate = lastTestDate;
    if (historyLogs !== undefined) historyDoc.historyLogs = historyLogs;
    if (chatMessages !== undefined) historyDoc.chatMessages = chatMessages;

    await historyDoc.save();

    // Sync new companion logs to user Bio history if Bio exists
    try {
      const Bio = (await import('../models/Bio.js')).default;
      const bioDoc = await Bio.findOne({ email });
      if (bioDoc && historyLogs && historyLogs.length > 0) {
        const existingBioLogs = bioDoc.history.filter(h => h.title && h.title.startsWith('Bạn Học Đường:'));
        if (historyLogs.length > existingBioLogs.length) {
          const newLogs = historyLogs.slice(existingBioLogs.length);
          newLogs.forEach(log => {
            let type = 'info';
            let icon = 'psychology';
            let title = 'Bạn Học Đường';
            let detail = log.reason || log.desc || '';

            if (log.type === 'checkin') {
              type = 'success';
              icon = 'sentiment_satisfied';
              title = 'Bạn Học Đường: Check-in cảm xúc';
              const moodMap = { 5: 'Rất tốt', 4: 'Tốt', 3: 'Bình thường', 2: 'Mỏi mệt', 1: 'Kiệt sức' };
              detail = `Tâm trạng: ${moodMap[log.mood] || 'Bình thường'}.${log.note ? ` Ghi chú: ${log.note}` : ''}`;
            } else if (log.test) {
              type = 'info';
              icon = 'assignment';
              title = `Bạn Học Đường: Hoàn thành bài test ${log.test.toUpperCase()}`;
              if (log.test === 'dass42' && log.scores) {
                detail = `Trầm cảm: ${log.scores.D}/42, Lo âu: ${log.scores.A}/42, Căng thẳng: ${log.scores.S}/42.`;
              } else if (log.test === 'mmpi30') {
                const elev = log.clinical ? log.clinical.filter(c => c.score >= 70).length : 0;
                detail = `Mini-MMPI: ${elev}/10 thang đo vượt ngưỡng lâm sàng.`;
              } else {
                detail = `Điểm số: ${log.score || 0} điểm.`;
              }
            } else if (log.type === 'duration_change') {
              type = 'warning';
              icon = 'favorite';
              title = 'Bạn Học Đường: Thiết lập lộ trình';
              detail = log.reason || `Kích hoạt lộ trình đồng hành.`;
            } else if (log.type === 'therapy_activity') {
              type = 'success';
              icon = 'self_improvement';
              title = `Bạn Học Đường: Thực hành trị liệu`;
              detail = `${log.name || ''} - ${log.desc || ''}`;
            }

            bioDoc.history.push({
              type,
              icon,
              title,
              detail,
              timestamp: log.date ? new Date(log.date) : new Date()
            });
          });
          await bioDoc.save();
        }
      }
    } catch (bioError) {
      console.error('Failed to sync companion log to Bio history:', bioError);
    }

    res.json({ success: true, companionHistory: historyDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
