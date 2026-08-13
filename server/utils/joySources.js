/**
 * Danh mục nguồn JOY — MỘT danh sách duy nhất.
 *
 * Trước đây danh sách này tồn tại hai bản: `enum` trong models/JoyLedger.js và
 * `JOY_TITLES` trong utils/joyService.js. Hai bản lệch nhau là chuyện phải xảy
 * ra, và nó đã xảy ra: `app_plan` / `app_plan_gift` có tiêu đề nhưng không có
 * trong enum, nên mọi lượt mua-tặng gói ứng dụng đều chết ở awardJoy với
 * INVALID_JOY_SOURCE. Thêm nguồn mới giờ chỉ sửa đúng file này.
 *
 * key = source lưu trong ledger, value = tiêu đề tiếng Việt hiện cho người dùng.
 */
export const JOY_SOURCES = {
  referral_referrer: 'Quà giới thiệu',
  referral_referee: 'Quà giới thiệu',
  chess_win: 'Thắng trận cờ vua',
  chess_match: 'Trận đấu cờ vua',
  companion: 'Trị liệu tâm lý',
  checkin: 'Điểm danh nhận JOY',
  gift_code: 'Đổi mã quà tặng',
  store_purchase: 'Mua hàng',
  admin_adjustment: 'Điều chỉnh JOY',
  companion_unlock: 'Mở khoá tính năng trị liệu',
  daily_challenge: 'Thử thách hàng ngày',
  arcade_score: 'Kỷ lục HugoArcade mới',
  focus_session: 'Tập trung sâu HugoAura',
  aura_theme_rent: 'Thuê giao diện Aura',
  joy_gift_sent: 'Gửi JOY cho bạn bè',
  joy_gift_received: 'Nhận JOY từ bạn bè',
  ide_learning: 'Hoàn thành bài học Phát triển Web',
  hugoso_course: 'Mở khóa phần Năng suất số và AI',
  info_bonus: 'Khám phá Info & Version',
  feature_subscription: 'Trao đổi JOY mở khóa tính năng',
  bio_theme_rental: 'Trao đổi JOY diện giao diện Bio',
  file_compression: 'Trao đổi JOY nén file HugoTractare',
  admin_direct_add: 'Nhận JOY từ Admin',
  app_plan: 'Mở gói ứng dụng',
  app_plan_gift: 'Tặng gói ứng dụng',
  ide_course_completion: 'Tốt nghiệp bộ Phát triển Web',
  chat_tokens_exchange: 'Đổi thêm lượt trò chuyện',
  coder_exam_retake: 'Mua lượt thi lại Study with Hugo',
  lifetime_unlock: 'Mở khoá vĩnh viễn một chặng',
  lifetime_unlock_all: 'Mở khoá vĩnh viễn toàn bộ chặng',
  info_read_bonus: 'Đọc tin Info & Version',
  ide_phase_1_completion: 'Hoàn thành phần 1 · Phát triển Web',
  ide_phase_2_completion: 'Hoàn thành phần 2 · Phát triển Web',
  ide_phase_3_completion: 'Hoàn thành phần 3 · Phát triển Web',
  ide_phase_4_completion: 'Hoàn thành phần 4 · Phát triển Web',
  ide_phase_5_completion: 'Hoàn thành phần 5 · Phát triển Web',
  ide_phase_6_completion: 'Hoàn thành phần 6 · Phát triển Web',
  ide_phase_7_completion: 'Hoàn thành bộ Phát triển Web',
  birthday_spin: 'Vòng quay tháng sinh nhật'
};

export const JOY_SOURCE_KEYS = Object.keys(JOY_SOURCES);

/**
 * Nhóm nguồn — dùng cho phần "JOY đến từ đâu" trong ví. Nguồn không khai báo ở
 * đây rơi vào 'khac', không cần liệt kê đủ.
 */
export const JOY_SOURCE_GROUPS = {
  checkin: 'diemdanh',
  daily_challenge: 'diemdanh',
  referral_referrer: 'banbe',
  referral_referee: 'banbe',
  joy_gift_received: 'banbe',
  joy_gift_sent: 'banbe',
  arcade_score: 'choi',
  chess_win: 'choi',
  chess_match: 'choi',
  ide_learning: 'hoc',
  ide_course_completion: 'hoc',
  hugoso_course: 'hoc',
  coder_exam_retake: 'hoc',
  lifetime_unlock: 'hoc',
  lifetime_unlock_all: 'hoc',
  info_bonus: 'hoc',
  info_read_bonus: 'hoc',
  companion: 'hoc',
  companion_unlock: 'hoc',
  focus_session: 'hoc',
  store_purchase: 'muasam',
  app_plan: 'muasam',
  app_plan_gift: 'muasam',
  feature_subscription: 'muasam',
  bio_theme_rental: 'muasam',
  aura_theme_rent: 'muasam',
  file_compression: 'muasam',
  chat_tokens_exchange: 'muasam',
  gift_code: 'khuyenmai',
  admin_direct_add: 'khuyenmai',
  admin_adjustment: 'khuyenmai'
};

for (const key of Object.keys(JOY_SOURCE_GROUPS)) {
  if (!JOY_SOURCES[key]) throw new Error(`JOY_SOURCE_GROUPS có nguồn lạ: ${key}`);
}
