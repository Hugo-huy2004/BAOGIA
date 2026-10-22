import { createHmac } from 'node:crypto';
import DeletedMemberAccount from '../models/DeletedMemberAccount.js';

export const hashMemberEmail = (email) => createHmac(
  'sha256',
  process.env.JWT_SECRET || 'development-only-deleted-member-key',
).update(String(email || '').trim().toLowerCase()).digest('hex');

export const isDeletedMemberAccount = async (email) =>
  Boolean(await DeletedMemberAccount.exists({ emailHash: hashMemberEmail(email) }));
