import Bio from '../models/Bio.js';

const CODE_PREFIX = 'HG';
const RANDOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function normalizePhoneToCode(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 6) return null;
  return CODE_PREFIX + digits.slice(-6);
}

function randomSuffix() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
  }
  return s;
}

function randomCode() {
  return CODE_PREFIX + randomSuffix();
}

async function generateUniqueReferralCode(bio) {
  const phoneCode = normalizePhoneToCode(bio.phone);
  if (phoneCode) {
    const taken = await Bio.exists({ referralCode: phoneCode });
    if (!taken) return phoneCode;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomCode();
    const taken = await Bio.exists({ referralCode: candidate });
    if (!taken) return candidate;
  }
  throw new Error('REFERRAL_CODE_GENERATION_FAILED');
}

/**
 * Generates a fixed referral code once, permanently — never regenerated
 * afterward even if the user's phone number changes later.
 */
export async function ensureReferralCode(bio) {
  if (bio.referralCode) return bio.referralCode;
  bio.referralCode = await generateUniqueReferralCode(bio);
  await bio.save({ validateModifiedOnly: true });
  return bio.referralCode;
}
