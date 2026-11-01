// Bạn bè + thi đua tuần của Education Hugo (kiểu Duolingo).
//  - Mỗi người học có MÃ BẠN 6 ký tự; theo dõi người khác bằng mã (một chiều, như Duolingo).
//  - XP tuần chỉ cộng ở máy chủ sau khi chấm bài đạt (award-learning) — client không gửi điểm.
//  - Bảng xếp hạng chỉ lộ PERSONA (biệt danh + nhân vật pixel, modules/persona) + chuỗi + XP:
//    không tên thật, không ảnh thật, không email. Chưa có biệt danh thì không có tên trên bảng tuần.
import { randomInt } from 'node:crypto';
import EduLearner from '../models/EduLearner.js';
import { PersonaService } from '../modules/persona/PersonaService.js';
import { vnClock } from '../../../packages/shared/eduPrefs.js';
import { streakView } from '../../../packages/shared/eduStreak.js';

export const XP_PER_CORRECT = 10;  // qua step lần đầu: 10 XP mỗi câu đúng
export const XP_REVIEW = 5;        // ôn lại được tính giữ lửa: 5 XP
const MAX_FOLLOWING = 100;
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

/** Hàng hiển thị: biệt danh + chuỗi + XP tuần; bỏ email. */
function present(docs, week, day, myEmail, personas) {
  return docs.map((d) => ({
    code: d.friendCode || '',
    name: personas.get(d.email)?.nickname || '',
    avatar: personas.get(d.email)?.avatar || null,
    streak: streakView(d.streak, day).count,
    xp: d.xpWeek === week ? d.xpWeekly || 0 : 0,
    me: d.email === myEmail,
  }));
}

export async function eduSocial(email) {
  const { day } = vnClock();
  const week = weekOf(day);
  const me = await EduLearner.findOneAndUpdate({ email }, { $setOnInsert: { email } }, { upsert: true, new: true }).lean();
  const code = await ensureCode(me);
  const fields = 'email friendCode streak xpWeek xpWeekly';
  const [following, topDocs, mine] = await Promise.all([
    me.following?.length ? EduLearner.find({ friendCode: { $in: me.following } }).select(fields).lean() : [],
    // ponytail: lấy dư 4 lần rồi lọc ai có biệt danh — đủ khi đa số người học đã qua màn Persona bắt buộc.
    EduLearner.find({ xpWeek: week, xpWeekly: { $gt: 0 } }).sort({ xpWeekly: -1 }).limit(LEAGUE_SIZE * 4).select(fields).lean(),
    PersonaService.get(email),
  ]);
  const personas = await PersonaService.forEmails([...new Set([...following, ...topDocs].map((d) => d.email))]);
  personas.set(email, mine);
  const meDoc = { ...me, friendCode: code };
  const leagueDocs = topDocs.filter((d) => personas.get(d.email)?.nickname).slice(0, LEAGUE_SIZE);
  const friends = present([meDoc, ...following], week, day, email, personas).sort((a, b) => b.xp - a.xp || b.streak - a.streak);
  const league = present(leagueDocs.some((d) => d.email === email) || !mine.nickname ? leagueDocs : [...leagueDocs, meDoc], week, day, email, personas);
  league.sort((a, b) => b.xp - a.xp);
  // Mã bạn chỉ trả cho chính mình và người mình đã theo dõi (để bỏ theo dõi); bảng tuần thì không.
  return { code, week, nickname: mine.nickname, avatar: mine.avatar, friends, league: league.map(({ name, avatar, streak, xp, me: isMe }) => ({ name, avatar, streak, xp, me: isMe })) };
}

export async function followEdu(email, rawCode) {
  const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{6}$/.test(code)) throw Object.assign(new Error('Mã bạn gồm 6 ký tự.'), { code: 'BAD_CODE' });
  const target = await EduLearner.findOne({ friendCode: code }).select('email').lean();
  if (!target) throw Object.assign(new Error('Không tìm thấy mã này.'), { code: 'NOT_FOUND' });
  if (target.email === email) throw Object.assign(new Error('Đây là mã của bạn.'), { code: 'SELF' });
  const saved = await EduLearner.updateOne(
    { email, [`following.${MAX_FOLLOWING - 1}`]: { $exists: false } },
    { $addToSet: { following: code } },
  );
  if (!saved.matchedCount) throw Object.assign(new Error(`Tối đa ${MAX_FOLLOWING} bạn.`), { code: 'TOO_MANY' });
}

export async function unfollowEdu(email, rawCode) {
  await EduLearner.updateOne({ email }, { $pull: { following: String(rawCode || '').toUpperCase() } });
}

export async function setEduNickname(email, raw) {
  await PersonaService.save(email, { nickname: raw });
}
