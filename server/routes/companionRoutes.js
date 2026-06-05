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
      historyLogs
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

    await historyDoc.save();
    res.json({ success: true, companionHistory: historyDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
