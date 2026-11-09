// Nhiệm vụ hằng ngày của ví JOY (trước 04/11/2026 nằm trong companionRoutes cùng
// các nhiệm vụ HugoPSY; HugoPSY đã gỡ nên còn ba nhiệm vụ dưới đây).
//   GET  /api/joy/missions             trạng thái hôm nay
//   POST /api/joy/missions/claim       { missionId } nhận thưởng một nhiệm vụ
//   POST /api/joy/missions/tree-bonus  xong hết thì nhận thưởng cây
import express from 'express';
import Bio from '../../models/Bio.js';
import CheckinRecord from '../../models/CheckinRecord.js';
import JoyMission from '../../models/JoyMission.js';
import { TREE_BONUS_JOY, TREE_STAGES } from '../../../../packages/shared/joyPrices.js';
import { awardJoy } from '../../utils/joyService.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { getVietnamDateString } from '../../utils/timeUtils.js';

const router = express.Router();

export const DAILY_MISSIONS = {
  checkin: { amount: 20, name: 'Điểm danh hôm nay' },
  focus: { amount: 30, name: 'Một phiên tập trung' },
};

async function isDone(id, email, today) {
  if (id === 'checkin') {
    const record = await CheckinRecord.findOne({ email }).select('lastCheckinDate').lean();
    return record?.lastCheckinDate === today;
  }
  if (id === 'focus') {
    const bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] }).select('focusJoyDate').lean();
    return bio?.focusJoyDate === today;
  }
  return false;
}

const claimedToday = (doc, today) => (doc?.date === today ? doc.claimed || [] : []);

router.get('/missions', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const today = getVietnamDateString();
    const claimed = claimedToday(await JoyMission.findOne({ email }).lean(), today);
    const missions = await Promise.all(Object.entries(DAILY_MISSIONS).map(async ([id, def]) => ({
      id, name: def.name, amount: def.amount,
      completed: await isDone(id, email, today),
      claimed: claimed.includes(id),
    })));
    res.json({ challenges: missions });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/missions/claim', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const id = req.body?.missionId || req.body?.challengeId;
    const def = DAILY_MISSIONS[id];
    if (!def) return res.status(400).json({ error: 'Nhiệm vụ không hợp lệ.' });
    const today = getVietnamDateString();

    // Sang ngày mới: làm trống danh sách đã nhận (điều kiện `date` chặn hai request cùng làm).
    // Upsert gặp dòng đã sang ngày hôm nay sẽ đụng khoá `email` (E11000): nghĩa là không cần làm gì.
    await JoyMission.updateOne({ email, date: { $ne: today } }, { $set: { date: today, claimed: [] } }, { upsert: true })
      .catch((err) => { if (err.code !== 11000) throw err; });
    if (!(await isDone(id, email, today))) return res.status(400).json({ error: 'Bạn chưa hoàn thành nhiệm vụ này hôm nay.' });

    // Đánh dấu đã nhận TRƯỚC khi cộng JOY: hai request song song chỉ một cái khớp.
    const doc = await JoyMission.findOneAndUpdate(
      { email, date: today, claimed: { $ne: id } },
      { $addToSet: { claimed: id } },
      { new: true, lean: true },
    );
    if (!doc) {
      const latest = await JoyMission.findOne({ email }).lean();
      return res.json({ success: true, alreadyClaimed: true, awarded: 0, claimedChallengesToday: claimedToday(latest, today) });
    }
    try {
      const { balance } = await awardJoy(email, def.amount, 'daily_challenge', `Hoàn thành thử thách: ${def.name}`);
      res.json({ success: true, balance, claimedChallengesToday: doc.claimed });
    } catch (error) {
      await JoyMission.updateOne({ email }, { $pull: { claimed: id } }); // cộng lỗi thì trả lại lượt nhận
      throw error;
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/missions/tree-bonus', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const today = getVietnamDateString();
    const ids = Object.keys(DAILY_MISSIONS);
    const claimed = claimedToday(await JoyMission.findOne({ email }).lean(), today);
    const missing = ids.filter((id) => !claimed.includes(id));
    if (missing.length) return res.status(400).json({ error: 'Chưa hoàn thành hết nhiệm vụ hôm nay.', missing });

    const won = await JoyMission.findOneAndUpdate({ email, treeBonusDate: { $ne: today } }, { $set: { treeBonusDate: today } });
    if (!won) return res.status(409).json({ error: 'Hôm nay đã nhận thưởng cây rồi.', alreadyClaimed: true });
    try {
      const { balance } = await awardJoy(email, TREE_BONUS_JOY, 'daily_tree_bonus', `Cây nhiệm vụ trưởng thành — hoàn thành ${ids.length}/${ids.length} nhiệm vụ`);
      res.json({ awarded: TREE_BONUS_JOY, balance, stages: TREE_STAGES.length });
    } catch (error) {
      await JoyMission.updateOne({ email }, { $set: { treeBonusDate: '' } });
      throw error;
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
