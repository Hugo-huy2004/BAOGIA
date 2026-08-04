import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJoyHistory } from "../../../services/joyApi";

// Nhãn nhóm — thuần trình bày. Khoá nhóm do máy chủ gắn (utils/joySources.js),
// nhóm lạ rơi về "Khác" nên thêm nguồn mới ở server không làm vỡ chỗ này.
const GROUP_LABELS = {
  diemdanh: "Điểm danh",
  banbe: "Bạn bè",
  choi: "Giải trí",
  hoc: "Học tập",
  congdong: "Cộng đồng",
  muasam: "Mua sắm",
  khuyenmai: "Khuyến mãi",
  khac: "Khác"
};

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "in", label: "Nhận" },
  { id: "out", label: "Dùng" }
];

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

function dayKey(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Lịch sử ví JOY: tổng kết 30 ngày + dòng tiền gộp theo ngày.
 *
 * Tự nạp lại khi có sự kiện `hugo:notification` (WebSocket đẩy joy_update qua
 * đó) — không polling.
 */
export default function JoyHistory({ limit = 50 }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setError("");
    fetchJoyHistory({ limit, days: 30 })
      .then((d) => {
        setTransactions(d.transactions);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message || "Không tải được lịch sử."))
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener("hugo:notification", load);
    return () => window.removeEventListener("hugo:notification", load);
  }, [load]);

  const days = useMemo(() => {
    const rows = transactions.filter((t) =>
      filter === "in" ? t.amount > 0 : filter === "out" ? t.amount < 0 : true
    );
    const buckets = new Map();
    for (const tx of rows) {
      const key = dayKey(tx.createdAt);
      if (!buckets.has(key)) buckets.set(key, { label: dayLabel(tx.createdAt), items: [], net: 0 });
      const b = buckets.get(key);
      b.items.push(tx);
      b.net += tx.amount;
    }
    return [...buckets.values()];
  }, [transactions, filter]);

  const topGroups = useMemo(
    () => (summary?.groups || []).filter((g) => g.total > 0).slice(0, 3),
    [summary]
  );

  return (
    <div className="space-y-3">
      {/* Tổng kết 30 ngày */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">insights</span>
          <h3 className="text-[15px] font-semibold text-foreground">30 ngày qua</h3>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "Nhận", value: `+${fmt(summary?.earned)}` },
            { label: "Đã dùng", value: `−${fmt(summary?.spent)}` },
            {
              label: "Chênh lệch",
              value: `${(summary?.net ?? 0) >= 0 ? "+" : "−"}${fmt(Math.abs(summary?.net ?? 0))}`
            }
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted px-3 py-2.5">
              <span className="block text-[12.5px] text-muted-foreground">{s.label}</span>
              <span className="mt-0.5 block font-mono text-[15px] font-semibold text-foreground">
                {loading ? "—" : s.value}
              </span>
            </div>
          ))}
        </div>

        {topGroups.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <span className="text-[12.5px] text-muted-foreground">JOY đến nhiều nhất từ</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {topGroups.map((g) => (
                <span
                  key={g.group}
                  className="rounded-full bg-muted px-2.5 py-1 text-[12.5px] font-medium text-foreground"
                >
                  {GROUP_LABELS[g.group] || GROUP_LABELS.khac} · +{fmt(g.total)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`min-h-[44px] flex-1 rounded-xl border text-[14px] font-medium transition-colors ${
              filter === f.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Dòng tiền */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <p className="p-4 text-center text-[14px] text-muted-foreground">Đang tải lịch sử…</p>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-[14px] text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 min-h-[44px] rounded-xl border border-border px-4 text-[14px] font-medium text-foreground"
            >
              Thử lại
            </button>
          </div>
        ) : days.length === 0 ? (
          <p className="p-4 text-center text-[14px] text-muted-foreground">
            {filter === "all" ? "Chưa có giao dịch nào." : "Không có giao dịch phù hợp bộ lọc."}
          </p>
        ) : (
          days.map((day, di) => (
            <div key={day.label + di} className={di > 0 ? "border-t border-border" : ""}>
              <div className="flex items-center justify-between bg-muted px-4 py-2">
                <span className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {day.label}
                </span>
                <span className="font-mono text-[12.5px] text-muted-foreground">
                  {day.net >= 0 ? "+" : "−"}
                  {fmt(Math.abs(day.net))} JOY
                </span>
              </div>
              {day.items.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 border-t border-border px-4 py-3">
                  <span className="material-symbols-outlined text-[20px] text-muted-foreground">
                    {tx.amount >= 0 ? "arrow_downward" : "arrow_upward"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{tx.title}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">
                      {timeLabel(tx.createdAt)}
                      {tx.description ? ` · ${tx.description}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-mono text-[15px] font-semibold ${
                        tx.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : "−"}
                      {fmt(Math.abs(tx.amount))}
                    </p>
                    <p className="font-mono text-[12.5px] text-muted-foreground">
                      còn {fmt(tx.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
