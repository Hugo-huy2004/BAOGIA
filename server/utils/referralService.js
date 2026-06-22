import Bio from '../models/Bio.js';
import { awardJoy } from './joyService.js';

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
  await bio.save();
  return bio.referralCode;
}

/**
 * Applies a referral code to a referee Bio. Shared by both
 * POST /api/referral/apply and POST /api/bios/me/onboarding.
 * Returns { success, joyAwarded, bioExtendedDays } or throws an Error
 * with a user-facing Vietnamese message.
 */
export async function applyReferral(bio, referrerCodeRaw) {
  let referrerCode = String(referrerCodeRaw || '').trim();
  // Accept either the raw HG code or a full shared URL such as /login?ref=HGxxxxxx.
  // The previous UI copied the full URL while this service only accepted raw
  // codes, which made a normal copy/paste flow fail as "invalid".
  if (referrerCode.includes('?') || referrerCode.includes('://')) {
    try {
      const parsed = new URL(referrerCode, 'https://hugowishpax.local');
      referrerCode = parsed.searchParams.get('ref') || referrerCode;
    } catch (_) {}
  }
  referrerCode = referrerCode.toUpperCase().replace(/\s+/g, '');
  if (!referrerCode) throw new Error('Mã giới thiệu không hợp lệ.');

  if (bio.referralApplied) {
    throw new Error('Mã giới thiệu đã được áp dụng trước đó.');
  }

  const referrer = await Bio.findOne({ referralCode: referrerCode });
  if (!referrer) {
    throw new Error('Mã giới thiệu không hợp lệ.');
  }
  if (referrer.email === bio.email) {
    throw new Error('Không thể tự giới thiệu chính mình.');
  }

  // Referee: +10 JOY, +15 days Bio Link
  let expires = new Date(bio.expiresAt);
  if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
    expires = new Date();
  }
  expires.setDate(expires.getDate() + 15);
  bio.expiresAt = expires;
  bio.referralApplied = true;
  bio.referredBy = referrer.email;

  bio.history.push({
    type: 'referral_bonus',
    icon: 'card_giftcard',
    title: 'Nhận quà giới thiệu',
    detail: '+30 JOY và +15 ngày Bio Link nhờ mã giới thiệu',
    timestamp: new Date()
  });
  if (bio.history.length > 50) {
    bio.history = bio.history.slice(bio.history.length - 50);
  }

  // Base rewards x3.
  await awardJoy(
    bio.email,
    30,
    'referral_referee',
    'Bạn nhận được 30 JOY và +15 ngày Bio Link từ mã giới thiệu',
    { bioDoc: bio }
  );

  // Referrer: +150 JOY
  referrer.referralCount += 1;
  await awardJoy(
    referrer.email,
    150,
    'referral_referrer',
    `${bio.displayName} đã sử dụng mã giới thiệu của bạn`,
    { bioDoc: referrer }
  );

  return { success: true, joyAwarded: 30, bioExtendedDays: 15 };
}
