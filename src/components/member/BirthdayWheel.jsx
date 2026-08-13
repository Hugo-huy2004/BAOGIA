import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../i18n/languages";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const TURNS = 6;              // số vòng quay trọn vẹn trước khi dừng
const SPIN_MS = 4600;
const FALLBACK_PRIZES = [10, 50, 100, 500, 1000, 5000, 10000];

// Bảng màu iOS (systemBlue/Pink/Orange…) đủ tương phản với chữ trắng ở cả hai
// chế độ sáng tối, vì mặt vòng quay luôn nằm trên nền tối của lớp phủ.
const SEGMENT_COLORS = [
  "#0A84FF", "#FF375F", "#FF9F0A", "#30D158",
  "#BF5AF2", "#64D2FF", "#FF6482",
];

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

/** Một múi hình quạt, vẽ theo chiều kim đồng hồ từ 12 giờ. */
function segmentPath(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

const formatJoy = (value, locale) => value.toLocaleString(locale);

/**
 * Góc phải xoay để ô thứ `index` dừng dưới kim (12 giờ).
 *
 * Ô thứ i chiếm cung [i*seg, (i+1)*seg) tính theo chiều kim đồng hồ từ 12 giờ,
 * nên tâm ô ở i*seg + seg/2. Xoay vòng đi -tâm là đưa tâm ô về đúng kim.
 * `jitter` (đơn vị: phần của nửa ô, |jitter| < 1) làm chỗ dừng lệch tự nhiên
 * nhưng vẫn nằm trong lòng ô đã trúng.
 */
export function targetAngle(index, count, turns = TURNS, jitter = 0) {
  const seg = 360 / count;
  const clamped = Math.max(-0.98, Math.min(0.98, jitter));
  return turns * 360 - (index * seg + seg / 2) + (clamped * seg) / 2;
}

/** Ô đang nằm dưới kim sau khi đã xoay `angle` độ — dùng để kiểm chứng. */
export function segmentUnderPointer(angle, count) {
  const seg = 360 / count;
  const normalized = ((-angle % 360) + 360) % 360;
  return Math.floor(normalized / seg);
}

const buzz = (pattern) => {
  try { navigator.vibrate?.(pattern); } catch { /* thiết bị không hỗ trợ */ }
};

/**
 * Vòng quay quà tháng sinh nhật.
 *
 * Phần thưởng do server bốc (POST /api/joy/birthday-spin). Vòng quay chỉ có
 * nhiệm vụ dừng đúng ô mà server đã chọn — mọi thứ hiển thị ở đây đều đến sau
 * khi JOY đã được cộng, nên không có cách nào "quay lại cho ra số khác".
 */
export default function BirthdayWheel({ onClose, onAwarded }) {
  const { t, i18n } = useTranslation();
  const [prizes, setPrizes] = useState(FALLBACK_PRIZES);
  const [phase, setPhase] = useState("loading"); // loading | ready | spinning | done
  const [angle, setAngle] = useState(0);
  const [prize, setPrize] = useState(null);
  const [reward, setReward] = useState(null); // quà theo hạng: ngày duy trì + voucher
  const [tierLabel, setTierLabel] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  // Người bật "giảm chuyển động" không phải ngồi nhìn 4,6 giây quay vòng.
  const reduceMotion = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const spinMs = reduceMotion ? 0 : SPIN_MS;
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    let alive = true;
    fetch(`${apiBase}/joy/birthday-spin`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data.prizes) && data.prizes.length) setPrizes(data.prizes);
        setTierLabel(data.tierLabel || "");
        // Hết lượt hoặc không phải tháng sinh thì đóng luôn, không hiện vòng quay trống.
        if (!data.available) return onClose?.();
        setPhase("ready");
      })
      .catch(() => alive && onClose?.());
    return () => {
      alive = false;
      window.clearTimeout(timerRef.current);
    };
  }, [onClose]);

  const segment = 360 / prizes.length;

  const wheel = useMemo(() => {
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 6;
    return { size, cx, cy, r };
  }, []);

  async function handleSpin() {
    if (phase !== "ready") return;
    setPhase("spinning");
    setError("");
    buzz(12);

    try {
      const response = await fetch(`${apiBase}/joy/birthday-spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("memberPortal.birthdayWheel.spinError"));

      const list = Array.isArray(data.prizes) && data.prizes.length ? data.prizes : prizes;
      if (list !== prizes) setPrizes(list);

      // Tâm ô thứ i nằm ở i*seg + seg/2 tính theo chiều kim đồng hồ từ 12 giờ.
      // Muốn ô đó dừng dưới kim (12 giờ) thì xoay ngược lại đúng chừng ấy độ.
      // Lệch nhẹ trong lòng ô cho tự nhiên, vẫn nằm gọn trong ô đã trúng.
      setAngle(targetAngle(data.index, list.length, TURNS, (Math.random() - 0.5) * 1.2));
      setReward({ days: data.days || 0, vouchers: data.vouchers || [] });
      if (data.tierLabel) setTierLabel(data.tierLabel);
      timerRef.current = window.setTimeout(() => {
        setPrize(data.prize);
        setPhase("done");
        buzz([0, 30, 60, 30]);
        onAwarded?.(data.prize);
      }, spinMs);
    } catch (err) {
      setError(err.message);
      setPhase("ready");
    }
  }

  if (phase === "loading") return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 backdrop-blur-xl sm:items-center sm:p-4">
      <div className="ios-sheet max-h-[92vh] w-full max-w-[380px] overflow-y-auto rounded-t-[32px] bg-[#F2F2F7] px-6 pb-9 pt-6 text-center dark:bg-[#1C1C1E] sm:rounded-[32px]">
        <span className="mx-auto mb-5 block h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20 sm:hidden" aria-hidden="true" />

        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8E]">
          {t("memberPortal.birthdayWheel.kicker")}{tierLabel ? ` · ${tierLabel}` : ""}
        </p>
        <h2 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1C1C1E] dark:text-white">
          {phase === "done"
            ? t("memberPortal.birthdayWheel.congratulations")
            : t("memberPortal.birthdayWheel.title")}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-snug text-[#8A8A8E]">
          {phase === "done"
            ? t("memberPortal.birthdayWheel.addedToWallet")
            : t("memberPortal.birthdayWheel.description")}
        </p>

        <div className="relative mx-auto mt-6 w-[300px] max-w-full">
          {/* Kim chỉ ở vị trí 12 giờ — ô dừng dưới kim là ô trúng */}
          <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2" aria-hidden="true">
            <div className="size-0 border-x-[11px] border-t-[18px] border-x-transparent border-t-[#1C1C1E] drop-shadow-sm dark:border-t-white" />
          </div>

          <svg
            viewBox={`0 0 ${wheel.size} ${wheel.size}`}
            className="w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: phase === "ready" || !spinMs ? "none" : `transform ${spinMs}ms cubic-bezier(0.13, 0.78, 0.16, 1)`,
            }}
            role="img"
            aria-label={t("memberPortal.birthdayWheel.wheelAria", { count: prizes.length })}
          >
            <circle cx={wheel.cx} cy={wheel.cy} r={wheel.r + 5} fill="#FFFFFF" className="dark:fill-[#2C2C2E]" />
            {prizes.map((value, index) => {
              const from = index * segment;
              const mid = from + segment / 2;
              const [tx, ty] = polar(wheel.cx, wheel.cy, wheel.r * 0.66, mid);
              // Nửa dưới vòng quay bị lộn ngược nếu xoay theo đúng góc múi —
              // cộng thêm 180° để số nào cũng đọc xuôi.
              const textAngle = mid > 90 && mid < 270 ? mid + 180 : mid;
              return (
                <g key={value}>
                  <path d={segmentPath(wheel.cx, wheel.cy, wheel.r, from, from + segment)} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                  <text
                    x={tx}
                    y={ty}
                    fill="#FFFFFF"
                    fontSize={value >= 10000 ? 17 : 19}
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textAngle} ${tx} ${ty})`}
                  >
                    {formatJoy(value, locale)}
                  </text>
                </g>
              );
            })}
            <circle cx={wheel.cx} cy={wheel.cy} r={30} fill="#FFFFFF" className="dark:fill-[#2C2C2E]" />
            <text x={wheel.cx} y={wheel.cy} fontSize="13" fontWeight="700" textAnchor="middle" dominantBaseline="central" className="fill-[#1C1C1E] dark:fill-white">
              JOY
            </text>
          </svg>
        </div>

        {phase === "done" && (
          <div className="ios-prize mt-6 rounded-[22px] bg-white px-5 py-4 dark:bg-[#2C2C2E]">
            <p className="text-[13px] font-medium text-[#8A8A8E]">{t("memberPortal.birthdayWheel.youReceived")}</p>
            <p className="mt-0.5 text-[34px] font-bold leading-none tracking-[-0.03em] text-[#0A84FF]">
              +{formatJoy(prize, locale)}
              <span className="ml-1.5 text-[17px] font-semibold text-[#8A8A8E]">JOY</span>
            </p>
          </div>
        )}

        {phase === "done" && reward && (reward.days > 0 || reward.vouchers.length > 0) && (
          <div className="ios-prize mt-3 space-y-2 text-left">
            {reward.days > 0 && (
              <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 dark:bg-[#2C2C2E]">
                <span className="material-symbols-outlined text-[22px] text-[#30D158]" aria-hidden="true">event_available</span>
                <p className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">
                  {t("memberPortal.birthdayWheel.accountDays", { count: reward.days })}
                </p>
              </div>
            )}
            {reward.vouchers.map((voucher) => (
              <div key={voucher.code} className="rounded-[18px] bg-white px-4 py-3 dark:bg-[#2C2C2E]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px] text-[#FF9F0A]" aria-hidden="true">confirmation_number</span>
                  <p className="text-[15px] font-semibold leading-snug text-[#1C1C1E] dark:text-white">{voucher.label}</p>
                </div>
                <p className="mt-1.5 font-mono text-[15px] font-bold tracking-wider text-[#0A84FF]">{voucher.code}</p>
                <p className="mt-0.5 text-[12px] text-[#8A8A8E]">
                  {t("memberPortal.birthdayWheel.voucherExpiry", {
                    date: new Date(voucher.expiresAt).toLocaleDateString(locale),
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-[13px] font-medium text-[#FF375F]">{error}</p>}

        <button
          type="button"
          onClick={phase === "done" ? onClose : handleSpin}
          disabled={phase === "spinning"}
          className="mt-6 min-h-[52px] w-full rounded-[16px] bg-[#0A84FF] text-[17px] font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          {phase === "spinning"
            ? t("memberPortal.birthdayWheel.spinning")
            : phase === "done"
              ? t("memberPortal.birthdayWheel.done")
              : t("memberPortal.birthdayWheel.spinNow")}
        </button>

        {phase !== "done" && (
          <button
            type="button"
            onClick={onClose}
            disabled={phase === "spinning"}
            className="mt-2 min-h-11 w-full text-[15px] font-medium text-[#8A8A8E] transition-opacity active:opacity-60 disabled:opacity-40"
          >
            {t("memberPortal.birthdayWheel.later")}
          </button>
        )}
      </div>

      <style>{`
        @keyframes ios-sheet-in {
          from { opacity: 0; transform: translateY(28px) scale(.97); }
          to { opacity: 1; transform: none; }
        }
        @keyframes ios-prize-in {
          0% { opacity: 0; transform: scale(.86); }
          60% { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ios-sheet { animation: ios-sheet-in .42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ios-prize { animation: ios-prize-in .5s cubic-bezier(0.22, 1.4, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .ios-sheet, .ios-prize { animation: none; }
        }
      `}</style>
    </div>
  );
}
