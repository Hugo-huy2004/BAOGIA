import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Get secret key or use a fallback for local development
if (!process.env.SECRET_KEY) {
  dotenv.config();
}
const isProduction = process.env.NODE_ENV === 'production';
let rawSecret = process.env.SECRET_KEY;
if (!rawSecret || !rawSecret.trim()) {
  if (isProduction) {
    console.error('❌ FATAL: SECRET_KEY is not set. Refusing to start in production with an insecure default.');
    process.exit(1);
  } else {
    console.warn('⚠️  SECRET_KEY not set — using an insecure dev-only fallback. Never deploy like this.');
    rawSecret = 'HugoStudio_SuperSecretKey_2026';
  }
}

// Keep the old key derivation for CBC backward compatibility
const ENCRYPTION_KEY_CBC = crypto.scryptSync(rawSecret.trim(), 'salt', 32);

// New key derivation for GCM with a more secure salt
const GCM_SALT = process.env.CRYPTO_SALT || 'hugo_studio_secure_salt_2026';
const ENCRYPTION_KEY_GCM = crypto.scryptSync(rawSecret.trim(), GCM_SALT, 32);

// Fallback keys for backward compatibility with dev-only fallback secrets
const FALLBACK_SECRET = 'HugoStudio_SuperSecretKey_2026';
const FALLBACK_KEY_CBC = crypto.scryptSync(FALLBACK_SECRET, 'salt', 32);
const FALLBACK_KEY_GCM = crypto.scryptSync(FALLBACK_SECRET, GCM_SALT, 32);

const IV_LENGTH_GCM = 12;

export const encryptText = (text) => {
  if (!text) return text;
  // If it's already encrypted (starts with 'enc:'), skip
  if (text.startsWith('enc:')) return text;

  let iv = crypto.randomBytes(IV_LENGTH_GCM);
  let cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY_GCM, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  let tag = cipher.getAuthTag().toString('hex');

  // Format: enc:gcm:<iv_hex>:<tag_hex>:<ciphertext_hex>
  return 'enc:gcm:' + iv.toString('hex') + ':' + tag + ':' + encrypted;
};

export const decryptText = (text) => {
  if (!text) return text;
  // If it's not encrypted, return as is
  if (!text.startsWith('enc:')) return text;

  let textParts = text.split(':');
  
  // New AES-256-GCM format
  if (textParts[1] === 'gcm') {
    if (textParts.length !== 5) return text; // invalid GCM format
    try {
      let iv = Buffer.from(textParts[2], 'hex');
      let tag = Buffer.from(textParts[3], 'hex');
      let encryptedText = Buffer.from(textParts[4], 'hex');
      let decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY_GCM, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      // Retry GCM decryption using the fallback key
      try {
        let iv = Buffer.from(textParts[2], 'hex');
        let tag = Buffer.from(textParts[3], 'hex');
        let encryptedText = Buffer.from(textParts[4], 'hex');
        let decipher = crypto.createDecipheriv('aes-256-gcm', FALLBACK_KEY_GCM, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (fallbackErr) {
        console.error('Failed to decrypt GCM ciphertext with both keys:', fallbackErr.message);
        return text;
      }
    }
  }

  // Fallback to old AES-256-CBC format
  if (textParts.length !== 3) return text; // invalid CBC format
  try {
    let iv = Buffer.from(textParts[1], 'hex');
    let encryptedText = Buffer.from(textParts[2], 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY_CBC, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // Retry CBC decryption using the fallback key
    try {
      let iv = Buffer.from(textParts[1], 'hex');
      let encryptedText = Buffer.from(textParts[2], 'hex');
      let decipher = crypto.createDecipheriv('aes-256-cbc', FALLBACK_KEY_CBC, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (fallbackErr) {
      console.error('Failed to decrypt legacy CBC ciphertext with both keys:', fallbackErr.message);
      return text;
    }
  }
};

export const hashPassword = async (password) => {
  if (!password) return password;
  // If it's already a bcrypt hash (starts with $2a$ or $2b$), skip
  if (password.startsWith('$2a$') || password.startsWith('$2b$')) return password;
  
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  // Fallback for old plain text passwords
  if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
    return plainPassword === hashedPassword;
  }
  return await bcrypt.compare(plainPassword, hashedPassword);
};
