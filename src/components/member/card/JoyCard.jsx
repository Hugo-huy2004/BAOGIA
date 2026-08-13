import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MembershipFactory } from "../../../models/membershipTier";
import CardPattern from "./CardPattern";
import { localeForLanguage } from "../../../i18n/languages";

/**
 * Thẻ thành viên Hugo — dựng theo giải phẫu của một tấm thẻ THẬT, hai mặt lật
 * được.
 *
 *   Mặt trước: tên phát hành · hạng · tiến trình lên hạng · số dư · chủ thẻ ·
 *              mã thẻ.
 *   Mặt sau:   dải từ đen · quy định sử dụng · ô chữ ký.
 *
 * CHẠM VÀO THẺ để lật. Trước đây mỗi mặt đeo một nút tròn nhỏ (••• và ✕) chỉ để
 * lật — hai chấm xám lửng lơ ở góc thẻ, mà bản thân tấm thẻ đã là vùng chạm to
 * nhất màn hình.
 *
 * Không vẽ chip EMV và sóng contactless: thẻ này không quẹt ở đâu cả, vẽ vào chỉ
 * là đạo cụ. Vạch tiến trình lên hạng nằm sát mép dưới thẻ, thay cho một thanh
 * rời phía dưới cùng một dòng chữ nữa.
 *
 * Màu và hoạ tiết lấy từ `models/membershipTier.js`; `tier` là thẻ đang xem (có
 * thể là hạng chưa mở, để xem trước), không truyền thì lấy hạng hiện tại.
 */

/** Mã giới thiệu đọc như số thẻ: tách nhóm 4 ký tự. */
const groupCode = (code) => (code || "").replace(/(.{4})/g, "$1 ").trim();

export default function JoyCard({
  referralCount = 0,
  balance = 0,
  referralCode = "",
  displayName = "",
  email = "",
  onCopyReferral,
  tier: tierProp = null,
  progress = null,
}) {
  const { t, i18n } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const tier = tierProp || MembershipFactory.getCurrentTier(referralCount);
  const unlocked = tier.isUnlocked(referralCount);
  const rawName = displayName || email?.split("@")[0] || t("memberPortal.navigation.memberFallback");
  const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();
  const numberLocale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const darkCard = tier.id === "premium";
  const cardRules = t("memberPortal.joy.card.rules", { returnObjects: true });

  const faceClass =
    `absolute inset-0 flex flex-col overflow-hidden rounded-[18px] [backface-visibility:hidden] ${tier.textClass}`;
  const faceStyle = {
    background: tier.cardBgStyle,
    // Bóng đổ hai tầng: một tầng sát mép để thấy cạnh thẻ, một tầng loang xa để
    // thẻ nằm TRÊN mặt giấy chứ không in vào giấy.
    boxShadow: "0 1px 2px rgba(16,24,40,0.14), 0 12px 28px -8px rgba(16,24,40,0.30)",
  };

  const flip = () => setFlipped((v) => !v);

  return (
    <div
      className="w-full cursor-pointer [perspective:1500px]"
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped
        ? t("memberPortal.joy.card.flipFront")
        : t("memberPortal.joy.card.flipRules")}
      onClick={flip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip();
        }
      }}
    >
      <div
        className={`relative aspect-[1.586/1] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ── MẶT TRƯỚC ─────────────────────────────────────────────────── */}
        <div className={faceClass} style={faceStyle} aria-hidden={flipped}>
          <CardPattern kind={tier.pattern} />
          {/* Vệt sáng chéo — mặt nhựa bóng bắt ánh sáng. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(112deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0) 52%)",
            }}
            aria-hidden="true"
          />

          <div className="relative flex h-full flex-col justify-between p-[5.5%]">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">Hugo Studio</span>
              <div className="min-w-0 shrink-0 text-right">
                <span className={`inline-block rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold tracking-wide ${tier.pillStyle}`}>
                  {tier.name}
                </span>
                {progress?.nextTier && (
                  <span className="mt-1 block text-[9.5px] uppercase tracking-[0.1em] opacity-55">
                    {t("memberPortal.joy.card.referralsToTier", {
                      count: progress.referralsNeeded,
                      tier: progress.nextTier.name,
                    })}
                  </span>
                )}
              </div>
            </div>

            {unlocked ? (
              <div className="min-w-0">
                <span className="block text-[10.5px] uppercase tracking-[0.12em] opacity-60">
                  {t("memberPortal.joy.card.availableBalance")}
                </span>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[30px] font-semibold leading-none tracking-tight tabular-nums">
                    {(balance ?? 0).toLocaleString(numberLocale)}
                  </span>
                  <span className="text-[14px] font-semibold opacity-70">JOY</span>
                </p>
              </div>
            ) : (
              // Thẻ chưa mở thì hiện điều kiện mở, không hiện số dư — số dư của
              // bạn chẳng liên quan gì tới tấm thẻ bạn chưa có.
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] opacity-60">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
                  {t("memberPortal.joy.card.locked")}
                </span>
                <p className="text-[17px] font-semibold leading-tight">
                  {t("memberPortal.joy.card.referralsNeeded", {
                    count: tier.getReferralsNeeded(referralCount),
                  })}
                </p>
              </div>
            )}

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[9.5px] uppercase tracking-[0.14em] opacity-55">{t("memberPortal.joy.card.cardholder")}</span>
                <span className="block truncate text-[13.5px] font-semibold uppercase tracking-wide">{cleanName}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCopyReferral?.(); }}
                className="min-w-0 shrink-0 text-right transition-opacity active:opacity-60"
                title={t("memberPortal.joy.card.copyCode")}
              >
                <span className="block text-[9.5px] uppercase tracking-[0.14em] opacity-55">{t("memberPortal.joy.card.cardCode")}</span>
                <span className="block font-mono text-[14px] font-semibold tracking-[0.16em]">
                  {groupCode(referralCode) || "—"}
                </span>
              </button>
            </div>
          </div>

          {/* Vạch tiến trình lên hạng, chạy sát mép dưới thẻ. Trước đây nó là
              một thanh rời nằm dưới thẻ kèm thêm một dòng chữ — hai phần tử nữa
              trên một trang vốn đã thưa. */}
          {progress?.nextTier && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-current/15" aria-hidden="true">
              <div className="h-full bg-current opacity-60" style={{ width: `${progress.progressPct}%` }} />
            </div>
          )}
        </div>

        {/* ── MẶT SAU ───────────────────────────────────────────────────── */}
        <div className={`${faceClass} [transform:rotateY(180deg)]`} style={faceStyle} aria-hidden={!flipped}>
          <CardPattern kind={tier.pattern} />

          {/* Dải từ — chi tiết nhận diện mặt sau của mọi tấm thẻ. */}
          <div
            className="relative mt-[7%] h-[16%] w-full shrink-0"
            style={{ background: darkCard ? "#05070B" : "#1C2028" }}
            aria-hidden="true"
          />

          <div className="relative flex min-h-0 flex-1 flex-col p-[5.5%] pt-[3.5%]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
              {t("memberPortal.joy.card.usageRules")}
            </span>

            <ul className="mt-1.5 space-y-[3px]">
              {(Array.isArray(cardRules) ? cardRules : []).map((rule) => (
                <li key={rule} className="flex gap-1.5 text-[10.5px] leading-snug opacity-85">
                  <span className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
                  <span className="min-w-0">{rule}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-end justify-between gap-3">
              {/* Ô chữ ký của thẻ thật — ở đây là chỗ ghi mã thẻ. */}
              <span
                className="flex h-[26px] min-w-0 flex-1 items-center rounded-[3px] px-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-[#1C2028]"
                style={{ background: "rgba(255,255,255,0.82)" }}
              >
                <span className="truncate">{groupCode(referralCode) || "—"}</span>
              </span>
              <span className="shrink-0 text-[9px] uppercase tracking-[0.14em] opacity-55">
                hugowishpax.studio
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { JoyCard };
