import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

/**
 * Bảng giá thang bậc + bậc người dùng đang có.
 *
 * Luôn lấy từ server: giá thuê/sở hữu và % tiết kiệm do `appPlanService` tính,
 * client không được tự nhân chia lại — lệch một đồng là hoá đơn hiện một số mà
 * tài khoản bị trừ số khác.
 */
export function useStorePlans(email) {
  const [plans, setPlans] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/store/plans`, { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json();
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setBalance(data.balance ?? null);
    } catch {
      /* để trống: cửa hàng vẫn dùng được, chỉ thiếu bảng giá */
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { reload(); }, [reload]);

  return { plans, balance, loading, reload };
}
