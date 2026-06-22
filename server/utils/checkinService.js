import CheckinRecord from '../models/CheckinRecord.js';
import { awardJoy } from './joyService.js';

const DAY_MS = 86400000;

function pad2(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

/** Today as 'YYYY-MM-DD', local server time. */
export function todayStr() {
  return toDateStr(new Date());
}

export function yesterdayStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

/** Monday of the ISO week containing dateStr, as 'YYYY-MM-DD'. */
export function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const isoDay = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - isoDay);
  return toDateStr(d);
}

/** 1 (Monday) .. 7 (Sunday) */
export function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ((d.getDay() + 6) % 7) + 1;
}

// Base daily rewards x3.
export function rewardForDay(dayOfWeek) {
  if (dayOfWeek === 1) return 150;
  if (dayOfWeek === 7) return 450;
  return 240;
}

const REWARD_TABLE = [150, 240, 240, 240, 240, 240, 450];

/**
 * Claims today's check-in reward for email. Throws a user-facing Vietnamese
 * Error on: already claimed today, or locked due to a missed day this week.
 * A missed day locks the whole feature until the next weekly reset — the
 * gap-detecting claim itself is rejected (no reward), per product spec.
 */
export async function claimCheckin(email) {
  let record = await CheckinRecord.findOne({ email });
  if (!record) record = new CheckinRecord({ email });

  const today = todayStr();
  const currentWeekStart = getWeekStart(today);

  // Crossing into a new calendar week always resets the weekly cycle,
  // regardless of whether last week was completed or locked.
  if (record.weekStartDate !== currentWeekStart) {
    record.weekStartDate = currentWeekStart;
    record.weekLocked = false;
    record.claimedDaysThisWeek = [];
  }

  if (record.lastCheckinDate === today) {
    throw new Error('Bạn đã điểm danh hôm nay rồi.');
  }

  if (record.weekLocked) {
    throw new Error('Bạn đã bỏ lỡ điểm danh và bị khoá đến tuần sau.');
  }

  const isFirstEver = !record.lastCheckinDate;
  const isConsecutive = record.lastCheckinDate === yesterdayStr(today);

  if (!isFirstEver && !isConsecutive) {
    // Gap detected — lock the rest of this week and reject this claim.
    record.weekLocked = true;
    record.consecutiveDays = 0;
    record.milestone14Awarded = false;
    record.milestone30Awarded = false;
    await record.save();
    throw new Error('Bạn đã bỏ lỡ điểm danh, chuỗi bị reset và bị khoá đến tuần sau.');
  }

  record.consecutiveDays = isFirstEver ? 1 : record.consecutiveDays + 1;
  record.lastCheckinDate = today;

  const dayOfWeek = getDayOfWeek(today);
  const dailyReward = rewardForDay(dayOfWeek);
  if (!record.claimedDaysThisWeek.includes(dayOfWeek)) {
    record.claimedDaysThisWeek.push(dayOfWeek);
  }

  let bonusAwarded = 0;
  if (record.consecutiveDays === 14 && !record.milestone14Awarded) {
    bonusAwarded += 2100;
    record.milestone14Awarded = true;
  }
  if (record.consecutiveDays === 30 && !record.milestone30Awarded) {
    bonusAwarded += 4500;
    record.milestone30Awarded = true;
  }

  const totalReward = dailyReward + bonusAwarded;
  const desc = bonusAwarded > 0
    ? `Điểm danh ngày ${dayOfWeek} (+${dailyReward} JOY) và mốc ${record.consecutiveDays} ngày liên tục (+${bonusAwarded} JOY)`
    : `Điểm danh ngày ${dayOfWeek} (+${dailyReward} JOY)`;

  const { balance } = await awardJoy(email, totalReward, 'checkin', desc, { refId: today });
  await record.save();

  return {
    dayOfWeek,
    dailyReward,
    bonusAwarded,
    totalReward,
    consecutiveDays: record.consecutiveDays,
    newBalance: balance
  };
}

export async function getCheckinStatus(email) {
  const record = await CheckinRecord.findOne({ email });
  const today = todayStr();
  const currentWeekStart = getWeekStart(today);
  const sameWeek = record?.weekStartDate === currentWeekStart;

  const claimedDaysThisWeek = sameWeek ? (record.claimedDaysThisWeek || []) : [];
  const weekLocked = sameWeek ? !!record?.weekLocked : false;
  const alreadyClaimedToday = record?.lastCheckinDate === today;

  return {
    todayDayOfWeek: getDayOfWeek(today),
    rewardTable: REWARD_TABLE,
    claimedDaysThisWeek,
    weekLocked,
    alreadyClaimedToday,
    canClaimToday: !alreadyClaimedToday && !weekLocked,
    consecutiveDays: record?.consecutiveDays || 0,
    milestone14Awarded: record?.milestone14Awarded || false,
    milestone30Awarded: record?.milestone30Awarded || false
  };
}
