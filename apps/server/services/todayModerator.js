// Tuần tra bảng tin Today. Thành viên đăng là hiện ngay; AI đọc lại 8 giờ một
// lần (cronJobs.js). Bài vi phạm bị GỠ khỏi Today (không xoá — chỉ tác giả còn
// thấy, kèm nhãn), tác giả nhận thông báo + lý do, và tính một lỗi theo đúng
// luật ba lần của chat đồng hành: cảnh cáo lần 1–2, lần 3 trong 7 ngày khoá
// tài khoản. Từ tục tĩu nằm trong danh sách thì gỡ ngay lúc đăng, không chờ.
//
// AN TOÀN NGƯỜI DÙNG: buồn bã, than mệt, tâm sự tiêu cực KHÔNG phải vi phạm.
// Câu có dấu hiệu khủng hoảng không bao giờ bị gỡ hay tính lỗi.
import TodayPost from '../models/TodayPost.js';
import SecurityEvent from '../models/SecurityEvent.js';
import CompanionHistory from '../models/CompanionHistory.js';
import { hasProfanity, isCrisis } from './companionGuard.js';
import { recordSecurityViolation } from './securityEnforcement.js';
import { complete } from './companionBrainService.js';
import { notifyMember } from '../utils/notifyMember.js';

export const CATEGORIES = ['sexual', 'profanity', 'harassment', 'divisive', 'provocative', 'sensitive'];

// "Gây chia rẽ" theo phương án đã chốt 26/10: chỉ gỡ khi công kích một NHÓM
// người; nêu quan điểm, tranh luận lịch sự thì giữ.
const POLICY = `Bạn kiểm duyệt bảng tin của một cộng đồng học sinh, sinh viên Việt Nam (từ 14 tuổi).
Mỗi bài có số thứ tự [n]. Chỉ gắn nhãn khi bài RÕ RÀNG thuộc một nhóm:
- sexual: khiêu dâm, gợi dục, gạ gẫm tình dục.
- profanity: chửi thề, lăng mạ thô tục.
- harassment: công kích, bêu xấu, đe doạ, bắt nạt một người cụ thể.
- divisive: công kích hay miệt thị một NHÓM người theo vùng miền, tôn giáo, giới tính, xu hướng tính dục, sắc tộc, khuyết tật.
- provocative: kích động đánh nhau, bạo lực, cố tình gây hấn để gây chiến.
- sensitive: mô tả máu me rùng rợn; cổ suý ma tuý, cờ bạc, vũ khí; hướng dẫn cách tự hại.
KHÔNG vi phạm: buồn bã, than mệt, tâm sự tiêu cực, kể chuyện mình bị bắt nạt, xin giúp đỡ, nêu quan điểm hay tranh luận lịch sự, chê một sản phẩm hay môn học, đùa nhẹ.
Phân vân thì coi là không vi phạm.
Chỉ trả về JSON, không giải thích: {"violations":[{"id":<n>,"category":"<nhóm>"}]}. Không bài nào vi phạm thì "violations" là mảng rỗng.`;

const BATCH = 10;
const MAX_PER_RUN = 600; // ~60 lượt LLM, chừa phần lớn hạn mức ngày cho chat
const MAX_CHARS = 1500;

const contentOf = (post) => [post.text, ...(post.poll?.options || []).map((o) => o.text)].filter(Boolean).join('\n');

const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

async function removePost(post, category, req = null) {
  const content = contentOf(post);
  const { caseId, strike, block } = await recordSecurityViolation({
    req,
    email: post.authorEmail,
    category: 'today_violation',
    severity: 'high',
    ruleId: `today_${category}`,
    evidence: content.slice(0, 500),
    enforcement: 'strikes',
    notify: false,
  });
  const removed = { category, caseId, at: new Date() };
  await TodayPost.updateOne({ _id: post._id }, { $set: { removed, reviewedAt: new Date() } });
  await notifyMember({
    email: post.authorEmail,
    key: `event.todayRemoved.${category}`,
    params: { strike: Math.min(strike || 3, 3) },
    type: 'warning',
    push: true,
  }).catch(() => {});
  // Thẻ cho admin: AI có lúc gỡ nhầm, bấm một nút là bài hiện lại và xoá lỗi.
  import('./telegramService.js').then(({ sendTelegramAlert }) => sendTelegramAlert(
    `🧹 <b>Today: đã gỡ một bài</b> (<code>${category}</code>${block ? ', tài khoản đã bị khoá' : `, lỗi ${strike}/3`})\n\n${escapeHtml(content.slice(0, 600))}`,
    'HTML',
    { inline_keyboard: [[{ text: '↩️ Khôi phục bài (gỡ nhầm)', callback_data: `cb_today_restore:${post._id}` }]] },
  )).catch(() => {});
  return removed;
}

// Bài có dấu hiệu khủng hoảng: KHÔNG gỡ, mà đỡ. Gắn cờ vào cùng danh sách
// khủng hoảng của chat (admin đã có màn gọi lại), gửi lời hỏi thăm kèm đường
// dây nóng cho tác giả, báo Telegram. Một lần mỗi 24 giờ cho một người.
async function careForAuthor(post, content) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flagged = await CompanionHistory.updateOne(
    { email: post.authorEmail, crisisFlags: { $not: { $elemMatch: { trigger: 'today_post', detectedAt: { $gte: since } } } } },
    { $push: { crisisFlags: { detectedAt: new Date(), severity: 'high', trigger: 'today_post', resolved: false, conversationSummary: content.slice(0, 1000) } } },
  );
  if (!flagged.modifiedCount) {
    // Chưa có lịch sử chat thì tạo mới; đã có cờ trong 24 giờ thì thôi.
    if (await CompanionHistory.exists({ email: post.authorEmail })) return;
    await CompanionHistory.create({ email: post.authorEmail, crisisFlags: [{ detectedAt: new Date(), severity: 'high', trigger: 'today_post', resolved: false, conversationSummary: content.slice(0, 1000) }] });
  }
  await notifyMember({ email: post.authorEmail, key: 'event.todayCare', type: 'info', category: 'wellness', push: true }).catch(() => {});
  import('./telegramService.js').then(({ sendTelegramAlert }) => sendTelegramAlert(
    `🆘 <b>Today: bài có dấu hiệu khủng hoảng</b> — đã gắn cờ trong danh sách khủng hoảng, bài giữ nguyên.\n\n${escapeHtml(content.slice(0, 600))}`,
  )).catch(() => {});
}

/** Lớp tức thì lúc đăng/sửa, 0 AI: từ tục → gỡ; khủng hoảng → đỡ. Trả `removed` nếu gỡ. */
export async function screenOnPost(post, req) {
  const content = contentOf(post);
  if (isCrisis(content)) {
    await careForAuthor(post, content).catch((err) => console.warn('[todayModerator] care:', err.message));
    return null;
  }
  if (!hasProfanity(content)) return null;
  return removePost(post, 'profanity', req);
}

/** Một lượt tuần tra: đọc mọi bài chưa duyệt (hoặc sửa sau lần duyệt), cũ trước. */
export async function patrolToday() {
  let checked = 0;
  let removed = 0;
  while (checked < MAX_PER_RUN) {
    const startedAt = new Date();
    const posts = await TodayPost.find(
      { authorEmail: { $type: 'string' }, reviewedAt: null },
      { authorEmail: 1, text: 1, poll: 1 },
    ).sort({ createdAt: 1 }).limit(BATCH).lean();
    if (!posts.length) break;

    const body = posts.map((p, i) => `[${i + 1}] ${contentOf(p).slice(0, MAX_CHARS)}`).join('\n\n');
    let violations;
    try {
      const raw = await complete(
        [{ role: 'system', content: POLICY }, { role: 'user', content: body }],
        { max_tokens: 300, temperature: 0 },
      );
      violations = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).violations;
      if (!Array.isArray(violations)) throw new Error('bad_json');
    } catch (err) {
      // Hết hạn mức hay model trả sai: để nguyên, lượt sau đọc lại.
      // ponytail: một lô mà model luôn trả sai sẽ chặn cả hàng; bỏ qua lô đó nếu log thấy lặp.
      console.warn('[todayModerator] dừng lượt:', err.message);
      break;
    }

    for (const v of violations) {
      const post = posts[Number(v.id) - 1];
      if (!post || !CATEGORIES.includes(v.category) || isCrisis(contentOf(post))) continue;
      await removePost(post, v.category);
      removed += 1;
    }
    // Bài bị sửa trong lúc chờ model thì giữ trống mốc để lượt sau đọc bản mới.
    await TodayPost.updateMany(
      { _id: { $in: posts.map((p) => p._id) }, reviewedAt: null, $or: [{ editedAt: null }, { editedAt: { $lte: startedAt } }] },
      { $set: { reviewedAt: new Date() } },
    );
    checked += posts.length;
  }
  return { checked, removed };
}

/** Admin bấm "Khôi phục": bài hiện lại, lỗi bị xoá khỏi sổ ba lần. */
export async function restorePost(id) {
  const post = await TodayPost.findOneAndUpdate({ _id: id, removed: { $exists: true } }, { $unset: { removed: 1 } }).lean();
  if (!post) return false;
  await SecurityEvent.deleteOne({ caseId: post.removed.caseId });
  await notifyMember({ email: post.authorEmail, key: 'event.todayRestored', type: 'success', push: true }).catch(() => {});
  return true;
}
