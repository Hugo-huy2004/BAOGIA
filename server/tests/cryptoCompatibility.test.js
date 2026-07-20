import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { encryptText, decryptText } from '../utils/cryptoUtils.js';

describe('cryptoUtils GCM Upgrade & CBC Compatibility', () => {
  it('successfully round-trips using new GCM encryption and decryption', () => {
    const originalText = 'HugoStudio_TopSecret_Message_2026';
    const encrypted = encryptText(originalText);
    
    expect(encrypted.startsWith('enc:gcm:')).toBe(true);
    
    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('correctly decrypts legacy CBC encrypted data', () => {
    const rawSecret = process.env.SECRET_KEY || 'HugoStudio_SuperSecretKey_2026';
    const keyCbc = crypto.scryptSync(rawSecret.trim(), 'salt', 32);
    
    const plainText = 'Legacy_Secret_Data_12345';
    
    // Manually create legacy CBC encrypted string
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyCbc, iv);
    let encrypted = cipher.update(plainText);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const legacyEncryptedString = 'enc:' + iv.toString('hex') + ':' + encrypted.toString('hex');
    
    // Verify our decryptText handles it seamlessly
    const decrypted = decryptText(legacyEncryptedString);
    expect(decrypted).toBe(plainText);
  });

  it('returns plain text if input does not start with enc:', () => {
    const plainText = 'Not encrypted';
    expect(decryptText(plainText)).toBe(plainText);
    expect(decryptText('')).toBe('');
    expect(decryptText(null)).toBeNull();
  });
});
