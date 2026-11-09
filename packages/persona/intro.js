// Lời giới thiệu ngắn trên hồ sơ công khai (Persona). Chữ thường, tối đa INTRO_MAX ký tự;
// bỏ ký tự điều khiển và ký tự đảo chiều (giả mạo hướng chữ). Rỗng = xoá lời giới thiệu.
export const INTRO_MAX = 160;
// eslint-disable-next-line no-control-regex -- chặn ký tự điều khiển là chủ đích
const BAD = /[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

export function checkIntro(raw) {
  if (typeof raw !== 'string') return { ok: false, code: 'INTRO_BAD' };
  const value = raw.replace(BAD, '').replace(/\s+/g, ' ').trim();
  if ([...value].length > INTRO_MAX) return { ok: false, code: 'INTRO_LONG' };
  return { ok: true, value };
}
