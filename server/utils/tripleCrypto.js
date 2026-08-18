import crypto from 'crypto';
import { JWT_SECRET } from './secrets.js';

// Triple Layer Encryption Engine for Ultra-Sensitive Data (Robot Home Camera Tunnel)
const SYSTEM_SALT = crypto.createHash('sha256').update(JWT_SECRET || 'HUGO_MASTER_SECRET_2026').digest();

/**
 * 🔒 TRIPLE-LAYER ENCRYPTION PIPELINE:
 * Layer 1: SHA-512 HMAC Integrity Checksum
 * Layer 2: Base64 Obfuscation & Dynamic XOR Cipher Mutation
 * Layer 3: AES-256-GCM Hardware Encryption with Auth Tag & Salt
 */
export function encryptTriple(plainText) {
  if (!plainText) return null;

  // Layer 1: HMAC SHA-512 Checksum
  const hmac = crypto.createHmac('sha512', SYSTEM_SALT);
  hmac.update(plainText);
  const checksum = hmac.digest('hex');

  // Layer 2: XOR Cipher Mutation + Base64
  const layer2Buffer = Buffer.from(plainText, 'utf8');
  const mutatedBuffer = Buffer.alloc(layer2Buffer.length);
  for (let i = 0; i < layer2Buffer.length; i++) {
    mutatedBuffer[i] = layer2Buffer[i] ^ SYSTEM_SALT[i % SYSTEM_SALT.length];
  }
  const layer2Obfuscated = mutatedBuffer.toString('base64');

  // Layer 3: AES-256-GCM Hardware-Grade Encryption
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', SYSTEM_SALT, iv);
  
  let encrypted = cipher.update(layer2Obfuscated, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag,
    checksum,
    updatedAt: new Date()
  };
}

/**
 * 🔓 TRIPLE-LAYER DECRYPTION PIPELINE:
 * Reverse Layer 3 ➔ Reverse Layer 2 ➔ Verify Layer 1 Checksum
 */
export function decryptTriple(payload) {
  if (!payload || !payload.encryptedData || !payload.iv || !payload.authTag) {
    return null;
  }

  try {
    // Reverse Layer 3: AES-256-GCM Decrypt
    const ivBuffer = Buffer.from(payload.iv, 'hex');
    const authTagBuffer = Buffer.from(payload.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SYSTEM_SALT, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let layer2Obfuscated = decipher.update(payload.encryptedData, 'hex', 'utf8');
    layer2Obfuscated += decipher.final('utf8');

    // Reverse Layer 2: Base64 + XOR Un-mutation
    const mutatedBuffer = Buffer.from(layer2Obfuscated, 'base64');
    const plainBuffer = Buffer.alloc(mutatedBuffer.length);
    for (let i = 0; i < mutatedBuffer.length; i++) {
      plainBuffer[i] = mutatedBuffer[i] ^ SYSTEM_SALT[i % SYSTEM_SALT.length];
    }
    const plainText = plainBuffer.toString('utf8');

    // Verify Layer 1 HMAC SHA-512 Checksum
    const hmac = crypto.createHmac('sha512', SYSTEM_SALT);
    hmac.update(plainText);
    const computedChecksum = hmac.digest('hex');

    if (payload.checksum && computedChecksum !== payload.checksum) {
      console.error('🚨 Checksum mismatch in triple-layer decryption!');
      return null;
    }

    return plainText;
  } catch (err) {
    console.error('Failed triple-layer decryption:', err.message);
    return null;
  }
}
