import { useTranslation } from "react-i18next";
import UtilityAppIcon from "../utilities/UtilityAppIcon";
import SectionHead from "./ui/SectionHead";
import { GRADIENTS, money, remainingLabel, appById, tileAction } from "./storeData";
import { joyText } from "../../../lib/joyDisplay";

const daysLeft = (value) =>
  Math.max(0, Math.ceil((new Date(value) - Date.now()) / 86400000));

/**
 * Trang một ứng dụng: giới thiệu + ba bậc Dùng thử → Thuê → Sở hữu.
 *
 * Mọi con số là số THẬT do server tính (`appPlanService.planLadder`): giá,
 * % tiết kiệm, số ngày còn lại, số JOY còn thiếu. Không có khan hiếm giả,
 * không "N người đang xem", không đánh giá bịa — thứ đó chỉ mua được một lần
 * rồi mất niềm tin.
 */
export default function StoreAppDetail({ entry, balance, onOpen, onInstall, onTrial, onRent, onOwn, onGift }) {
  const { t } = useTranslation();
  const { app, ladder, state } = entry;
  const action = tileAction(entry);
  const primary = {
    installing: { label: t("utilities.store.app.installing", { percent: entry.progress }), run: null },
    locked: { label: t("utilities.store.app.locked"), run: null },
    install: { label: t("utilities.store.app.install"), run: () => onInstall?.(entry) },
    open: { label: t("utilities.store.app.open"), run: () => onOpen?.(entry) },
  }[action];

  return (
    <div className="hgs-page-in space-y-8">
      {/* ── Đầu trang sản phẩm ───────────────────────────────────────────────
          Bố cục của App Store: icon lớn bên trái, tên và mô tả bên phải, nút
          hành động nằm ngay dưới mô tả — đọc theo hàng ngang, không phải một
          khối căn giữa. */}
      <section className="px-4 pt-1">
        <div className="flex items-start gap-4">
          <UtilityAppIcon
            app={app}
            gradient={GRADIENTS[app.color]}
            size="large"
            className="!h-[110px] !w-[110px] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2 className="hgs-ink text-[22px] font-bold leading-tight tracking-[-0.02em]">
              {app.label}
            </h2>
            <p className="hgs-dim mt-1 line-clamp-3 text-[14px] leading-snug">{app.tagline}</p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={!primary.run}
                onClick={primary.run || undefined}
                data-action={action}
                className="hgs-get"
              >
                {primary.label}
              </button>
              {ladder && (
                <button
                  type="button"
                  onClick={() => onGift?.(ladder.appId)}
                  aria-label={t("utilities.store.app.giftAria", { app: app.label })}
                  className="hgs-iconbtn"
                >
                  <span className="material-symbols-outlined text-[19px]">redeem</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="hgs-dim mt-4 text-[13px]">{statusLine(t, ladder, state)}</p>
      </section>

      {/* ── Ba bậc ─────────────────────────────────────────────────────── */}
      {ladder ? (
        <section>
          {/* Game mở bằng gói của app khác thì phải nói thẳng tên gói đó —
              không ai chịu trả tiền cho một thứ mình không hiểu là gì. */}
          <SectionHead
            title={t("utilities.store.app.choose")}
            subtitle={ladder.appId === app.id
              ? t("utilities.store.app.chooseHint")
              : t("utilities.store.app.viaPlan", {
                plan: appById(ladder.appId)?.label || ladder.label,
              })}
          />
          <div className="space-y-2.5 px-4">
            <Tier
              title={t("utilities.store.tier.trial", { count: ladder.trial.days })}
              note={t("utilities.store.tier.trialNote")}
              usedNote={t("utilities.store.tier.trialUsed")}
              price={t("utilities.store.tier.free")}
              cta={t("utilities.store.tier.start")}
              state={
                state.tier === "trial" ? "current"
                  : state.unlocked ? "hidden"
                    : state.trialUsed ? "used"
                      : "open"
              }
              onClick={() => onTrial?.(ladder)}
            />

            <Tier
              title={t("utilities.store.tier.rent")}
              note={state.tier === "rent"
                ? t("utilities.store.tier.rentAgainNote")
                : t("utilities.store.tier.rentNote")}
              price={joyText(ladder.rent.total)}
              badge={t("utilities.store.tier.popular")}
              cta={state.tier === "rent"
                ? t("utilities.store.tier.renewCta")
                : t("utilities.store.tier.rentCta")}
              highlight
              state={state.tier === "own" ? "hidden" : "open"}
              short={balance != null && balance < ladder.rent.total ? ladder.rent.total - balance : 0}
              onClick={() => onRent?.(ladder)}
            />

            <Tier
              title={t("utilities.store.tier.own")}
              note={t("utilities.store.tier.ownNote", {
                months: ladder.own.equivMonths,
                joy: money(ladder.own.comparedTo),
              })}
              price={joyText(ladder.own.total)}
              badge={t("utilities.store.tier.save", { percent: ladder.own.savePercent })}
              cta={t("utilities.store.tier.ownCta")}
              state={state.tier === "own" ? "current" : "open"}
              short={balance != null && balance < ladder.own.total ? ladder.own.total - balance : 0}
              onClick={() => onOwn?.(ladder)}
            />
          </div>
        </section>
      ) : (
        <section className="px-4">
          <div className="hgs-card p-4 text-center">
            <p className="hgs-ink text-[15px] font-bold">{t("utilities.store.app.free")}</p>
            <p className="hgs-dim mt-1 text-[13.5px] leading-snug">
              {t("utilities.store.app.freeHint")}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/** Một dòng dưới tên app, nói đúng quyền đang có. */
function statusLine(t, ladder, state) {
  if (!ladder) return t("utilities.store.app.free");
  if (state?.tier === "own") return t("utilities.store.app.owned");
  if ((state?.tier === "rent" || state?.tier === "trial") && state.expiresAt) {
    return `${t(`utilities.store.expiring.${state.tier}`)} · ${remainingLabel(daysLeft(state.expiresAt))}`;
  }
  return t("utilities.store.app.lockedHint");
}

/**
 * Một bậc giá. `state`:
 *   open · current (đang ở bậc này) · used (đã dùng thử) · hidden (hết ý nghĩa)
 */
function Tier({ title, note, usedNote, price, badge, cta, highlight, state, short = 0, onClick }) {
  const { t } = useTranslation();
  if (state === "hidden") return null;

  const disabled = state === "current" || state === "used";

  return (
    <div className="hgs-tier" data-highlight={highlight && !disabled} data-state={state}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="hgs-ink text-[17px] font-semibold tracking-[-0.01em]">{title}</p>
            {badge && !disabled && (
              <span className="rounded-full bg-emerald-500/16 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {badge}
              </span>
            )}
          </div>
          <p className="hgs-dim mt-0.5 text-[13px] leading-snug">
            {state === "used" ? usedNote : note}
          </p>
        </div>
        <p className="hgs-ink shrink-0 text-[17px] font-semibold tabular-nums">{price}</p>
      </div>

      {short > 0 && (
        <p className="mt-2 text-[13px] font-semibold text-rose-500">
          {t("utilities.store.tier.short", { joy: money(short) })}
        </p>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-3 h-10 w-full text-[15px] ${highlight && !disabled ? "hgs-btn hgs-btn--primary" : "hgs-btn hgs-btn--soft"}`}
      >
        {state === "current" ? t("utilities.store.tier.current")
          : state === "used" ? t("utilities.store.tier.used")
            : cta}
      </button>
    </div>
  );
}
