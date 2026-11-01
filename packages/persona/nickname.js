// Biệt danh Persona — dùng chung cho mọi web/app thuộc và ngoài Hugo Studio.
// Chỉ CHỮ (mọi ngôn ngữ, có dấu) và EMOJI, cách nhau bằng một khoảng trắng.
// Cấm số, dấu câu, ký hiệu, ký tự điều khiển/vô hình. Máy chủ và giao diện dùng chung.
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

// Một "chữ" = chữ cái + dấu kết hợp; một emoji = ký tự hình + biến thể/ZWJ/màu da/cờ.
const EMOJI = String.raw`(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\u{FE0F}|\p{Emoji_Modifier}|\u{200D}(?:\p{Extended_Pictographic}|♀|♂)\u{FE0F}?)*`;
const UNIT = String.raw`(?:\p{L}\p{M}*|${EMOJI})+`;
const SHAPE = new RegExp(`^${UNIT}(?: ${UNIT})*$`, 'u');

/** Chuẩn hoá (NFC, gộp khoảng trắng) rồi kiểm. Trả { ok, value } hoặc { ok: false, code }. */
export function checkNickname(raw) {
  const value = String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const length = [...value].length;
  if (length < NICKNAME_MIN || length > NICKNAME_MAX) return { ok: false, code: 'NICK_LENGTH' };
  if (!SHAPE.test(value)) return { ok: false, code: 'NICK_CHARS' };
  return { ok: true, value };
}
