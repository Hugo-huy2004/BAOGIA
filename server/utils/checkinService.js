import CheckinRecord from '../models/CheckinRecord.js';
import { awardJoy } from './joyService.js';

const DAY_MS = 86400000;

function pad2(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

/** Today as 'YYYY-MM-DD', local server time. */
export function todayStr() {
  return toDateStr(new Date());
}

/** Monday of the ISO week containing dateStr, as 'YYYY-MM-DD'. */
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const isoDay = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - isoDay);
  return toDateStr(d);
}

/** 1 (Monday) .. 7 (Sunday) */
function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ((d.getDay() + 6) % 7) + 1;
}

// Base daily rewards x3.
function rewardForDay(dayOfWeek) {
  if (dayOfWeek === 1) return 150;
  if (dayOfWeek === 7) return 450;
  return 240;
}

const REWARD_TABLE = [150, 240, 240, 240, 240, 240, 450];

function daysBetween(from, to) {
  return Math.round((new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / DAY_MS);
}

// Ngày được tha: lỡ đúng MỘT ngày thì chuỗi không đứt, mỗi 7 ngày một lần.
// Học sinh nghỉ vì thi, ốm, về quê là chuyện thường; mất trắng chuỗi 20 ngày vì
// một ngày lỡ khiến người ta bỏ hẳn chứ không quay lại gầy dựng từ đầu.
function graceAvailable(record, today) {
  return !record.graceUsedOn || daysBetween(record.graceUsedOn, today) >= 7;
}

/** Chuỗi còn sống tính tới hôm nay (đã gồm ngày được tha), 0 nếu đã đứt. */
function liveStreak(record, today) {
  if (!record?.lastCheckinDate) return 0;
  const gap = daysBetween(record.lastCheckinDate, today);
  if (gap <= 1 || (gap === 2 && graceAvailable(record, today))) return record.consecutiveDays || 0;
  return 0;
}

/**
 * Claims today's check-in reward for email. Throws a user-facing Vietnamese
 * Error when already claimed today. A missed day only restarts the streak
 * (and its 14/30-day milestones); it no longer locks the rest of the week.
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

  const isFirstEver = !record.lastCheckinDate;
  const gap = isFirstEver ? Infinity : daysBetween(record.lastCheckinDate, today);
  const usesGrace = gap === 2 && graceAvailable(record, today);
  const isConsecutive = gap === 1 || usesGrace;
  const previous = {
    graceUsedOn: record.graceUsedOn,
    lastCheckinDate: record.lastCheckinDate,
    consecutiveDays: record.consecutiveDays,
    milestone14Awarded: record.milestone14Awarded,
    milestone30Awarded: record.milestone30Awarded,
  };

  record.weekLocked = false;
  if (!isFirstEver && !isConsecutive) {
    record.milestone14Awarded = false;
    record.milestone30Awarded = false;
  }
  if (usesGrace) record.graceUsedOn = today;
  record.consecutiveDays = isConsecutive ? record.consecutiveDays + 1 : 1;
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

  // Save the checkin record first to prevent TOCTOU race condition (double check-in)
  await record.save();

  try {
    const { balance } = await awardJoy(email, totalReward, 'checkin', desc, { refId: today });
    return {
      dayOfWeek,
      dailyReward,
      bonusAwarded,
      totalReward,
      consecutiveDays: record.consecutiveDays,
      usedGrace: usesGrace,
      newBalance: balance
    };
  } catch (error) {
    // Rollback the checkin record in case awardJoy fails
    Object.assign(record, previous);
    record.claimedDaysThisWeek = record.claimedDaysThisWeek.filter(d => d !== dayOfWeek);
    await record.save();
    throw error;
  }
}

export async function getCheckinStatus(email) {
  const record = await CheckinRecord.findOne({ email });
  const today = todayStr();
  const currentWeekStart = getWeekStart(today);
  const sameWeek = record?.weekStartDate === currentWeekStart;

  const claimedDaysThisWeek = sameWeek ? (record.claimedDaysThisWeek || []) : [];
  const alreadyClaimedToday = record?.lastCheckinDate === today;

  return {
    todayDayOfWeek: getDayOfWeek(today),
    rewardTable: REWARD_TABLE,
    claimedDaysThisWeek,
    weekLocked: false,
    alreadyClaimedToday,
    canClaimToday: !alreadyClaimedToday,
    consecutiveDays: liveStreak(record, today),
    todayReward: rewardForDay(getDayOfWeek(today)),
    milestone14Awarded: record?.milestone14Awarded || false,
    milestone30Awarded: record?.milestone30Awarded || false
  };
}
