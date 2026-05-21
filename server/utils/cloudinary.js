import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

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

/**
 * Uploads base64 avatar to Cloudinary and deletes old avatar if specified
 * @param {string} base64Str - The base64 Data URL (e.g. "data:image/webp;base64,...")
 * @param {string} email - The user email for public ID naming
 * @param {string} [oldAvatarUrl] - The existing avatar URL to destroy
 * @returns {Promise<string>} - The new secure URL from Cloudinary
 */
export const uploadAvatar = async (base64Str, email, oldAvatarUrl = '') => {
  const isConfigured = process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please set environment variables.');
  }

  // 1. Delete the old avatar from Cloudinary first if it exists
  if (oldAvatarUrl) {
    const oldPublicId = getPublicIdFromUrl(oldAvatarUrl);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log(`Deleted old avatar on Cloudinary: ${oldPublicId}`);
      } catch (err) {
        console.error('Failed to delete old avatar on Cloudinary:', err);
      }
    }
  }

  // 2. Format a safe email string for folder/public_id naming
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const folderPath = 'hugo_wishpax/avatars';
  const publicId = `avatar_${cleanEmail}_${Date.now()}`;

  // 3. Upload the new base64 image
  const uploadResponse = await cloudinary.uploader.upload(base64Str, {
    folder: folderPath,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    format: 'auto',
    quality: 'auto'
  });

  return uploadResponse.secure_url;
};

export const deleteAvatar = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image on Cloudinary: ${publicId}`);
    return true;
  } catch (err) {
    console.error('Failed to delete image on Cloudinary:', err);
    return false;
  }
};

export const uploadAdImage = async (base64Str, oldUrl = '') => {
  const isConfigured = process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  if (!isConfigured) {
    throw new Error('Cloudinary is not configured.');
  }

  if (oldUrl) {
    const oldPublicId = getPublicIdFromUrl(oldUrl);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {}
    }
  }

  const folderPath = 'hugo_wishpax/ads';
  const publicId = `ad_${Date.now()}`;

  const uploadResponse = await cloudinary.uploader.upload(base64Str, {
    folder: folderPath,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    format: 'auto',
    quality: 'auto'
  });

  return uploadResponse.secure_url;
};

export default {
  uploadAvatar,
  deleteAvatar,
  getPublicIdFromUrl,
  uploadAdImage
};
