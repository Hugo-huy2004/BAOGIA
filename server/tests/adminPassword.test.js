import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { verifyAndUpgrade, isBcrypt } from '../routes/adminRoutes.js';

const sha256 = (m) => crypto.createHash('sha256').update(m).digest('hex');

// Fake Mongoose doc: records whether save() ran.
const fakeAdmin = (password) => ({ password, saved: false, async save() { this.saved = true; } });

describe('admin password verifyAndUpgrade', () => {
  it('accepts a correct legacy SHA-256 password AND upgrades it to bcrypt', async () => {
    const admin = fakeAdmin(sha256('correct horse'));
    const ok = await verifyAndUpgrade(admin, 'correct horse');
    expect(ok).toBe(true);
    expect(isBcrypt(admin.password)).toBe(true); // rehashed
    expect(admin.saved).toBe(true);
  });

  it('rejects a wrong legacy password and does not touch the hash', async () => {
    const original = sha256('correct horse');
    const admin = fakeAdmin(original);
    const ok = await verifyAndUpgrade(admin, 'wrong');
    expect(ok).toBe(false);
    expect(admin.password).toBe(original);
    expect(admin.saved).toBe(false);
  });

  it('verifies a bcrypt password without re-saving', async () => {
    const admin = fakeAdmin(await bcrypt.hash('s3cret', 12));
    expect(await verifyAndUpgrade(admin, 's3cret')).toBe(true);
    expect(await verifyAndUpgrade(admin, 'nope')).toBe(false);
    expect(admin.saved).toBe(false);
  });

  it('does not crash on an empty/missing stored hash', async () => {
    expect(await verifyAndUpgrade(fakeAdmin(''), 'anything')).toBe(false);
    expect(await verifyAndUpgrade(fakeAdmin(undefined), 'anything')).toBe(false);
  });
});
