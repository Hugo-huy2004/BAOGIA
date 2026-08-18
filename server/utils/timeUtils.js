/**
 * Utility functions for Vietnam (GMT+7 Asia/Ho_Chi_Minh) timezone alignment
 */

export function getVietnamDateString(date = new Date()) {
  // Returns YYYY-MM-DD in Asia/Ho_Chi_Minh timezone
  const options = { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
  return formatter.format(date);
}

export function getVietnamTodayStr(date = new Date()) {
  // Returns toDateString() in Asia/Ho_Chi_Minh timezone (e.g. "Wed Aug 19 2026")
  const options = { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => map[p.type] = p.value);
  return `${map.weekday} ${map.month} ${map.day} ${map.year}`;
}
