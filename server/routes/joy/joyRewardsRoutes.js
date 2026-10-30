// Thưởng JOY: vòng quay sinh nhật, mốc, học tập, tập trung — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import HugoTeamDev from '../../models/HugoTeamDev.js';
import { awardJoy } from '../../utils/joyService.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { canReadCoderStage } from '../../utils/appPlanService.js';
import { gradeStepQuiz, PASS_PERCENT } from '../../utils/coderExamService.js';
import { PUBLIC_TOOLS } from '../../../src/config/publicTools.js';
import { randomInt, randomBytes } from 'node:crypto';
import { memberTier, tierGifts, TIER_LABELS, VOUCHER_VALID_DAYS, voucherCode } from '../../utils/memberTier.js';
import { isLearningEvidenceEnabledFor } from '../../utils/hugoV1Features.js';
import {
  createLessonEvidence,
  privateEvidenceDto,
} from '../../services/learningEvidenceService.js';
import { sendCustomEmail, escapeHtml } from '../../services/emailService.js';
import { getCoderLessonGate, getCoderStageCompletion, CODER_TOTAL_STEPS, completedCoderSteps } from '../../../shared/coderProgression.js';
import { CODER_LESSON_IDS, FOCUS_DAILY_JOY_CAP, todayStr, BIRTHDAY_PRIZES, birthdaySpinStatus } from './joyShared.js';

const router = express.Router();

// POST /api/joy/award-learning
router.post('/award-learning', requireMember, async (req, res) => {
  try {
    const { lessonId, evidence = {}, program = 'coding' } = req.body;
    const email = req.memberEmail;
    if (!email || !lessonId) return res.status(400).json({ error: 'Email and lessonId are required' });

    const lessonIndex = CODER_LESSON_IDS.indexOf(lessonId);
    if (lessonIndex === -1) {
      return res.status(400).json({ error: 'Step Coding không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // HugoTeam học CHÍNH chương trình Coding: một tiến độ (bio.completedLessons),
    // một bộ điểm. Thành viên đang ở giai đoạn Coding của HugoTeam được học mọi
    // step (không qua cổng trả phí), dù mở từ HugoTeam hay từ ứng dụng Coding.
    const isHugoTeam = program === 'hugoteam';
    const teamDev = await HugoTeamDev.findOne({ email, assessmentStage: 'coding' });
    if (isHugoTeam) {
      if (!teamDev) return res.status(403).json({ code: 'HUGOTEAM_CODING_REQUIRED', error: 'Bạn không ở giai đoạn Coding của HugoTeam.' });
    }

    if (!bio.completedLessons) {
      bio.completedLessons = [];
    }
    const programProgress = bio.completedLessons;
    const teamView = (steps) => (teamDev ? { program: 'hugoteam', completedCount: steps.length, requiredSteps: CODER_TOTAL_STEPS, nextStage: steps.length >= CODER_TOTAL_STEPS ? 'invited' : 'coding' } : {});
    // Chép tiến độ sang hồ sơ HugoTeam (cho admin/mentor) và lên Mentor khi đủ step.
    const syncTeam = async (completedLessons) => {
      if (!teamDev) return [];
      const steps = completedCoderSteps(completedLessons);
      const complete = steps.length >= CODER_TOTAL_STEPS;
      const update = { $set: { codingCompletedSteps: steps } };
      if (complete) Object.assign(update.$set, { assessmentStage: 'passed', teamInvitedAt: new Date() });
      const result = await HugoTeamDev.updateOne({ _id: teamDev._id, assessmentStage: 'coding' }, update);
      if (complete && result.modifiedCount) sendCustomEmail(
        teamDev.email,
        'Mời bạn tham gia Hugo Team',
        `<h2>Chúc mừng ${escapeHtml(teamDev.name)}!</h2><p>Bạn đã hoàn tất chương trình học. Mở Hugo Team trong Member Portal để chấp nhận lời mời tham gia đội ngũ.</p>`,
      ).catch(() => {});
      return steps;
    };

    // Học lại step đã qua: vẫn chấm để người học thấy kết quả, nhưng không ghi điểm.
    if (programProgress.includes(lessonId)) {
      const review = gradeStepQuiz(lessonId, evidence.answers);
      const steps = await syncTeam(programProgress);
      return res.json({
        success: true,
        alreadyCompleted: true,
        balance: bio.joyBalance,
        ...review,
        passPercent: PASS_PERCENT,
        ...teamView(steps),
      });
    }

    const lessonGate = getCoderLessonGate(programProgress, lessonId);
    if (!lessonGate.unlocked) {
      return res.status(409).json({
        code: lessonGate.code,
        error: `Bạn cần hoàn thành đủ các bài trước theo đúng thứ tự. Bài đầu tiên còn thiếu: ${lessonGate.missingLessons[0]}.`,
        firstMissingLesson: lessonGate.missingLessons[0],
        missingLessonCount: lessonGate.missingLessons.length,
      });
    }



    // Step ngoài phần học thử chỉ được tính khi có quyền đọc chính step đó —
    // nếu không, ai cũng đoán đáp án mà "qua" được step trả phí.
    if (!teamDev && lessonIndex >= PUBLIC_TOOLS.study.previewLessons && !canReadCoderStage(bio, lessonGate.stage.id)) {
      return res.status(403).json({
        code: 'COURSE_ACCESS_REQUIRED',
        error: 'Step này thuộc phần trả phí. Mở khóa Coding hoặc chặng chứa step để học tiếp.',
      });
    }

    // Trắc nghiệm cuối step do MÁY CHỦ chấm lại từ câu trả lời — không tin điểm client khai.
    const graded = gradeStepQuiz(lessonId, evidence.answers);
    if (!graded) {
      return res.status(409).json({ code: 'STEP_NOT_READY', error: 'Step này đang được soạn, chưa mở.' });
    }
    // Giữ điểm cho chứng chỉ chặng: `firstTry` chỉ ghi một lần — nó nói đúng
    // năng lực lúc học xong, còn `best` thì lên dần qua mỗi lần làm lại.
    const previous = bio.hugoCoderExamScores?.[lessonId] || {};
    const scoreEntry = {
      best: Math.max(Number(previous.best || 0), graded.score),
      firstTry: previous.firstTry ?? graded.score,
      last: graded.score,
      attempts: Number(previous.attempts || 0) + 1,
      at: new Date().toISOString(),
    };
    await Bio.updateOne({ _id: bio._id }, { $set: { [`hugoCoderExamScores.${lessonId}`]: scoreEntry } });
    if (teamDev) {
      await HugoTeamDev.updateOne({ _id: teamDev._id }, { $set: { [`codingStepScores.${lessonId}`]: scoreEntry } });
    }
    if (!graded.passed) {
      return res.json({
        code: 'QUIZ_BELOW_PASS',
        ...graded,
        passPercent: PASS_PERCENT,
        error: `Đạt ${graded.score}%, cần từ ${PASS_PERCENT}%. Ôn lại phần chưa vững rồi làm lại bài trắc nghiệm.`,
      });
    }

    let privateEvidence = null;
    if (isLearningEvidenceEnabledFor(bio)) {
      try {
        const result = await createLessonEvidence({ bio, lessonId });
        privateEvidence = privateEvidenceDto(result.evidence);
      } catch (error) {
        if (error?.statusCode === 410) {
          return res.status(410).json({ error: 'EVIDENCE_DELETED' });
        }
        throw error;
      }
    }

    // $addToSet giữ tiến độ không trùng khi hai thiết bị hoàn thành cùng lúc.
    await Bio.updateOne(
      { _id: bio._id },
      { $addToSet: { completedLessons: lessonId } },
    );

    if (teamDev) {
      const steps = await syncTeam([...programProgress, lessonId]);
      return res.json({ success: true, balance: bio.joyBalance, evidence: privateEvidence, ...graded, passPercent: PASS_PERCENT, ...teamView(steps) });
    }

    res.json({ success: true, balance: bio.joyBalance, evidence: privateEvidence, ...graded, passPercent: PASS_PERCENT });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/submit-graduation-project
router.post('/submit-graduation-project', requireMember, async (req, res) => {
  try {
    const { projectUrl, projectNote } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!projectUrl) return res.status(400).json({ error: 'Vui lòng cung cấp link dự án của bạn.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    bio.hugoCoderProjectUrl = projectUrl;
    bio.hugoCoderProjectNote = projectNote || '';
    bio.hugoCoderProjectStatus = 'pending';
    bio.hugoCoderProjectSubmittedAt = new Date();

    await bio.save();
    res.json({ success: true, bio });
  } catch (error) {
    console.error('Error submitting graduation project:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/claim-milestone-reward
router.post('/claim-milestone-reward', requireMember, async (req, res) => {
  try {
    const { phase } = req.body; // number 3, 4, 5, or 6
    const email = req.memberEmail;
    if (!email || !phase) return res.status(400).json({ error: 'email and phase are required' });

    const phaseNum = Number(phase);
    if (![3, 4, 5].includes(phaseNum)) {
      return res.status(400).json({ error: 'Chặng nhận thưởng không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Chặng 4 mới gộp các mốc cũ 4/5/6 — ai đã nhận mốc cũ nào cũng coi như đã nhận.
    // Chặng 5 mới (bài 90) dùng khoá RewardClaimed7 còn trống của hệ cũ.
    const claimKeysByPhase = {
      3: ['hugoCoderRewardClaimed3'],
      4: ['hugoCoderRewardClaimed4', 'hugoCoderRewardClaimed5', 'hugoCoderRewardClaimed6'],
      5: ['hugoCoderRewardClaimed7']
    };
    const claimKey = claimKeysByPhase[phaseNum][0];
    if (claimKeysByPhase[phaseNum].some((k) => bio[k])) {
      return res.status(400).json({ error: `Bạn đã nhận phần thưởng cho Chặng ${phaseNum} rồi.` });
    }

    const stageIdByPhase = { 3: 'advanced', 4: 'security', 5: 'project' };
    const stageProgress = getCoderStageCompletion(
      bio.completedLessons || [],
      stageIdByPhase[phaseNum],
    );
    if (stageProgress.missingLessons.length > 0) {
      return res.status(409).json({
        code: 'STAGE_INCOMPLETE',
        error: `Bạn cần hoàn thành đủ Chặng ${phaseNum} để nhận thưởng. Còn thiếu ${stageProgress.missingLessons.length} bài.`,
        firstMissingLesson: stageProgress.missingLessons[0],
      });
    }

    const requiredLesson = `step${stageProgress.stage.to}`;

    const rewardAmount = 800;
    const result = await awardJoy(
      email,
      rewardAmount,
      `ide_phase_${phaseNum}_completion`,
      `Nhận thưởng hoàn thành Phần ${phaseNum} · Phát triển Web (+800 JOY)`,
      { bioDoc: bio, refId: `${requiredLesson}_phase_completion` }
    );

    bio[claimKey] = true;
    await bio.save();

    res.json({ success: true, balance: result.balance, bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/claim-info-bonus — one-time bonus for opening Info & Version
router.post('/claim-info-bonus', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.infoBonusClaimed) {
      return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });
    }

    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, infoBonusClaimed: { $ne: true } },
      { $set: { infoBonusClaimed: true } },
      { new: true },
    );
    if (!claimed) return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });

    const result = await awardJoy(email, 20, 'info_bonus', 'Khám phá Info & Version (+20 JOY)');

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/claim-info-read-bonus — one-time bonus for reading the 2.0
// release notes to the end. The client only unlocks the button after the last
// section is on screen; the server still enforces the one-time rule, which is
// the part that actually protects the balance.
router.post('/claim-info-read-bonus', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.infoReadBonusClaimed) {
      return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });
    }

    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, infoReadBonusClaimed: { $ne: true } },
      { $set: { infoReadBonusClaimed: true } },
      { new: true },
    );
    if (!claimed) return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });

    const result = await awardJoy(email, 50, 'info_read_bonus', 'Đọc hết bản nâng cấp 2.0 (+50 JOY)');

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/focus-start — stamps the start of a focus block.
router.post('/focus-start', requireMember, async (req, res) => {
  try {
    const updated = await Bio.findOneAndUpdate(
      { $or: [{ email: req.memberEmail }, { contactEmail: req.memberEmail }] },
      { $set: { focusStartedAt: new Date() } },
      { projection: { _id: 1 } },
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-focus
router.post('/award-focus', requireMember, async (req, res) => {
  try {
    const { minutes } = req.body;
    const email = req.memberEmail;
    const numMinutes = Number(minutes);
    if (!email || !Number.isFinite(numMinutes) || !Number.isInteger(numMinutes) || numMinutes < 1 || numMinutes > 1440) {
      return res.status(400).json({ error: 'Số phút tập trung không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Base rewards x3.
    let joyAmount = 0;
    if (numMinutes >= 180) joyAmount = 150;
    else if (numMinutes >= 60) joyAmount = 45;
    else if (numMinutes >= 25) joyAmount = 15;

    if (joyAmount <= 0) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    // Consume the server-stamped start; 30s slack covers network latency.
    const startedBy = new Date(Date.now() - numMinutes * 60 * 1000 + 30 * 1000);
    const started = await Bio.findOneAndUpdate(
      { _id: bio._id, focusStartedAt: { $ne: null, $lte: startedBy } },
      { $set: { focusStartedAt: null } },
      { projection: { _id: 1 } },
    );
    if (!started) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    const today = todayStr();
    await Bio.updateOne(
      { _id: bio._id, focusJoyDate: { $ne: today } },
      { $set: { focusJoyDate: today, focusJoyToday: 0 } },
    );
    const reserved = await Bio.findOneAndUpdate(
      { _id: bio._id, focusJoyDate: today, focusJoyToday: { $lte: FOCUS_DAILY_JOY_CAP - joyAmount } },
      { $inc: { focusJoyToday: joyAmount } },
      { new: true, projection: { focusJoyToday: 1 } },
    );
    if (!reserved) {
      return res.status(429).json({ error: `Đã đạt giới hạn ${FOCUS_DAILY_JOY_CAP} JOY tập trung trong ngày.` });
    }

    let result;
    try {
      result = await awardJoy(email, joyAmount, 'focus_session', `Tập trung sâu HugoAura: ${numMinutes} phút`);
    } catch (error) {
      await Bio.updateOne(
        { _id: bio._id, focusJoyDate: today, focusJoyToday: { $gte: joyAmount } },
        { $inc: { focusJoyToday: -joyAmount } },
      );
      throw error;
    }

    res.json({ success: true, balance: result.balance, awarded: joyAmount, dailyAwarded: reserved.focusJoyToday });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/birthday-spin — còn lượt quay không, và danh sách ô để vẽ vòng.
router.get('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne(
      { email: req.memberEmail },
      'birthDay birthMonth birthYear starVip birthdaySpinYear birthdaySpinPrize displayName',
    ).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    res.json(birthdaySpinStatus(bio));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/birthday-spin — bốc thưởng và cộng JOY.
router.post('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    const now = new Date();
    if (Number(bio.birthMonth) !== now.getMonth() + 1) {
      return res.status(403).json({ error: 'Vòng quay chỉ mở trong tháng sinh nhật của bạn.' });
    }
    if (!memberTier(bio)) {
      return res.status(403).json({ error: 'Cần khai đủ ngày sinh để nhận quà sinh nhật.' });
    }

    // Chốt lượt TRƯỚC khi cộng JOY: hai request bấm cùng lúc thì chỉ một cái
    // đổi được birthdaySpinYear, cái còn lại không khớp điều kiện nên trượt.
    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, birthdaySpinYear: { $ne: now.getFullYear() } },
      { $set: { birthdaySpinYear: now.getFullYear() } },
      { new: true },
    );
    if (!claimed) {
      return res.status(409).json({ error: 'Bạn đã dùng lượt quay của năm nay rồi.' });
    }

    // randomInt của crypto: phân phối đều thật sự, không lệch như Math.random()
    // nhân rồi làm tròn. Bảy ô cùng xác suất — không ô nào bị "gài".
    const index = randomInt(BIRTHDAY_PRIZES.length);
    const prize = BIRTHDAY_PRIZES[index];

    try {
      await awardJoy(req.memberEmail, prize, 'birthday_spin', `Quà tháng sinh nhật ${now.getMonth() + 1}/${now.getFullYear()}`);
    } catch (awardError) {
      // Cộng JOY hỏng thì trả lại lượt quay, đừng để mất trắng.
      await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinYear: Number(bio.birthdaySpinYear) || 0 } });
      throw awardError;
    }

    // Quà theo hạng đi cùng lượt quay: cộng ngày duy trì và phát voucher.
    // `claimed` là bản đã chốt lượt ở trên nên đọc từ đó, không đọc lại bio cũ.
    const tier = memberTier(claimed);
    const gifts = tierGifts(tier);
    const issuedVouchers = [];
    let days = 0;

    if (gifts && Number(claimed.birthdayGiftYear) !== now.getFullYear()) {
      days = gifts.days;
      const expires = new Date(Math.max(new Date(claimed.expiresAt || 0).getTime(), now.getTime()));
      expires.setDate(expires.getDate() + days);

      const voucherExpiry = new Date(now);
      voucherExpiry.setDate(voucherExpiry.getDate() + VOUCHER_VALID_DAYS);
      for (const voucher of gifts.vouchers) {
        issuedVouchers.push({
          ...voucher,
          code: voucherCode(voucher.percent, randomBytes(3).toString('hex').toUpperCase()),
          issuedAt: now,
          expiresAt: voucherExpiry,
          usedAt: null,
        });
      }

      await Bio.updateOne(
        { _id: bio._id },
        {
          $set: { expiresAt: expires, birthdayGiftYear: now.getFullYear() },
          ...(issuedVouchers.length ? { $push: { serviceVouchers: { $each: issuedVouchers } } } : {}),
        },
      );
    }

    await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinPrize: prize } });

    res.json({
      success: true,
      prize,
      index,
      prizes: BIRTHDAY_PRIZES,
      tier,
      tierLabel: tier ? TIER_LABELS[tier] : '',
      days,
      vouchers: issuedVouchers.map(({ code, percent, label, expiresAt }) => ({ code, percent, label, expiresAt })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
