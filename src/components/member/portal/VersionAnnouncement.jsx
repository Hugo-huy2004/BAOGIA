import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { notify } from "../../../lib/notify";

// ─────────────────────────────────────────────────────────────────────────────
// Chiến dịch giới thiệu phiên bản 2.0.
//
// Cửa sổ hiển thị cố định: 26/07/2026 → hết 10/08/2026. Sau ngày cuối component
// tự im, không cần ai đi gỡ. So sánh bằng chuỗi ISO ngày-địa-phương nên không
// dính lệch múi giờ như khi so sánh Date/UTC.
// ─────────────────────────────────────────────────────────────────────────────
const FROM = "2026-07-26";
const THROUGH = "2026-08-10"; // bao gồm trọn ngày này

const SESSION_KEY = "hugo_v2_ad_seen";   // mỗi phiên mở app chỉ hiện một lần
const OPTOUT_KEY = "hugo_v2_ad_optout";  // người dùng chọn "không hiện lại"
const TOAST_ID = "hugo-v2-launch";

/** Ngày hôm nay theo lịch địa phương, dạng YYYY-MM-DD. */
function localToday(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isCampaignLive(today = localToday()) {
  return today >= FROM && today <= THROUGH;
}

const FEATURES = ["security", "store", "arcade", "cards"];
const FEATURE_ICONS = {
  security: "shield_lock",
  store: "grid_view",
  arcade: "sports_esports",
  cards: "credit_card",
};

function AdCard({ t: toastState, onOpen, onDismiss, onOptOut, tr }) {
  const k = (key) => tr(`memberPortal.versionAd.${key}`);
  return (
    <div
      className={`brand-panel pointer-events-auto relative w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[28px] text-foreground ${
        toastState.visible ? "animate-enter" : "animate-leave"
      }`}
      role="dialog"
      aria-label={k("title")}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-lime-400" />

      <div className="px-4 pb-3.5 pt-4">
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-[21px] text-white shadow-lg shadow-fuchsia-500/25"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            rocket_launch
          </span>

          <div className="min-w-0 flex-1">
            <p className="m-0 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-500">
              {k("eyebrow")}
            </p>
            <p className="m-0 mt-0.5 text-[15px] font-black leading-snug text-foreground">
              {k("title")}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted/70"
            aria-label={k("later")}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="m-0 mt-2 text-[13px] leading-relaxed text-muted-foreground">{k("body")}</p>

        {/* Các tính năng chuyên biệt & được nâng cấp */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {FEATURES.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-2 py-1.5 text-[11px] font-semibold text-foreground"
            >
              <span className="material-symbols-outlined shrink-0 text-[15px] text-muted-foreground">
                {FEATURE_ICONS[id]}
              </span>
              <span className="truncate">{k(`features.${id}`)}</span>
            </span>
          ))}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-lime-500/30 bg-lime-500/10 px-2.5 py-2">
          <span className="material-symbols-outlined shrink-0 text-[16px] text-lime-600 dark:text-lime-400">
            redeem
          </span>
          <span className="text-[11.5px] font-bold text-lime-700 dark:text-lime-300">{k("reward")}</span>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-2xl border border-border bg-muted/70 py-2.5 text-xs font-bold text-muted-foreground transition-transform hover:bg-muted active:scale-[0.98]"
          >
            {k("later")}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="flex-[1.6] rounded-2xl bg-primary py-2.5 text-xs font-black text-primary-foreground transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            {k("cta")}
          </button>
        </div>

        <button
          type="button"
          onClick={onOptOut}
          className="mt-1.5 w-full rounded-xl py-1.5 text-[11px] font-semibold text-muted-foreground/70 hover:text-muted-foreground"
        >
          {k("optOut")}
        </button>
      </div>
    </div>
  );
}

/**
 * Không render gì ra cây DOM — chỉ bắn toast quảng cáo một lần mỗi phiên,
 * trong khoảng thời gian chiến dịch. Mount ở màn hình chính của portal.
 */
export default function VersionAnnouncement({ enabled = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !isCampaignLive()) return;

    let seen = false;
    let optedOut = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
      optedOut = localStorage.getItem(OPTOUT_KEY) === "1";
    } catch { /* storage bị chặn — cứ hiện, còn hơn im lặng */ }
    if (seen || optedOut) return;

    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }

    const close = () => toast.dismiss(TOAST_ID);

    // Chờ một nhịp để không đè lên hoạt ảnh vào màn hình chính.
    const timer = window.setTimeout(() => {
      notify.info(
        (toastState) => (
          <AdCard
            t={toastState}
            tr={t}
            onOpen={() => { close(); navigate("/member/utilities/info"); }}
            onDismiss={close}
            onOptOut={() => {
              try { localStorage.setItem(OPTOUT_KEY, "1"); } catch { /* ignore */ }
              close();
            }}
          />
        ),
        { id: TOAST_ID, duration: Infinity }
      );
    }, 900);

    return () => {
      window.clearTimeout(timer);
      close();
    };
  }, [enabled, navigate, t]);

  return null;
}
