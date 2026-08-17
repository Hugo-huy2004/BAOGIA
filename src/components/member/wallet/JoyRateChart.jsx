import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchJoyRateHistory } from "../../../services/joyApi";
import { localeForLanguage } from "../../../i18n/languages";

/**
 * Đường tỷ giá của một đơn vị JOY theo thời gian.
 *
 * Vẽ bằng SVG trần — không thêm thư viện biểu đồ nào. Một đường, một vùng tô và
 * vài mốc trục là chừng 60 dòng; kéo cả recharts về đây tốn hơn 100KB cho đúng
 * một hình, mà app này có ngân sách hiệu năng phải giữ.
 *
 * Trục dọc KHÔNG bắt đầu từ 0: biên độ tỷ giá chỉ ±15% quanh hệ số nền, ép về 0
 * thì mọi đường đều thành một vạch phẳng. Thay vào đó lấy đúng vùng min–max của
 * dữ liệu và ghi rõ hai đầu, để không ai đọc nhầm độ dốc thành độ lớn.
 */

// Khung thời gian: đủ để nhìn trong ngày, trong tuần và trong tháng.
const RANGES = [
  { hours: 24, key: "range24h" },
  { hours: 24 * 7, key: "range7d" },
  { hours: 24 * 30, key: "range30d" },
];

const W = 320;
const H = 132;
const PAD = { top: 10, right: 6, bottom: 18, left: 6 };

export default function JoyRateChart({ denom, code }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);

  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState(null);   // null = đang tải
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setPoints(null);
    setFailed(false);
    fetchJoyRateHistory(hours)
      .then((rows) => { if (alive) setPoints(rows); })
      .catch(() => { if (alive) { setPoints([]); setFailed(true); } });
    return () => { alive = false; };
  }, [hours]);

  const chart = useMemo(() => {
    const series = (points || [])
      .map((row) => ({ at: new Date(row.at).getTime(), value: Number(row.factors?.[denom]) }))
      .filter((row) => Number.isFinite(row.value));
    if (series.length < 2) return null;

    const values = series.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Đường phẳng tuyệt đối vẫn phải vẽ được: cho nó một biên giả để không chia 0.
    const span = max - min || max * 0.001 || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const x = (i) => PAD.left + (i / (series.length - 1)) * innerW;
    const y = (value) => PAD.top + innerH - ((value - min) / span) * innerH;

    const line = series.map((row, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(row.value).toFixed(1)}`).join(" ");
    const area = `${line} L${x(series.length - 1).toFixed(1)} ${PAD.top + innerH} L${PAD.left} ${PAD.top + innerH} Z`;

    const first = series[0].value;
    const last = series[series.length - 1].value;
    return {
      line, area, min, max, series,
      up: last >= first,
      change: first ? (last - first) / first : 0,
      last,
    };
  }, [points, denom]);

  const timeLabel = (ms) => new Date(ms).toLocaleString(locale, hours <= 24
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit" });

  return (
    <section className="wal-chart">
      <header className="wal-chart__head">
        <span>
          <strong>{code}</strong>
          {chart && (
            <small className={chart.up ? "is-up" : "is-down"}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {chart.up ? "trending_up" : "trending_down"}
              </span>
              {`${chart.change > 0 ? "+" : ""}${(chart.change * 100).toFixed(2)}%`}
            </small>
          )}
        </span>
        <div className="wal-chart__ranges" role="tablist">
          {RANGES.map((range) => (
            <button
              key={range.hours}
              type="button"
              role="tab"
              aria-selected={hours === range.hours}
              className={hours === range.hours ? "is-active" : ""}
              onClick={() => setHours(range.hours)}
            >
              {t(`memberPortal.walletApp.${range.key}`)}
            </button>
          ))}
        </div>
      </header>

      {chart ? (
        <>
          <svg
            className={`wal-chart__svg${chart.up ? " is-up" : " is-down"}`}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={t("memberPortal.walletApp.chartAria", {
              code,
              percent: (chart.change * 100).toFixed(2),
            })}
          >
            <path className="wal-chart__area" d={chart.area} />
            <path className="wal-chart__line" d={chart.line} />
          </svg>
          <div className="wal-chart__axis">
            <span>{timeLabel(chart.series[0].at)}</span>
            <span>{t("memberPortal.walletApp.chartBand", {
              low: chart.min.toFixed(chart.min < 10 ? 4 : 2),
              high: chart.max.toFixed(chart.max < 10 ? 4 : 2),
            })}</span>
            <span>{timeLabel(chart.series[chart.series.length - 1].at)}</span>
          </div>
        </>
      ) : (
        // Chưa đủ hai điểm thì nói thật là đang thu thập, không vẽ đường bịa.
        <p className="wal-chart__empty">
          {points === null
            ? t("memberPortal.walletApp.chartLoading")
            : t(failed ? "memberPortal.walletApp.chartFailed" : "memberPortal.walletApp.chartCollecting")}
        </p>
      )}
    </section>
  );
}
