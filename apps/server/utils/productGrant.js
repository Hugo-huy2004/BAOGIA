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
    let expires = new Date(bio.expiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) expires = new Date();
    expires.setDate(expires.getDate() + days);
    bio.expiresAt = expires;
    pushHistory(bio, 'event_available', 'Gia hạn sử dụng', `+${days} ngày hạn sử dụng từ "${product.name}"`);
    return `+${days} ngày HSD`;
  }

  if (product.productType === 'psy_study_tokens' && product.tokenAmount > 0) {
    const amount = product.tokenAmount * qty;
    const isCall = product.tokenType === 'call';
    if (isCall) bio.bonusCallTokens = (bio.bonusCallTokens || 0) + amount;
    else bio.bonusChatTokens = (bio.bonusChatTokens || 0) + amount;
    return `+${amount} token ${isCall ? 'gọi thoại' : 'chat'}`;
  }

  if (product.productType === 'radio_time' && product.radioMinutes > 0) {
    const minutes = product.radioMinutes * qty;
    if (!bio.radioTokens) {
      bio.radioTokens = { weeklyFreeMinutes: 300, weeklyUsedMinutes: 0, weeklyResetAt: null, purchasedMinutes: 0 };
    }
    bio.radioTokens.purchasedMinutes = (bio.radioTokens.purchasedMinutes || 0) + minutes;
    const mins = minutes % 60;
    const timeStr = mins > 0 ? `${Math.floor(minutes / 60)}h${mins}m` : `${Math.floor(minutes / 60)}h`;
    pushHistory(bio, 'radio', 'Mua thời lượng HugoRadio', `+${timeStr} nghe radio từ "${product.name}"`);
    return `+${timeStr} thời lượng radio`;
  }

  return null;
}

function pushHistory(bio, icon, title, detail) {
  if (!Array.isArray(bio.history)) bio.history = [];
  bio.history.push({ type: 'utility_purchase', icon, title, detail, timestamp: new Date() });
  if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
}
