import crypto from 'crypto';
import { JWT_SECRET } from './secrets.js';

// Derive a 256-bit encryption key from JWT_SECRET + system hardware salt
const MASTER_KEY = crypto.pbkdf2Sync(
  JWT_SECRET || 'fallback-master-secret-key-2026',
  'PRICE_DOC_DATABASE_SEAL_SALT_v1',
  100000,
  32,
  'sha256'
);

const ALGORITHM = 'aes-256-gcm';
const PREFIX = '$enc$a256gcm$v1$';

/**
 * Encrypts sensitive plain text string into an unreadable cipher string.
 * Result format: $enc$a256gcm$v1$<iv_hex>:$authTag_hex>:$ciphertext_hex>
 */
export function sealField(plainText) {
  if (plainText === null || plainText === undefined) return plainText;
  const str = String(plainText);
  if (str.startsWith(PREFIX)) return str; // Already sealed

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a sealed cipher string back to original plain text.
 */
export function unsealField(cipherText) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  try {
    const raw = cipherText.slice(PREFIX.length);
    const [ivHex, authTagHex, encryptedHex] = raw.split(':');
    
    if (!ivHex || !authTagHex || !encryptedHex) return cipherText;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return original if decryption fails
    return cipherText;
  }
}

/**
 * Deep seals an entire object or database record before export/dump.
 * All strings inside object fields become encrypted ciphertext.
 */
export function sealObjectData(obj, sensitiveKeys = ['phone', 'address', 'identity', 'notes', 'ipAddress']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sealObjectData(item, sensitiveKeys));
  }

  const sealed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && (sensitiveKeys.includes(key) || key.toLowerCase().includes('phone') || key.toLowerCase().includes('address'))) {
      sealed[key] = sealField(value);
    } else if (typeof value === 'object' && value !== null) {
      sealed[key] = sealObjectData(value, sensitiveKeys);
    } else {
      sealed[key] = value;
    }
  }
  return sealed;
}

export default { sealField, unsealField, sealObjectData };
