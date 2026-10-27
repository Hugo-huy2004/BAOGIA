/**
 * Utility functions for Vietnam (GMT+7 Asia/Ho_Chi_Minh) timezone alignment
 */

export function getVietnamDateString(date = new Date()) {
  // Returns YYYY-MM-DD in Asia/Ho_Chi_Minh timezone
  const options = { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
  return formatter.format(date);
}

