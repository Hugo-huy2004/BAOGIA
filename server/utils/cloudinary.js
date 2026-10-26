import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { compressDataUrl, IMAGE_PRESETS } from './imageCompress.js';

dotenv.config();

// Config Cloudinary
const isConfigured = process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  console.log('☁️ Cloudinary configuration loaded successfully.');
  
  // Explicitly set config to avoid dotenv timing issues with ES module imports
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
  });
} else {
  console.warn('Warning: Cloudinary configuration is missing credentials in .env!');
}

/**
 * Extracts public_id from Cloudinary URL
 * @param {string} url 
 * @returns {string|null}
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const afterUpload = parts[1];
    // Remove version segment (e.g. v12345678/)
    const cleanPath = afterUpload.replace(/^v\d+\//, '');
    // Remove extension (.jpg, .png, etc)
    const publicId = cleanPath.substring(0, cleanPath.lastIndexOf('.')) || cleanPath;
    return publicId;
  } catch (error) {
    console.error('Error parsing Cloudinary public ID:', error);
    return null;
  }
};

const configured = () => Boolean(process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));

/**
 * Xoá HẲN một ảnh: `invalidate` để CDN của Cloudinary bỏ cả bản cache, không chỉ
 * bản gốc. Trả false khi URL không phải ảnh của mình hoặc xoá hỏng.
 */
export const deleteAvatar = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return result?.result === 'ok' || result?.result === 'not found';
  } catch (err) {
    console.error('Failed to delete image on Cloudinary:', err);
    return false;
  }
};

// Một cửa cho mọi upload: nén → tải bản MỚI lên → xong mới xoá bản cũ. Làm ngược
// lại (xoá trước) thì upload hỏng là người dùng mất luôn ảnh đang có.
async function uploadImage(base64Str, { folder, publicId, preset, oldUrl = '', tags }) {
  if (!configured()) throw new Error('Cloudinary is not configured.');
  const uploadResponse = await cloudinary.uploader.upload(await compressDataUrl(base64Str, preset), {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    ...(tags ? { tags } : {}),
  });
  if (oldUrl && oldUrl !== uploadResponse.secure_url) await deleteAvatar(oldUrl);
  return uploadResponse.secure_url;
}

export const uploadAvatar = (base64Str, email, oldAvatarUrl = '') => uploadImage(base64Str, {
  folder: 'hugo_wishpax/avatars',
  publicId: `avatar_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}`,
  preset: IMAGE_PRESETS.avatar,
  oldUrl: oldAvatarUrl,
});

export const uploadAdImage = (base64Str, oldUrl = '') => uploadImage(base64Str, {
  folder: 'hugo_wishpax/ads',
  publicId: `ad_${Date.now()}`,
  preset: IMAGE_PRESETS.content,
  oldUrl,
});

// Ảnh kháng nghị mở khoá (selfie người dùng TỰ NGUYỆN gửi). Xoá ngay khi có quyết
// định hoặc trước khi đơn hết hạn — xem purgeSecurityAppeal.
export const uploadAppealImage = (base64Str) => uploadImage(base64Str, {
  folder: 'hugo_wishpax/appeals',
  publicId: `appeal_${Date.now()}`,
  preset: IMAGE_PRESETS.content,
  tags: ['appeal'],
});

export const uploadProductImage = (base64Str, oldUrl = '') => uploadImage(base64Str, {
  folder: 'hugo_wishpax/utility_store',
  publicId: `product_${Date.now()}`,
  preset: IMAGE_PRESETS.content,
  oldUrl,
});

export default {
  uploadAvatar,
  deleteAvatar,
  getPublicIdFromUrl,
  uploadAdImage,
  uploadProductImage
};
