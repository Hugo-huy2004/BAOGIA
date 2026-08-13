import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJoyHistory } from "../../../services/joyApi";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";

// Nhãn nhóm — thuần trình bày. Khoá nhóm do máy chủ gắn (utils/joySources.js),
// nhóm lạ rơi về "Khác" nên thêm nguồn mới ở server không làm vỡ chỗ này.
function dayKey(iso, locale) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dayLabel(iso, locale, t) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return t("memberPortal.accountHub.historyCopy.today");
  if (diffDays === 1) return t("memberPortal.accountHub.historyCopy.yesterday");
  return d.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit" });
}

function timeLabel(iso, locale) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Lịch sử ví JOY: tổng kết 30 ngày + dòng tiền gộp theo ngày.
 *
 * Tự nạp lại khi có sự kiện `hugo:notification` (WebSocket đẩy joy_update qua
 * đó) — không polling.
 */
export default function JoyHistory({ limit = 50 }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const fmt = (n) => Number(n || 0).toLocaleString(locale);
  const groupLabels = {
    diemdanh: t("memberPortal.accountHub.historyCopy.groups.checkin"),
    banbe: t("memberPortal.accountHub.historyCopy.groups.friends"),
    choi: t("memberPortal.accountHub.historyCopy.groups.entertainment"),
    hoc: t("memberPortal.accountHub.historyCopy.groups.learning"),
    muasam: t("memberPortal.accountHub.historyCopy.groups.shopping"),
    khuyenmai: t("memberPortal.accountHub.historyCopy.groups.promotions"),
    khac: t("memberPortal.accountHub.historyCopy.groups.other"),
  };
  const filters = [
    { id: "all", label: t("memberPortal.accountHub.historyCopy.filters.all") },
    { id: "in", label: t("memberPortal.accountHub.historyCopy.filters.in") },
    { id: "out", label: t("memberPortal.accountHub.historyCopy.filters.out") },
  ];
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
      .catch((e) => setError(e.message || t("memberPortal.accountHub.historyCopy.loadError")))
      .finally(() => setLoading(false));
  }, [limit, t]);

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
      const key = dayKey(tx.createdAt, locale);
      if (!buckets.has(key)) buckets.set(key, { label: dayLabel(tx.createdAt, locale, t), items: [], net: 0 });
      const b = buckets.get(key);
      b.items.push(tx);
      b.net += tx.amount;
    }
    return [...buckets.values()];
  }, [transactions, filter, locale, t]);

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
          <h3 className="text-[15px] font-semibold text-foreground">{t("memberPortal.accountHub.historyCopy.last30Days")}</h3>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: t("memberPortal.accountHub.historyCopy.received"), value: `+${fmt(summary?.earned)}` },
            { label: t("memberPortal.accountHub.historyCopy.spent"), value: `−${fmt(summary?.spent)}` },
            {
              label: t("memberPortal.accountHub.historyCopy.net"),
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
            <span className="text-[12.5px] text-muted-foreground">{t("memberPortal.accountHub.historyCopy.topSources")}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {topGroups.map((g) => (
                <span
                  key={g.group}
                  className="rounded-full bg-muted px-2.5 py-1 text-[12.5px] font-medium text-foreground"
                >
                  {groupLabels[g.group] || groupLabels.khac} · +{fmt(g.total)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="flex gap-2">
        {filters.map((f) => (
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
          <p className="p-4 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.historyCopy.loading")}</p>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-[14px] text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 min-h-[44px] rounded-xl border border-border px-4 text-[14px] font-medium text-foreground"
            >
              {t("memberPortal.today.tryAgain")}
            </button>
          </div>
        ) : days.length === 0 ? (
          <p className="p-4 text-center text-[14px] text-muted-foreground">
            {filter === "all" ? t("memberPortal.accountHub.historyCopy.empty") : t("memberPortal.accountHub.historyCopy.noMatch")}
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
                      {timeLabel(tx.createdAt, locale)}
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
                      {t("memberPortal.accountHub.historyCopy.balanceAfter", { balance: fmt(tx.balanceAfter) })}
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
