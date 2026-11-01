// Bạn bè + thi đua tuần của Education Hugo (kiểu Duolingo).
//  - Mỗi người học có MÃ BẠN 6 ký tự (hiện kèm QR). Kết bạn HAI CHIỀU, phải được chấp thuận:
//    gửi lời mời (bằng mã, QR, hoặc tìm theo biệt danh / đúng email) → người kia đồng ý mới thành bạn.
//  - XP tuần chỉ cộng ở máy chủ sau khi chấm bài đạt (award-learning) — client không gửi điểm.
//  - Bảng xếp hạng chỉ lộ PERSONA (biệt danh + nhân vật pixel, modules/persona) + chuỗi + XP:
//    không tên thật, không ảnh thật, không email. Chưa có biệt danh thì không có tên trên bảng tuần.
import { randomInt } from 'node:crypto';
import Bio from '../models/Bio.js';
import Persona from '../models/Persona.js';
import UserReport from '../models/UserReport.js';
import { sendTelegramAlert } from './telegramService.js';
import { sendEduPush } from '../utils/pushNotifier.js';
import { STAGES } from '../../../packages/courses/coding/index.js';
import EduLearner from '../models/EduLearner.js';
import { PersonaService } from '../modules/persona/PersonaService.js';
import { vnClock } from '../../../packages/shared/eduPrefs.js';
import { streakView } from '../../../packages/shared/eduStreak.js';

export const XP_PER_CORRECT = 10;  // qua step lần đầu: 10 XP mỗi câu đúng
export const XP_PER_LESSON = 10;   // xong một bài nhỏ lần đầu
export const XP_REVIEW = 5;        // ôn lại được tính giữ lửa: 5 XP
const MAX_FRIENDS = 100;
const MAX_PENDING = 50;
const LEAGUE_SIZE = 30;
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // bỏ 0/O/1/I/L cho dễ đọc

/** Tuần ISO theo giờ VN, dạng "2026-W45" — thi đua reset 00:00 thứ Hai giờ VN. */
export function weekOf(day) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // thứ Năm cùng tuần quyết định năm ISO
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Cộng XP tuần. Sang tuần mới thì đặt lại từ số này. */
export async function addEduXp(email, xp) {
  if (!(xp > 0)) return;
  const week = weekOf(vnClock().day);
  const inc = await EduLearner.updateOne({ email, xpWeek: week }, { $inc: { xpWeekly: xp } });
  // ponytail: hai bài nộp cùng giây đúng lúc sang tuần có thể mất một lần cộng — chấp nhận được.
  if (!inc.matchedCount) await EduLearner.updateOne({ email }, { $set: { xpWeek: week, xpWeekly: xp } }, { upsert: true });
}

async function ensureCode(doc) {
  if (doc.friendCode) return doc.friendCode;
  for (let i = 0; i < 6; i += 1) {
    const code = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
    try {
      const saved = await EduLearner.findOneAndUpdate({ _id: doc._id, friendCode: { $in: [null, ''] } }, { $set: { friendCode: code } }, { new: true }).lean();
      if (saved) return saved.friendCode;
      return (await EduLearner.findById(doc._id).select('friendCode').lean()).friendCode;
    } catch (error) {
      if (error.code !== 11000) throw error; // trùng mã → thử mã khác
    }
  }
  throw new Error('FRIEND_CODE_BUSY');
}

const fail = (code, message) => Object.assign(new Error(message || code), { code });
const cleanCode = (raw) => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const FIELDS = 'email friendCode streak xpWeek xpWeekly friends requestsIn requestsOut following createdAt';

/** Một hàng người học gửi xuống client: persona + chuỗi + XP tuần + mã (để mở hồ sơ). Không có email. */
function row(doc, week, day, personas, myEmail) {
  const persona = personas.get(doc.email);
  return {
    code: doc.friendCode || '',
    name: persona?.nickname || '',
    avatar: persona?.avatar || null,
    streak: streakView(doc.streak, day).count,
    xp: doc.xpWeek === week ? doc.xpWeekly || 0 : 0,
    me: doc.email === myEmail,
  };
}

/**
 * Người học cũ "theo dõi" một chiều (trước khi có duyệt): chuyển thành lời mời đang chờ,
 * để người kia tự quyết. Chạy một lần khi mở mục bạn bè.
 */
async function migrateFollowing(me) {
  if (!me.following?.length) return me;
  const targets = await EduLearner.find({ friendCode: { $in: me.following } }).select('email friendCode').lean();
  for (const target of targets) {
    if (target.email === me.email) continue;
    await EduLearner.updateOne({ _id: target._id }, { $addToSet: { requestsIn: me.friendCode } });
  }
  await EduLearner.updateOne({ _id: me._id }, { $addToSet: { requestsOut: { $each: targets.map((t) => t.friendCode) } }, $set: { following: [] } });
  return EduLearner.findById(me._id).select(FIELDS).lean();
}

async function meDoc(email) {
  const doc = await EduLearner.findOneAndUpdate({ email }, { $setOnInsert: { email } }, { upsert: true, new: true }).select(FIELDS).lean();
  const code = await ensureCode(doc);
  return migrateFollowing({ ...doc, friendCode: code });
}

export async function eduSocial(email) {
  const { day } = vnClock();
  const week = weekOf(day);
  const me = await meDoc(email);
  const codes = [...new Set([...(me.friends || []), ...(me.requestsIn || []), ...(me.requestsOut || [])])];
  const [people, topDocs] = await Promise.all([
    codes.length ? EduLearner.find({ friendCode: { $in: codes } }).select(FIELDS).lean() : [],
    // ponytail: lấy dư 4 lần rồi lọc ai có biệt danh — đủ khi đa số người học đã qua màn Persona bắt buộc.
    EduLearner.find({ xpWeek: week, xpWeekly: { $gt: 0 } }).sort({ xpWeekly: -1 }).limit(LEAGUE_SIZE * 4).select(FIELDS).lean(),
  ]);
  const personas = await PersonaService.forEmails([...new Set([email, ...people, ...topDocs].map((d) => d.email || d))]);
  const byCode = new Map(people.map((d) => [d.friendCode, d]));
  const list = (arr) => (arr || []).map((c) => byCode.get(c)).filter(Boolean).map((d) => row(d, week, day, personas, email));
  const mine = row(me, week, day, personas, email);
  const leagueDocs = topDocs.filter((d) => personas.get(d.email)?.nickname).slice(0, LEAGUE_SIZE);
  const league = leagueDocs.map((d) => row(d, week, day, personas, email));
  if (mine.name && !league.some((r) => r.me)) league.push(mine);
  league.sort((a, b) => b.xp - a.xp || b.streak - a.streak);
  const friends = [mine, ...list(me.friends)].sort((a, b) => b.xp - a.xp || b.streak - a.streak);
  return { code: me.friendCode, week, me: mine, league, friends, requestsIn: list(me.requestsIn), requestsOut: list(me.requestsOut) };
}

/** Tìm người học theo đúng mã, đúng email, hoặc tiền tố biệt danh. Trả hàng công khai (không email). */
export async function searchLearners(email, rawQuery) {
  const q = String(rawQuery || '').trim().slice(0, 60);
  if (q.length < 2) return [];
  const { day } = vnClock();
  const week = weekOf(day);
  let emails = [];
  const code = cleanCode(q);
  if (/^[A-Z0-9]{6}$/.test(code)) {
    const byCode = await EduLearner.findOne({ friendCode: code }).select('email').lean();
    if (byCode) emails.push(byCode.email);
  }
  if (q.includes('@')) {
    // Chỉ khớp ĐÚNG email (không gợi ý email gần giống — tránh dò danh sách tài khoản).
    const exact = q.toLowerCase();
    if (await EduLearner.exists({ email: exact })) emails.push(exact);
  } else {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hits = await Persona.find({ nickname: { $regex: `^${escaped}`, $options: 'i' } }).select('email').limit(20).lean();
    emails.push(...hits.map((h) => h.email));
  }
  emails = [...new Set(emails)].filter((e) => e !== email);
  if (!emails.length) return [];
  const [docs, personas] = await Promise.all([
    EduLearner.find({ email: { $in: emails }, friendCode: { $type: 'string' } }).select(FIELDS).limit(20).lean(),
    PersonaService.forEmails(emails),
  ]);
  return docs.filter((d) => personas.get(d.email)?.nickname).slice(0, 10).map((d) => row(d, week, day, personas, email));
}

/** Hồ sơ công khai theo mã bạn: persona, lời giới thiệu, chuỗi, XP, tiến độ từng chặng, quan hệ với mình. */
export async function learnerProfile(email, rawCode) {
  const code = cleanCode(rawCode);
  const target = await EduLearner.findOne({ friendCode: code }).select(FIELDS).lean();
  if (!target) throw fail('NOT_FOUND');
  const persona = await Persona.findOne({ email: target.email }).select('nickname avatar intro createdAt').lean();
  if (!persona?.nickname) throw fail('NOT_FOUND');
  const me = await meDoc(email);
  const bio = await Bio.findOne({ email: target.email }).select('completedLessons').lean();
  const done = new Set(bio?.completedLessons || []);
  const { day } = vnClock();
  const relation = target.email === email ? 'self'
    : (me.friends || []).includes(code) ? 'friend'
      : (me.requestsIn || []).includes(code) ? 'in'
        : (me.requestsOut || []).includes(code) ? 'out' : 'none';
  return {
    code,
    name: persona.nickname,
    avatar: persona.avatar || null,
    intro: persona.intro || '',
    joined: persona.createdAt || target.createdAt || null,
    streak: streakView(target.streak, day).count,
    xp: target.xpWeek === weekOf(day) ? target.xpWeekly || 0 : 0,
    friends: (target.friends || []).length,
    steps: STAGES.reduce((sum, s) => sum + Array.from({ length: s.to - s.from }, (_, i) => `step${s.from + i + 1}`).filter((id) => done.has(id)).length, 0),
    stages: STAGES.map((s) => ({ code: s.code, total: s.to - s.from, done: Array.from({ length: s.to - s.from }, (_, i) => `step${s.from + i + 1}`).filter((id) => done.has(id)).length })),
    relation,
  };
}

async function notifyName(email) {
  return (await PersonaService.get(email)).nickname || 'Hugo learner';
}

/** Gửi lời mời. Người kia đã mời mình trước → thành bạn luôn. */
export async function requestFriend(email, rawCode) {
  const code = cleanCode(rawCode);
  if (!/^[A-Z0-9]{6}$/.test(code)) throw fail('BAD_CODE', 'Mã bạn gồm 6 ký tự.');
  const me = await meDoc(email);
  if (code === me.friendCode) throw fail('SELF', 'Đây là mã của bạn.');
  const target = await EduLearner.findOne({ friendCode: code }).select('email requestsIn friends').lean();
  if (!target) throw fail('NOT_FOUND', 'Không tìm thấy mã này.');
  if ((me.friends || []).includes(code)) return;
  if ((me.requestsIn || []).includes(code)) return respondFriend(email, code, true);
  if ((me.friends || []).length >= MAX_FRIENDS) throw fail('TOO_MANY', `Tối đa ${MAX_FRIENDS} bạn.`);
  if ((target.requestsIn || []).length >= MAX_PENDING) throw fail('TOO_MANY', 'Người này đang có quá nhiều lời mời.');
  await EduLearner.updateOne({ _id: me._id }, { $addToSet: { requestsOut: code } });
  const added = await EduLearner.updateOne({ _id: target._id }, { $addToSet: { requestsIn: me.friendCode } });
  if (added.modifiedCount) {
    const name = await notifyName(email);
    sendEduPush(target.email, { key: 'friendRequest', vars: { name }, url: '/friends', tag: 'edu-friend' }).catch(() => {});
  }
}

/** Chấp thuận / từ chối lời mời đang chờ. */
export async function respondFriend(email, rawCode, accept) {
  const code = cleanCode(rawCode);
  const me = await meDoc(email);
  if (!(me.requestsIn || []).includes(code)) throw fail('NO_REQUEST', 'Không có lời mời này.');
  const target = await EduLearner.findOne({ friendCode: code }).select('email').lean();
  await EduLearner.updateOne({ _id: me._id }, { $pull: { requestsIn: code }, ...(accept && target ? { $addToSet: { friends: code } } : {}) });
  if (!target) return;
  await EduLearner.updateOne({ _id: target._id }, { $pull: { requestsOut: me.friendCode }, ...(accept ? { $addToSet: { friends: me.friendCode } } : {}) });
  if (accept) {
    const name = await notifyName(email);
    sendEduPush(target.email, { key: 'friendAccepted', vars: { name }, url: '/friends', tag: 'edu-friend' }).catch(() => {});
  }
}

/** Huỷ kết bạn hoặc rút lời mời đã gửi — gỡ cả hai phía. */
export async function removeFriend(email, rawCode) {
  const code = cleanCode(rawCode);
  const me = await meDoc(email);
  await EduLearner.updateOne({ _id: me._id }, { $pull: { friends: code, requestsOut: code } });
  await EduLearner.updateOne({ friendCode: code }, { $pull: { friends: me.friendCode, requestsIn: me.friendCode } });
}

export const REPORT_REASONS = ['nickname', 'avatar', 'intro', 'harassment', 'cheating', 'other'];
const esc = (text) => String(text || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** Báo cáo một người học. Mỗi người chỉ có MỘT báo cáo đang chờ cho cùng một người (gửi lại = cập nhật). */
export async function reportLearner(email, rawCode, { reason, note } = {}) {
  if (!REPORT_REASONS.includes(reason)) throw fail('BAD_REASON', 'Chọn một lý do.');
  const code = cleanCode(rawCode);
  const target = await EduLearner.findOne({ friendCode: code }).select('email').lean();
  if (!target) throw fail('NOT_FOUND', 'Không tìm thấy người này.');
  if (target.email === email) throw fail('SELF', 'Không thể báo cáo chính mình.');
  const persona = await Persona.findOne({ email: target.email }).select('nickname intro').lean();
  const clean = String(note || '').replace(/\s+/g, ' ').trim().slice(0, 500); // gộp xuống dòng/tab; Telegram đã thoát HTML
  const filter = { reporterEmail: email, targetEmail: target.email, status: 'pending' };
  const existed = await UserReport.exists(filter);
  await UserReport.updateOne(filter, { $set: { targetCode: code, reason, note: clean, snapshot: { nickname: persona?.nickname || '', intro: persona?.intro || '' } } }, { upsert: true });
  if (!existed) {
    const open = await UserReport.countDocuments({ targetEmail: target.email, status: 'pending' });
    sendTelegramAlert(`<b>Báo cáo người dùng (Education Hugo)</b>\nMã: <code>${code}</code> · biệt danh: ${esc(persona?.nickname)}\nLý do: ${reason}${clean ? `\nGhi chú: ${esc(clean)}` : ''}\nĐang có ${open} báo cáo chờ xử lý cho người này.`).catch(() => {});
  }
}
