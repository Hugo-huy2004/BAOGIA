import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Get secret key or use a fallback for local development
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

const ENCRYPTION_KEY = crypto.scryptSync(rawSecret.trim(), 'salt', 32);
const IV_LENGTH = 16; 

export const encryptText = (text) => {
  if (!text) return text;
  // If it's already encrypted (starts with 'enc:'), skip
  if (text.startsWith('enc:')) return text;

  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return 'enc:' + iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decryptText = (text) => {
  if (!text) return text;
  // If it's not encrypted, return as is
  if (!text.startsWith('enc:')) return text;

  let textParts = text.split(':');
  if (textParts.length !== 3) return text; // invalid format
  
  let iv = Buffer.from(textParts[1], 'hex');
  let encryptedText = Buffer.from(textParts[2], 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
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
