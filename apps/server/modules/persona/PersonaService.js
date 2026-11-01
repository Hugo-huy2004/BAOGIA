import Persona from '../../models/Persona.js';
import EduLearner from '../../models/EduLearner.js';
import { checkAvatar } from '../../../../packages/persona/avatar.js';
import { checkNickname } from '../../../../packages/persona/nickname.js';

const fail = (code) => Object.assign(new Error(code), { code });
const view = (doc) => {
  const nickname = doc?.nickname || '';
  const avatar = doc?.avatar || null;
  return { nickname, avatar, complete: Boolean(nickname && avatar) };
};

/**
 * Biệt danh + nhân vật của một tài khoản. Mọi module (Edu, web khách…) đọc/ghi qua đây,
 * không chạm thẳng model Persona — đổi cách lưu sau này chỉ sửa một chỗ.
 */
export class PersonaService {
  static async get(email) {
    const doc = await Persona.findOne({ email }).lean();
    if (doc) return view(doc);
    // ponytail: biệt danh cũ đặt ở Edu trước khi có Persona — chuyển một lần khi đọc. Xoá khi hết người cũ.
    const legacy = await EduLearner.findOne({ email, nickname: { $gt: '' } }).select('nickname').lean();
    if (!legacy) return view(null);
    await Persona.updateOne({ email }, { $setOnInsert: { nickname: legacy.nickname } }, { upsert: true });
    return view(legacy);
  }

  /** Lưu phần được gửi; máy chủ kiểm lại cùng luật với client. */
  static async save(email, { nickname, avatar } = {}) {
    const set = {};
    if (nickname !== undefined) {
      const checked = checkNickname(nickname);
      if (!checked.ok) throw fail(checked.code);
      set.nickname = checked.value;
    }
    if (avatar !== undefined) {
      const checked = checkAvatar(avatar);
      if (!checked.ok) throw fail(checked.code);
      set.avatar = checked.value;
    }
    if (!Object.keys(set).length) throw fail('PERSONA_EMPTY');
    const doc = await Persona.findOneAndUpdate({ email }, { $set: set }, { upsert: true, new: true }).lean();
    return view(doc);
  }

  /** Map email → { nickname, avatar } cho bảng xếp hạng; ai chưa có thì không có trong map. */
  static async forEmails(emails) {
    const docs = await Persona.find({ email: { $in: emails } }).select('email nickname avatar').lean();
    return new Map(docs.map((d) => [d.email, { nickname: d.nickname || '', avatar: d.avatar || null }]));
  }
}
