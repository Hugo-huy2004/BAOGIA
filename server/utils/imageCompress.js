import sharp from 'sharp';

/**
 * Nén mọi ảnh TRƯỚC khi lưu (Cloudinary hoặc Mongo). WebP chứ không phải AVIF:
 * AVIF nhỏ hơn ~20% nhưng mã hoá chậm gấp 5–10 lần, mà Render free chỉ có 0,1 CPU
 * — một loạt upload AVIF đủ làm đứng server. WebP q80 gần như không phân biệt được
 * bằng mắt và nhẹ hơn JPEG/PNG gốc 3–10 lần.
 *
 * Luôn bỏ EXIF (GPS, model máy): không lưu thứ gì ngoài điểm ảnh.
 * Không đọc được ảnh = từ chối, vì đây là ranh giới tin cậy.
 */
export const IMAGE_PRESETS = Object.freeze({
  avatar: { maxSide: 512, quality: 80 },
  content: { maxSide: 1600, quality: 80 },
  // Ảnh giấy tờ phải đọc được chữ nhỏ.
  document: { maxSide: 2048, quality: 85 },
});

const MAX_INPUT_PIXELS = 40_000_000; // chặn bom giải nén (ảnh 1MB bung thành vài GB RAM)

export async function compressImage(buffer, preset = IMAGE_PRESETS.content) {
  try {
    return await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, animated: false })
      .rotate() // xoay theo EXIF trước khi bỏ EXIF
      .resize({ width: preset.maxSide, height: preset.maxSide, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: preset.quality, effort: 4, smartSubsample: true })
      .toBuffer();
  } catch {
    const error = new Error('Ảnh không hợp lệ hoặc không đọc được.');
    error.status = 400;
    throw error;
  }
}

/** data:image/...;base64,... → data:image/webp;base64,... đã nén. */
export async function compressDataUrl(dataUrl, preset) {
  const match = /^data:image\/[\w.+-]+;base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!match) {
    const error = new Error('Dữ liệu ảnh không hợp lệ.');
    error.status = 400;
    throw error;
  }
  const out = await compressImage(Buffer.from(match[1], 'base64'), preset);
  return `data:image/webp;base64,${out.toString('base64')}`;
}
