import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CompanionHistory from '../models/CompanionHistory.js';
import Bio from '../models/Bio.js';
import SleepLog from '../models/SleepLog.js';
import ArcadeScore from '../models/ArcadeScore.js';
import ScheduledPush from '../models/ScheduledPush.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import { encryptText, decryptText } from '../utils/cryptoUtils.js';
import { generateWeeklyReportForUser } from '../services/companionReportService.js';
import { nextAllowedSendTime } from '../services/pushGuard.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Therapy chat is the most sensitive data in the app (a student's private
// mental-health disclosures, sometimes self-harm ideation). We encrypt the
// message body at rest so a DB dump never exposes readable conversations.
// Only the free-text `.text` is encrypted; structural flags stay queryable.
function encryptChatMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((m) => (m && typeof m.text === 'string' && m.text)
    ? { ...m, text: encryptText(m.text) }
    : m);
}
function decryptChatMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((m) => {
    const plain = m?.toObject ? m.toObject() : m;
    return (plain && typeof plain.text === 'string')
      ? { ...plain, text: decryptText(plain.text) }
      : plain;
  });
}
// Returns a plain JSON-safe history object with chatMessages decrypted for the
// client. decryptText is a no-op on already-plaintext legacy rows, so this is
// safe during the migration window before every row has been re-saved.
function historyForClient(doc) {
  const obj = doc?.toObject ? doc.toObject() : { ...doc };
  if (obj.chatMessages) obj.chatMessages = decryptChatMessages(obj.chatMessages);
  return obj;
}

// JOY cap: 180 JOY/day = 3600 awarded-seconds/day (30 JOY per 600s interval, base x3)
const COMPANION_JOY_CAP_SECONDS = 3600;
const HEARTBEAT_INTERVAL_SECONDS = 30;

// Therapy sub-features that require a one-time 150 JOY unlock per account.
// All therapy methods are JOY-gated now — only the "basic" clinical-gated
// methods (earn-via-engagement, not listed here) stay outside this paywall.
const UNLOCKABLE_FEATURES = {
  reading: { cost: 150, label: 'Đọc Truyện AI Trị Liệu' },
  meditation: { cost: 150, label: 'Thiền Dẫn AI Cá Nhân Hoá' },
  depression: { cost: 150, label: 'CBT Worksheet Cá Nhân Hoá' },
  unlimited_calls: { cost: 150, label: 'Gọi Thoại Không Giới Hạn' },
  action_plan: { cost: 150, label: 'Lộ Trình Hoạt Động Cá Nhân Hoá' },
  deep_report: { cost: 150, label: 'Báo Cáo Tâm Lý Chuyên Sâu' },
  breathing: { cost: 150, label: 'Hít Thở 4-7-8' },
  soundscape: { cost: 150, label: 'Âm Thanh Thiên Nhiên' },
  writing: { cost: 150, label: 'Viết Cảm Xúc' },
  exercise: { cost: 150, label: 'Vận Động Nhẹ' },
  social: { cost: 150, label: 'Kết Nối Xã Hội' }
};

// POST: Unlock a therapy sub-feature for 150 JOY (one-time, permanent per account)
router.post('/unlock-feature', requireMember, async (req, res) => {
  try {
    const { feature } = req.body;
    const email = req.memberEmail;
    if (!email || !feature) return res.status(400).json({ error: 'email and feature are required' });

    const def = UNLOCKABLE_FEATURES[feature];
    if (!def) return res.status(400).json({ error: 'Tính năng không hợp lệ.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.unlockedCompanionFeatures?.includes(feature)) {
      return res.json({ success: true, alreadyUnlocked: true, balance: bio.joyBalance, unlockedFeatures: bio.unlockedCompanionFeatures });
    }

    if (bio.joyBalance < def.cost) {
      return res.status(400).json({ error: 'Số dư JOY không đủ.' });
    }

    const { balance } = await awardJoy(
      email,
      -def.cost,
      'companion_unlock',
      `Mở khoá tính năng: ${def.label}`,
      { bioDoc: bio, skipSave: true }
    );

    bio.unlockedCompanionFeatures = [...(bio.unlockedCompanionFeatures || []), feature];
    await bio.save();

    // Lập lịch gửi tin thông báo thông minh sau 24h
    try {
      await ScheduledPush.create({
        email,
        feature,
        label: def.label,
        // +24h, rolled forward out of quiet hours (22:00–07:00) if it would
        // otherwise land there — e.g. unlocking at 2am no longer schedules
        // tomorrow's reminder for 2am too.
        scheduledFor: nextAllowedSendTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
      });
    } catch (schedErr) {
      console.error('[ScheduledPush] Lỗi khi tạo lịch gửi tin:', schedErr.message);
    }

    res.json({ success: true, balance, unlockedFeatures: bio.unlockedCompanionFeatures });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST: Active-session heartbeat — awards +30 JOY per confirmed 10 minutes
// of active companion usage, capped at 180 JOY/day.
router.post('/heartbeat', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Atomic operators only below — no fetch-mutate-save — so concurrent
    // heartbeats (fired every 30s, possibly from multiple tabs) can never
    // collide into a Mongoose VersionError on this hot, frequently-concurrent path.
    await CompanionHistory.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, healingActive: false, healingDuration: 30, historyLogs: [], chatMessages: [] } },
      { upsert: true }
    );

    const today = new Date().toISOString().slice(0, 10);
    await CompanionHistory.updateOne(
      { email, activeSecondsDate: { $ne: today } },
      { $set: { activeSecondsDate: today, activeSecondsToday: 0, joyAwardedSecondsToday: 0, dailyJoyCapReached: false, claimedChallengesToday: [] } }
    );

    let doc = await CompanionHistory.findOneAndUpdate(
      { email },
      { $inc: { activeSecondsToday: HEARTBEAT_INTERVAL_SECONDS } },
      { new: true }
    );

    while (
      !doc.dailyJoyCapReached &&
      doc.activeSecondsToday - doc.joyAwardedSecondsToday >= 600
    ) {
      // CAS-style claim: only succeeds if no other concurrent request has
      // already claimed this 600s block — prevents double-awarding JOY.
      const claimed = await CompanionHistory.findOneAndUpdate(
        { email, joyAwardedSecondsToday: doc.joyAwardedSecondsToday },
        { $inc: { joyAwardedSecondsToday: 600 } },
        { new: true }
      );
      if (!claimed) break;
      doc = claimed;
      try {
        await awardJoy(email, 30, 'companion', 'Hoàn thành 10 phút trị liệu tâm lý (+30 JOY)');
      } catch (e) {
        console.error('[companion joy award]', e.message);
      }
      if (doc.joyAwardedSecondsToday >= COMPANION_JOY_CAP_SECONDS && !doc.dailyJoyCapReached) {
        await CompanionHistory.updateOne({ email }, { $set: { dailyJoyCapReached: true } });
        doc.dailyJoyCapReached = true;
      }
    }

    res.json({
      activeSecondsToday: doc.activeSecondsToday,
      dailyCapReached: doc.dailyJoyCapReached
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch or initialize companion history for a specific email
router.get('/history', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let historyDoc = await CompanionHistory.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          healingActive: false,
          healingDuration: 30,
          historyLogs: [],
          chatMessages: []
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    if (historyDoc.activeSecondsDate !== todayStr) {
      // Atomic update — avoids racing with a concurrent heartbeat save on
      // the same document (which would throw a Mongoose VersionError here).
      await CompanionHistory.updateOne(
        { email, activeSecondsDate: { $ne: todayStr } },
        { $set: { activeSecondsDate: todayStr, activeSecondsToday: 0, joyAwardedSecondsToday: 0, dailyJoyCapReached: false, claimedChallengesToday: [] } }
      );
      historyDoc.activeSecondsDate = todayStr;
      historyDoc.activeSecondsToday = 0;
      historyDoc.joyAwardedSecondsToday = 0;
      historyDoc.dailyJoyCapReached = false;
      historyDoc.claimedChallengesToday = [];
    }

    if (historyDoc.blockedUntil && new Date(historyDoc.blockedUntil) > new Date()) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị tạm khóa do phát hiện nghi vấn xâm nhập. Vui lòng thử lại sau.', blockedUntil: historyDoc.blockedUntil });
    }

    if (historyDoc.healingStartDate) {
      const startMonth = new Date(historyDoc.healingStartDate).getMonth();
      const currentMonth = new Date().getMonth();
      const startYear = new Date(historyDoc.healingStartDate).getFullYear();
      const currentYear = new Date().getFullYear();

      const isNewMonth = (currentYear > startYear) || (currentYear === startYear && currentMonth > startMonth);

      if (isNewMonth) {
        const start = new Date(historyDoc.healingStartDate).getTime();
        const now = new Date().getTime();
        const progressDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);

        if (!historyDoc.healingActive || progressDays > historyDoc.healingDuration) {
          const resetFields = {
            healingActive: false,
            healingDuration: 30,
            historyLogs: [],
            chatMessages: [],
            healingStartDate: null,
            lastCheckinDate: '',
            lastTestDate: ''
          };
          // Atomic update — this is the exact pattern that previously raced
          // with a concurrent heartbeat .save() and threw a VersionError.
          await CompanionHistory.updateOne({ email }, { $set: resetFields });
          Object.assign(historyDoc, resetFields);
        }
      }
    }

    res.json(historyForClient(historyDoc));
  } catch (error) {
    console.error('[companion/history]', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Save or update companion history for a specific email
router.post('/history', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const {
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

    const $set = {};

    if (healingActive !== undefined) $set.healingActive = healingActive;
    if (healingDuration !== undefined) {
      const dur = Number(healingDuration);
      $set.healingDuration = !isNaN(dur) ? dur : 30;
    }
    if (healingStartDate !== undefined) $set.healingStartDate = healingStartDate;
    if (lastCheckinDate !== undefined) $set.lastCheckinDate = lastCheckinDate;
    if (chatDistressCount !== undefined) {
      const val = Number(chatDistressCount);
      $set.chatDistressCount = !isNaN(val) ? val : 0;
    }
    if (lastTestDate !== undefined) $set.lastTestDate = lastTestDate;
    if (historyLogs !== undefined) $set.historyLogs = historyLogs;
    if (chatMessages !== undefined) $set.chatMessages = encryptChatMessages(chatMessages);

    let historyDoc = await CompanionHistory.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email },
        ...(Object.keys($set).length ? { $set } : {})
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    if (historyDoc.activeSecondsDate !== todayStr) {
      // Atomic update — historyDoc here was just returned by a $set
      // findOneAndUpdate above, so calling .save() again risks a Mongoose
      // VersionError if a concurrent heartbeat bumped the version meanwhile.
      await CompanionHistory.updateOne(
        { email, activeSecondsDate: { $ne: todayStr } },
        { $set: { activeSecondsDate: todayStr, activeSecondsToday: 0, joyAwardedSecondsToday: 0, dailyJoyCapReached: false, claimedChallengesToday: [] } }
      );
      historyDoc.activeSecondsDate = todayStr;
      historyDoc.activeSecondsToday = 0;
      historyDoc.joyAwardedSecondsToday = 0;
      historyDoc.dailyJoyCapReached = false;
      historyDoc.claimedChallengesToday = [];
    }

    // --- Streak tracking for checkin logs ---
    if (historyLogs && Array.isArray(historyLogs)) {
      const latestLog = historyLogs[historyLogs.length - 1];
      if (latestLog && latestLog.type === 'checkin') {
        const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const streaks = historyDoc.streaks || {};
        const lastStreakDate = streaks.lastStreakDate || null;
        let currentStreak = streaks.currentCheckinStreak || 0;
        let longestStreak = streaks.longestCheckinStreak || 0;
        let totalSessions = streaks.totalSessions || 0;

        if (lastStreakDate !== today) {
          // Only update streak if this is a new day's checkin
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (lastStreakDate === yesterday) {
            currentStreak += 1;
          } else if (!lastStreakDate) {
            currentStreak = 1;
          } else {
            // Streak broken (gap > 1 day)
            currentStreak = 1;
          }

          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }

          totalSessions += 1;

          await CompanionHistory.findOneAndUpdate(
            { email },
            {
              $set: {
                'streaks.currentCheckinStreak': currentStreak,
                'streaks.longestCheckinStreak': longestStreak,
                'streaks.lastStreakDate': today,
                'streaks.totalSessions': totalSessions
              }
            }
          );
          // Refresh historyDoc after streak update
          historyDoc = await CompanionHistory.findOne({ email });
        }
      }
    }

    // --- Crisis detection based on chatDistressCount ---
    if (chatDistressCount !== undefined) {
      const distressVal = Number(chatDistressCount);
      let severity = null;

      if (distressVal >= 5) {
        severity = 'high';
      } else if (distressVal >= 3) {
        severity = 'medium';
      }

      if (severity) {
        // Find most recent log reason as trigger
        const latestLog = historyDoc.historyLogs && historyDoc.historyLogs.length > 0
          ? historyDoc.historyLogs[historyDoc.historyLogs.length - 1]
          : null;
        const trigger = latestLog
          ? (latestLog.reason || latestLog.desc || latestLog.note || `chatDistressCount=${distressVal}`)
          : `chatDistressCount=${distressVal}`;

        // Only add a new crisis flag if the last unresolved flag is not already this severity
        const existingFlags = historyDoc.crisisFlags || [];
        const lastUnresolved = existingFlags.filter(f => !f.resolved).pop();
        const shouldAdd = !lastUnresolved || lastUnresolved.severity !== severity;

        if (shouldAdd) {
          await CompanionHistory.findOneAndUpdate(
            { email },
            {
              $push: {
                crisisFlags: {
                  detectedAt: new Date(),
                  severity,
                  trigger,
                  resolved: false
                }
              }
            }
          );
          // Refresh
          historyDoc = await CompanionHistory.findOne({ email });
        }
      }
    }

    // Sync new companion logs to user Bio history if Bio exists
    try {
      const Bio = (await import('../models/Bio.js')).default;
      const bioDoc = await Bio.findOne({ email });
      if (bioDoc && historyDoc.historyLogs && historyDoc.historyLogs.length > 0) {
        const existingBioLogs = bioDoc.history.filter(h => h.title && h.title.startsWith('Bạn Học Đường:'));
        if (historyDoc.historyLogs.length > existingBioLogs.length) {
          const newLogs = historyDoc.historyLogs.slice(existingBioLogs.length);
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
              } else if (log.test === 'mmpi30' && log.clinical) {
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

    res.json({ success: true, companionHistory: historyForClient(historyDoc) });
  } catch (error) {
    console.error('[companion/claim-challenge]', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Instant high-severity crisis flag, raised directly by the client-side
// self-harm/suicide-risk detector (isCrisisText in intentClassifier.js) the
// moment it matches — unlike the gradual chatDistressCount-based detection
// above, this bypasses any accumulation threshold so Admin is alerted on the
// very first message, with enough context (phone, recent messages) to call
// the member back immediately without having to dig through their history.
router.post('/crisis-alert', requireMember, async (req, res) => {
  try {
    const { trigger, conversationSummary } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const bioDoc = await Bio.findOne({ email }).select('phone').lean();

    await CompanionHistory.findOneAndUpdate(
      { email },
      {
        $push: {
          crisisFlags: {
            detectedAt: new Date(),
            severity: 'high',
            trigger: trigger || 'Phát hiện cụm từ tự tử/tự hại trong tin nhắn',
            resolved: false,
            phone: bioDoc?.phone || '',
            conversationSummary: (conversationSummary || '').slice(0, 1000)
          }
        }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Mark a crisis flag as resolved once the member confirms they've sought help
router.post('/crisis/resolve', requireMember, async (req, res) => {
  try {
    const { flagId } = req.body;
    const email = req.memberEmail;
    if (!email || !flagId) return res.status(400).json({ error: 'email and flagId are required' });

    const doc = await CompanionHistory.findOneAndUpdate(
      { email, 'crisisFlags._id': flagId },
      { $set: { 'crisisFlags.$.resolved': true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy cảnh báo này.' });

    res.json({ success: true, crisisFlags: doc.crisisFlags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Admin — list all unresolved high-severity crisis flags across all members
router.get('/admin/crisis-alerts', requireAdmin, async (req, res) => {
  try {
    const docs = await CompanionHistory.find({
      crisisFlags: { $elemMatch: { severity: 'high', resolved: false } }
    }).select('email crisisFlags').lean();

    const emails = docs.map(d => d.email);
    const bios = await Bio.find({ email: { $in: emails } }).select('email displayName phone').lean();
    const bioByEmail = Object.fromEntries(bios.map(b => [b.email, b]));

    const alerts = [];
    docs.forEach(doc => {
      doc.crisisFlags
        .filter(f => f.severity === 'high' && !f.resolved)
        .forEach(f => alerts.push({
          email: doc.email,
          displayName: bioByEmail[doc.email]?.displayName || doc.email,
          phone: f.phone || bioByEmail[doc.email]?.phone || '',
          conversationSummary: f.conversationSummary || '',
          flagId: f._id,
          detectedAt: f.detectedAt,
          trigger: f.trigger
        }));
    });

    alerts.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Block user IP/Session for 15 minutes due to anomaly detection
router.post('/history/block', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Block for 15 minutes
    const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);

    await CompanionHistory.findOneAndUpdate(
      { email },
      { $set: { blockedUntil } },
      { upsert: true }
    );

    res.json({ success: true, blockedUntil });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Generate and save weekly wellness report
router.post('/report/weekly', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { report } = await generateWeeklyReportForUser(email, req.body?.bio);
    res.json({ success: true, report });
  } catch (error) {
    if (error.message === 'Companion history not found for this email') {
      return res.status(404).json({ error: error.message });
    }
    import('fs').then(fs => {
      fs.writeFileSync(join(__dirname, '../error_log.txt'), error.stack || error.message);
    }).catch(console.error);
    res.status(500).json({ error: error.message });
  }
});

// Base rewards x3. Expanded beyond the original 3 (all psychology-only) to
// give members missions across other parts of the app too, per request.
const DAILY_CHALLENGES = {
  breath: { amount: 45, name: 'Hít thở 4-7-8' },
  chat: { amount: 45, name: 'Trò chuyện cùng AI' },
  assessment: { amount: 60, name: 'Làm test tâm lý' },
  sleep: { amount: 30, name: 'Ghi nhật ký giấc ngủ' },
  arcade: { amount: 25, name: 'Chơi 1 trận tại HugoArcade' }
};

// Shared by GET /challenges-status and POST /claim-challenge so the "did the
// user actually do this today" check can never drift between the two routes.
// Async because the new challenges (sleep, arcade) check other collections.
async function isChallengeCompletedToday(historyDoc, challengeId, todayStr, email) {
  // sleep/arcade live in their own collections, independent of whether the
  // member has ever touched the Companion/psychology features at all.
  if (challengeId === 'sleep') {
    const log = await SleepLog.findOne({ email, date: todayStr });
    return Boolean(log);
  }
  if (challengeId === 'arcade') {
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const played = await ArcadeScore.findOne({ email, lastPlayedAt: { $gte: startOfDay } });
    return Boolean(played);
  }
  if (!historyDoc) return false;

  const isLogToday = (logDate) => {
    if (!logDate) return false;
    return new Date(logDate).toISOString().slice(0, 10) === todayStr;
  };

  if (challengeId === 'breath') {
    return historyDoc.historyLogs.some(log =>
      log.type === 'therapy_activity' &&
      (log.name?.toLowerCase().includes('hít thở') || log.name?.toLowerCase().includes('thư giãn cơ')) &&
      isLogToday(log.date)
    );
  }
  if (challengeId === 'chat') {
    const userMsgCount = historyDoc.chatMessages.filter(msg =>
      msg.sender === 'user' &&
      isLogToday(msg.time)
    ).length;
    return userMsgCount >= 3;
  }
  if (challengeId === 'assessment') {
    return historyDoc.historyLogs.some(log =>
      (log.type === 'clinical_test' || log.test) &&
      isLogToday(log.date)
    );
  }
  return false;
}

// GET: status of today's daily challenges (completed / already claimed),
// powers the "Nhiệm vụ" tab in the JOY wallet without guessing client-side.
router.get('/challenges-status', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const historyDoc = await CompanionHistory.findOne({ email });
    const todayStr = new Date().toISOString().slice(0, 10);
    const claimedToday = historyDoc?.activeSecondsDate === todayStr
      ? (historyDoc.claimedChallengesToday || [])
      : [];

    const challenges = await Promise.all(Object.entries(DAILY_CHALLENGES).map(async ([id, def]) => ({
      id,
      name: def.name,
      amount: def.amount,
      completed: await isChallengeCompletedToday(historyDoc, id, todayStr, email),
      claimed: claimedToday.includes(id)
    })));

    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Claim daily challenge reward
router.post('/claim-challenge', requireMember, async (req, res) => {
  try {
    const { challengeId } = req.body;
    const email = req.memberEmail;
    if (!email || !challengeId) {
      return res.status(400).json({ error: 'Email and challengeId are required' });
    }

    const challengeDef = DAILY_CHALLENGES[challengeId];
    if (!challengeDef) {
      return res.status(400).json({ error: 'Thử thách không hợp lệ.' });
    }

    // claimedChallengesToday lives on CompanionHistory regardless of which
    // challenge is being claimed — find-or-create so members who've never
    // touched the psychology features (but did the sleep/arcade mission)
    // aren't blocked from claiming.
    let historyDoc = await CompanionHistory.findOneAndUpdate(
      { email },
      { $setOnInsert: { email } },
      { upsert: true, new: true }
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    if (historyDoc.activeSecondsDate !== todayStr) {
      // Atomic — avoids racing with a concurrent heartbeat save.
      await CompanionHistory.updateOne(
        { email, activeSecondsDate: { $ne: todayStr } },
        { $set: { activeSecondsDate: todayStr, activeSecondsToday: 0, joyAwardedSecondsToday: 0, dailyJoyCapReached: false, claimedChallengesToday: [] } }
      );
      historyDoc = await CompanionHistory.findOne({ email });
    }

    const claimedToday = historyDoc.claimedChallengesToday || [];
    if (claimedToday.includes(challengeId)) {
      return res.status(400).json({ error: 'Bạn đã nhận phần thưởng cho thử thách này hôm nay rồi.' });
    }

    if (!(await isChallengeCompletedToday(historyDoc, challengeId, todayStr, email))) {
      return res.status(400).json({ error: 'Bạn chưa hoàn thành thử thách này hôm nay.' });
    }

    // CAS-style claim BEFORE awarding JOY: only succeeds if no concurrent
    // request already claimed this challenge today — guarantees exactly-once
    // award and removes the .save()-after-awardJoy race entirely.
    const claimResult = await CompanionHistory.updateOne(
      { email, claimedChallengesToday: { $ne: challengeId } },
      { $addToSet: { claimedChallengesToday: challengeId } }
    );
    if (claimResult.modifiedCount === 0) {
      return res.status(400).json({ error: 'Bạn đã nhận phần thưởng cho thử thách này hôm nay rồi.' });
    }

    const { balance } = await awardJoy(
      email,
      challengeDef.amount,
      'daily_challenge',
      `Hoàn thành thử thách: ${challengeDef.name}`
    );

    res.json({
      success: true,
      balance,
      claimedChallengesToday: [...claimedToday, challengeId]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
