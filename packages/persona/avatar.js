// Nhân vật đại diện Persona: pixel-art DiceBear "Pixel Art" (CC0 1.0), dùng chung mọi web/app.
// Máy chủ chỉ lưu LỰA CHỌN (mỗi bộ phận một mã trong danh sách dưới), không lưu SVG —
// client tự vẽ bằng @dicebear/core. Mọi giá trị ngoài danh sách đều bị từ chối.
const seq = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`);

export const AVATAR_PARTS = {
  hair: [...seq('short', 24), ...seq('long', 21)],
  eyes: seq('variant', 12),
  mouth: [...seq('happy', 13), ...seq('sad', 10)],
  clothes: seq('variant', 23),
  glasses: ['none', ...seq('dark', 7), ...seq('light', 7)],
  hat: ['none', ...seq('variant', 10)],
  beard: ['none', ...seq('variant', 8)],
  accessories: ['none', ...seq('variant', 4)],
};

export const AVATAR_COLORS = {
  skin: ['#ffdbac', '#f5cfa0', '#eac393', '#e0b687', '#cb9e6e', '#b68655', '#a26d3d', '#8d5524'],
  hair: ['#28150a', '#603a14', '#83623b', '#a78961', '#cab188', '#611c17', '#bd1700', '#009bbd', '#91cb15', '#7e57c2', '#f48fb1'],
  clothing: ['#5bc0de', '#428bca', '#03396c', '#88d8b0', '#44c585', '#00b159', '#ff6f69', '#d11141', '#ae0001', '#ffeead', '#ffd969', '#ffc425'],
  background: ['#dbeafe', '#dcfce7', '#fef3c7', '#fde2e4', '#ede9fe', '#e0f2fe', '#f1f5f9'],
};

/** Lấy đúng các khoá đã biết, mọi giá trị phải nằm trong danh sách. */
export function checkAvatar(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, code: 'AVATAR_BAD' };
  const value = {};
  for (const [part, options] of Object.entries(AVATAR_PARTS)) {
    if (!options.includes(raw[part])) return { ok: false, code: 'AVATAR_BAD' };
    value[part] = raw[part];
  }
  for (const [part, options] of Object.entries(AVATAR_COLORS)) {
    if (!options.includes(raw[`${part}Color`])) return { ok: false, code: 'AVATAR_BAD' };
    value[`${part}Color`] = raw[`${part}Color`];
  }
  return { ok: true, value };
}

/** Nhân vật ngẫu nhiên để bắt đầu chỉnh (phụ kiện để trống). */
export function randomAvatar(rand = Math.random) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const value = {};
  for (const [part, options] of Object.entries(AVATAR_PARTS)) value[part] = options[0] === 'none' ? 'none' : pick(options);
  for (const [part, options] of Object.entries(AVATAR_COLORS)) value[`${part}Color`] = pick(options);
  value.mouth = pick(AVATAR_PARTS.mouth.slice(0, 13));
  return value;
}
