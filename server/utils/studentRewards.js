export const STUDENT_REWARD_TYPES = Object.freeze({
  achievement: Object.freeze({ days: 35, label: 'Giấy khen / chứng chỉ' }),
  transcript: Object.freeze({ days: 60, label: 'Bảng điểm hiện tại' }),
});

export function vietnamYearMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export function studentRewardSeason(now = new Date()) {
  const { year, month } = vietnamYearMonth(now);
  return { year, isOpen: month >= 7 && month <= 9 };
}
