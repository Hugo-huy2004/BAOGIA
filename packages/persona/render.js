// Vẽ nhân vật Persona thành SVG bằng DiceBear (chỉ phía trình duyệt; máy chủ không vẽ).
// Tách khỏi index.js để web không cần nhân vật thì không kéo DiceBear (~50 KB) vào bundle.
import { Avatar, Style } from '@dicebear/core';
import definition from '@dicebear/styles/pixel-art.json' with { type: 'json' };

const style = new Style(definition);

/** avatar = giá trị đã qua checkAvatar. Trả chuỗi SVG. */
export function avatarSvg(avatar, size = 96) {
  const options = { seed: 'persona', size };
  for (const part of ['hair', 'eyes', 'mouth', 'clothes', 'glasses', 'hat', 'beard', 'accessories']) {
    const variant = avatar[part];
    options[`${part}Probability`] = variant === 'none' ? 0 : 100;
    if (variant !== 'none') options[`${part}Variant`] = [variant];
  }
  for (const color of ['skin', 'hair', 'clothing', 'background']) options[`${color}Color`] = [avatar[`${color}Color`].slice(1)];
  return new Avatar(style, options).toString();
}

export const avatarDataUri = (avatar, size) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(avatar, size))}`;
