import { extendAccess } from './accountAccess.js';

/**
 * Cấp thứ vừa mua vào tài khoản, dùng chung cho mua lẻ và thanh toán giỏ hàng.
 *
 * Trả về một dòng mô tả ngắn, hoặc **null** khi sản phẩm không cấp được gì cả —
 * lúc đó người gọi phải từ chối bán, đừng trừ JOY rồi lặng lẽ không đưa gì.
 * Đây đúng là chỗ đã nuốt 1.308 JOY của "15DAYS CARD" (tên hứa 15 ngày nhưng
 * productType để 'general', extendDays 0 nên không nhánh nào chạy).
 *
 * Không tự lưu bio — người gọi gom mọi thay đổi rồi save một lần.
 */
export function applyProductGrant(bio, product, quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);

  if (product.productType === 'system_validity' && product.extendDays > 0) {
    const days = product.extendDays * qty;
    extendAccess(bio, days);
    pushHistory(bio, 'event_available', 'Gia hạn sử dụng', `+${days} ngày hạn sử dụng từ "${product.name}"`);
    return `+${days} ngày HSD`;
  }

  return null;
}

function pushHistory(bio, icon, title, detail) {
  if (!Array.isArray(bio.history)) bio.history = [];
  bio.history.push({ type: 'utility_purchase', icon, title, detail, timestamp: new Date() });
  if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
}
