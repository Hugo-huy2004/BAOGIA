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
  daily_tree_bonus: 'Cây nhiệm vụ trưởng thành',
  joylater_open: 'Mở khoá bằng JOYlater',
  joylater_repay: 'Trả nợ JOYlater',
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
  birthday_spin: 'Vòng quay tháng sinh nhật',
  admin_voucher: 'Nhận voucher quà tặng',
  portal_theme_rent: 'Thuê giao diện portal',
  member_transfer_out: 'Chuyển JOY cho thành viên',
  member_transfer_in: 'Nhận JOY từ thành viên',
  admin_telegram_button: 'Admin thưởng qua Telegram',
  stock_buy: 'Mua cổ phiếu sàn ảo',
  stock_sell: 'Bán cổ phiếu sàn ảo',
  stock_dividend: 'Cổ tức sàn ảo',
  vocab_essay_retake: 'Thi lại bài viết luận tiếng Trung',
  vocab_daily_goal: 'Hoàn thành mục tiêu học từ vựng trong ngày',
  vocab_mission: 'Thưởng nhiệm vụ học từ vựng',
  // Thu hồi theo chính sách bình ổn. Nguồn RIÊNG chứ không dùng chung
  // `admin_adjustment`: một đợt thu hồi phải tra ra được trong sổ bằng một câu
  // truy vấn, tách hẳn khỏi các lần admin cộng/trừ lẻ.
  joy_recall: 'Thu hồi theo chính sách bình ổn JOY',
};

/**
 * Nguồn JOY → APP phát sinh ra nó (id trong shared/appRegistry.js).
 *
 * Vì sao cần: hộp thư hiện "+120 JOY" mà không nói được thưởng ở đâu thì người
 * đọc không kiểm chứng được gì — đó là yêu cầu "mọi thông báo phải cho biết từ
 * app nào". Mọi biến động JOY đều đã có `source`, nên suy ra app từ đó là đủ;
 * không phải đi sửa 14 chỗ gọi notifyMember để ai cũng nhớ truyền thêm một tham số.
 *
 * Nguồn KHÔNG có trong bảng này là nguồn cấp hệ thống (điểm danh, giới thiệu,
 * admin điều chỉnh, chuyển giữa người dùng) — chúng không thuộc app nào và nhãn
 * sẽ để trống, đúng bản chất.
 */
export const JOY_SOURCE_APP = {
  // Học từ vựng
  vocab_daily_goal: 'vocab',
  vocab_mission: 'vocab',
  vocab_essay_retake: 'vocab',

  // HugoArcade (gồm cả cờ vua — cùng một app)
  arcade_score: 'arcade',
  chess_win: 'arcade',
  chess_match: 'arcade',

  // HugoPSY
  companion: 'psychology',
  companion_unlock: 'psychology',
  chat_tokens_exchange: 'psychology',

  // Tập trung / Aura
  focus_session: 'aura',
  aura_theme_rent: 'aura',

  // Học lập trình (Study with Hugo)
  ide_learning: 'study',
  ide_course_completion: 'study',
  coder_exam_retake: 'study',
  lifetime_unlock: 'study',
  lifetime_unlock_all: 'study',
  ide_phase_1_completion: 'study',
  ide_phase_2_completion: 'study',
  ide_phase_3_completion: 'study',
  ide_phase_4_completion: 'study',
  ide_phase_5_completion: 'study',
  ide_phase_6_completion: 'study',
  ide_phase_7_completion: 'study',
  hugoso_course: 'study',

  // Chợ tiện ích
  store_purchase: 'store',
  app_plan: 'store',
  app_plan_gift: 'store',
  feature_subscription: 'store',

  // Trang Bio
  bio_theme_rental: 'bio',

  // Ví JOY
  joylater_open: 'joy_wallet',
  joylater_repay: 'joy_wallet',
  daily_tree_bonus: 'joy_wallet',
  daily_challenge: 'joy_wallet',
  birthday_spin: 'joy_wallet',

  // HugoKit
  file_compression: 'handle',
};

/** App phát sinh một biến động JOY. Rỗng = cấp hệ thống, không thuộc app nào. */
export const appOfJoySource = (source) => JOY_SOURCE_APP[source] || '';

export const JOY_SOURCE_KEYS = Object.keys(JOY_SOURCES);

/**
 * Nguồn "nhiễu" — phần thưởng trò chơi hoá, khối lượng lớn, không phải dòng
 * tiền thật. Ngân hàng giữ sao kê tiền VĨNH VIỄN, nhưng điểm cờ vua hay điểm
 * danh mỗi ngày thì không đáng giữ mãi. Chỉ những nguồn LIỆT KÊ Ở ĐÂY mới bị
 * dọn sau 90 ngày; mọi nguồn khác (chuyển khoản, mua bán, nạp/rút, cổ phiếu,
 * voucher, điều chỉnh admin…) giữ mãi. Nguồn MỚI mặc định được GIỮ — an toàn
 * cho tiền; thấy nó là nhiễu thì thêm vào đây.
 */
export const JOY_NOISE_SOURCES = new Set([
  'chess_win', 'chess_match', 'checkin', 'daily_challenge', 'arcade_score',
  'daily_tree_bonus', 'focus_session', 'info_bonus', 'info_read_bonus',
  'ide_learning', 'ide_course_completion', 'birthday_spin',
  'ide_phase_1_completion', 'ide_phase_2_completion', 'ide_phase_3_completion',
  'ide_phase_4_completion', 'ide_phase_5_completion', 'ide_phase_6_completion',
  'ide_phase_7_completion',
]);

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
  member_transfer_in: 'banbe',
  member_transfer_out: 'banbe',
  arcade_score: 'choi',
  stock_buy: 'choi',
  stock_sell: 'choi',
  stock_dividend: 'choi',
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
  portal_theme_rent: 'muasam',
  file_compression: 'muasam',
  chat_tokens_exchange: 'muasam',
  gift_code: 'khuyenmai',
  admin_voucher: 'khuyenmai',
  admin_direct_add: 'khuyenmai',
  admin_telegram_button: 'khuyenmai',
  admin_adjustment: 'khuyenmai'
};

for (const key of Object.keys(JOY_SOURCE_GROUPS)) {
  if (!JOY_SOURCES[key]) throw new Error(`JOY_SOURCE_GROUPS có nguồn lạ: ${key}`);
}
