/**
 * Voucher còn dùng được: chưa dùng và chưa quá hạn (mã cũ không có hạn).
 *
 * Ở riêng một module không-React vì cả màn "Ưu đãi của tôi" lẫn con số trên
 * hàng Ví JOY trong trang Tài khoản đều hỏi câu này — trang Tài khoản chỉ cần
 * đúng hàm này, không nên vì thế mà kéo cả màn ưu đãi vào gói của nó.
 */
export function isVoucherActive(voucher, now = Date.now()) {
  if (voucher.usedAt) return false;
  return !voucher.expiresAt || new Date(voucher.expiresAt).getTime() > now;
}
