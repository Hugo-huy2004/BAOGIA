import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchJoyRateHistory } from "../../../services/joyApi";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";
import { BASE_DENOM, JOY_DENOMS, denomKey } from "../../../../shared/joyCurrency.js";

/**
 * Bảng biến động JOY — bày đúng kiểu bảng tỷ giá quốc tế.
 *
 * Ba luật của màn này:
 *
 * 1. MỘT ĐƠN VỊ CHUẨN. Mọi dòng đều là "1 <đơn vị chuẩn> = X <đơn vị này>",
 *    y như bảng hối đoái lấy một đồng làm gốc. Đơn vị chuẩn là Kavo (bản tiếng
 *    Anh, hệ số 1) — xem BASE_DENOM trong shared/joyCurrency.js.
 *
 * 2. CHỈ SỐ THẬT. Bản trước, khi lịch sử chưa đủ hai điểm, tự sinh một đường
 *    giá bằng Math.random (mean reversion + "Geometric Brownian Motion") rồi vẽ
 *    lên y như dữ liệu thật — người xem không có cách nào biết đường giá đó là
 *    bịa. Giờ thiếu dữ liệu thì nói thẳng là chưa đủ dữ liệu.
 *
 * 3. MỘT BẢNG DUY NHẤT. Danh sách đơn vị lấy từ shared/joyCurrency.js chứ không
 *    chép lại. Bản trước có `VIRTUAL_UNITS` riêng cộng thêm bốn ô "Mira 25
 *    JOYmi" viết cứng trong JSX — năm bản chép của cùng một bảng, và chúng đã
 *    lệch nhau.
 */

const RANGES = [
  { hours: 24, key: "range24h" },
  { hours: 24 * 7, key: "range7d" },
  { hours: 24 * 30, key: "range30d" },
];

const W = 360;
const H = 150;
const PAD = { top: 16, right: 12, bottom: 22, left: 12 };

const BASE_CODE = JOY_DENOMS[BASE_DENOM].code;

/** Đường cong mượt qua các điểm giá. */
function bezierPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function JoyRateChart({ denom = BASE_DENOM }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const { rates } = useJoy();

  const myDenom = denomKey(denom);
  const [selected, setSelected] = useState(myDenom);
  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState(null);

  useEffect(() => setSelected(myDenom), [myDenom]);

  useEffect(() => {
    let alive = true;
    const load = () => fetchJoyRateHistory(hours)
      .then((rows) => { if (alive) setPoints(rows); })
      .catch(() => { if (alive) setPoints([]); });
    load();
    const timer = setInterval(load, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, [hours]);

  /** Bảng niêm yết: máy chủ tính sẵn, thiếu thì dựng từ hệ số nền. */
  const board = useMemo(() => {
    if (Array.isArray(rates?.board) && rates.board.length) return rates.board;
    return Object.entries(JOY_DENOMS)
      .map(([key, unit]) => ({
        key,
        code: unit.code,
        name: unit.name,
        perBase: unit.factor / JOY_DENOMS[BASE_DENOM].factor,
        change24h: 0,
        isBase: key === BASE_DENOM,
      }))
      .sort((a, b) => a.perBase - b.perBase);
  }, [rates]);

  const active = board.find((row) => row.key === selected) || board[0];

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }),
    [locale]
  );
  const pct = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" }),
    [locale]
  );

  // Chuỗi giá của đơn vị đang chọn, quy về đơn vị chuẩn — đúng con số bảng bày.
  const chart = useMemo(() => {
    const series = (points || [])
      .map((row) => {
        const factors = row.factors || {};
        const base = Number(factors[BASE_DENOM]) || 1;
        const value = Number(factors[selected]);
        return Number.isFinite(value) && base > 0
          ? { at: new Date(row.at).getTime(), value: value / base }
          : null;
      })
      .filter(Boolean);

    if (series.length < 2) return null;

    const values = series.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || max * 0.001 || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const coords = series.map((row, i) => ({
      x: PAD.left + (i / (series.length - 1)) * innerW,
      y: PAD.top + innerH - ((row.value - min) / span) * innerH,
    }));

    const line = bezierPath(coords);
    const first = series[0].value;
    const last = series[series.length - 1].value;
    return {
      line,
      area: `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left} ${(PAD.top + innerH).toFixed(1)} Z`,
      min, max, last,
      up: last >= first,
      change: first ? (last - first) / first : 0,
      count: series.length,
    };
  }, [points, selected]);

  const up = chart ? chart.up : (active?.change24h || 0) >= 0;
  const changeValue = chart ? chart.change : (active?.change24h || 0);

  return (
    <section className="space-y-3 select-none">
      {/* Niêm yết của đơn vị đang chọn, viết đúng kiểu cặp tỷ giá */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground">
            1 {BASE_CODE} = {nf.format(active?.perBase ?? 1)} {active?.code}
          </p>
          <p className="text-[11px] font-bold text-muted-foreground">
            {active?.name}
            {active?.isBase && ` · ${t("joyRate.baseUnit")}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-black ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            <span className="material-symbols-outlined text-xs" aria-hidden="true">{up ? "trending_up" : "trending_down"}</span>
            {pct.format(changeValue)}
          </span>
          <div className="flex gap-1" role="tablist">
            {RANGES.map((range) => (
              <button
                key={range.hours}
                type="button"
                role="tab"
                aria-selected={hours === range.hours}
                onClick={() => setHours(range.hours)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                  hours === range.hours ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {t(`memberPortal.walletApp.${range.key}`)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Biểu đồ — chỉ vẽ khi có từ hai điểm THẬT trở lên */}
      <div className="rounded-3xl border border-border bg-card p-2">
        {chart ? (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-[140px] w-full" role="img"
              aria-label={t("joyRate.chartLabel", { code: active?.code, base: BASE_CODE })}>
              <defs>
                <linearGradient id="joy-rate-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={up ? "#10b981" : "#f43f5e"} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={up ? "#10b981" : "#f43f5e"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill="url(#joy-rate-fill)" />
              <path d={chart.line} fill="none" stroke={up ? "#10b981" : "#f43f5e"} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="flex items-center justify-between border-t border-border px-2 pt-1 font-mono text-[11px] font-bold text-muted-foreground">
              <span>{t("joyRate.low")} {nf.format(chart.min)}</span>
              <span>{t("joyRate.points", { count: chart.count })}</span>
              <span>{t("joyRate.high")} {nf.format(chart.max)}</span>
            </div>
          </>
        ) : (
          <div className="flex h-[140px] flex-col items-center justify-center gap-1 text-center">
            <span className="material-symbols-outlined text-[28px] text-muted-foreground" aria-hidden="true">timeline</span>
            <p className="text-[13px] font-bold text-foreground">{t("joyRate.empty.title")}</p>
            <p className="max-w-xs text-[11px] text-muted-foreground">{t("joyRate.empty.desc")}</p>
          </div>
        )}
      </div>

      {/* Bảng niêm yết đầy đủ */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[12px] font-black text-foreground">
            {t("joyRate.boardTitle", { base: BASE_CODE })}
          </p>
          {rates?.updatedAt && (
            <p className="text-[10px] font-bold text-muted-foreground">
              {t("joyRate.updated", { time: new Date(rates.updatedAt).toLocaleString(locale) })}
            </p>
          )}
        </div>

        <ul>
          {board.map((row) => {
            const rowUp = (row.change24h || 0) >= 0;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  onClick={() => setSelected(row.key)}
                  aria-current={row.key === selected}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
                    row.key === selected ? "bg-muted" : ""
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-[13px] font-black text-foreground">{row.code}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{row.name}</span>
                    {row.key === myDenom && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-primary">
                        {t("joyRate.yourUnit")}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 font-mono">
                    <span className="text-[13px] font-black tabular-nums text-foreground">{nf.format(row.perBase)}</span>
                    <span className={`w-[62px] text-right text-[11px] font-bold tabular-nums ${rowUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {pct.format(row.change24h || 0)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">{t("joyRate.note")}</p>
    </section>
  );
}
