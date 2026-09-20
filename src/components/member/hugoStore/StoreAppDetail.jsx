import React from "react";
import { useTranslation } from "react-i18next";
import UtilityAppIcon from "../utilities/UtilityAppIcon";
import { GRADIENTS, money, remainingLabel, appById, tileAction } from "./storeData";
import { joyText } from "../../../lib/joyDisplay";

const daysLeft = (value) =>
  Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));

export default function StoreAppDetail({ entry, balance, onOpen, onInstall, onTrial, onRent, onOwn, onGift }) {
  const { t } = useTranslation();
  const { app, ladder, state } = entry;
  const action = tileAction(entry);

  const primary      = {
    installing: { label: t("utilities.store.app.installing", { percent: entry.progress }), run: null },
    locked: { label: t("utilities.store.app.locked"), run: null },
    install: { label: t("utilities.store.app.install"), run: () => onInstall?.(entry) },
    open: { label: t("utilities.store.app.open"), run: () => onOpen?.(entry) },
  }[action];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8 pb-10">
      {/* HERO SECTION */}
      <section className="px-5 pt-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 group-hover:-translate-y-1 transition-transform">
            <div className={`absolute inset-1 bg-gradient-to-br ${GRADIENTS[app.color]} opacity-20 blur-md rounded-[24px] translate-y-2`} />
            <UtilityAppIcon
              app={app}
              gradient={GRADIENTS[app.color]}
              size="large"
              className="!w-[110px] !h-[110px] shrink-0 !rounded-[24px] shadow-[0_8px_16px_rgba(0,0,0,0.08)] border border-white/20 relative z-10"
            />
            {/* Glass Specular Highlight */}
            <div className="absolute inset-0 z-20 rounded-[24px] pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
          </div>
          <div className="min-w-0 flex-1 py-1">
            <h2 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
              {app.label}
            </h2>
            <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-muted-foreground">{app.tagline}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                disabled={!primary.run}
                onClick={primary.run || undefined}
                className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-1.5 rounded-full font-bold text-[15px] transition-colors disabled:opacity-50"
              >
                {primary.label}
              </button>
              {ladder && (
                <button
                  type="button"
                  onClick={() => onGift?.(ladder.appId)}
                  aria-label={t("utilities.store.app.giftAria", { app: app.label })}
                  className="w-[34px] h-[34px] rounded-full bg-muted flex items-center justify-center text-primary transition-colors hover:bg-muted/80"
                >
                  <span className="material-symbols-outlined text-[19px]">redeem</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40">
            <p className="text-[13px] text-muted-foreground font-medium">{statusLine(t, ladder, state)}</p>
        </div>
      </section>

      {/* PLANS / TIERS */}
      {ladder ? (
        <section className="px-5">
          <div className="mb-4">
            <h3 className="text-[20px] font-bold text-foreground tracking-tight">{t("utilities.store.app.choose")}</h3>
            <p className="text-[14px] text-muted-foreground mt-1">
                {ladder.appId === app.id
                ? t("utilities.store.app.chooseHint")
                : t("utilities.store.app.viaPlan", {
                    plan: appById(ladder.appId)?.label || ladder.label,
                    })}
            </p>
          </div>
          <div className="space-y-4">
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
        <section className="px-5">
          <div className="bg-muted/50 rounded-[16px] p-6 text-center border border-border/40">
            <p className="text-[16px] font-bold text-foreground">{t("utilities.store.app.free")}</p>
            <p className="mt-2 text-[14px] text-muted-foreground leading-snug">
              {t("utilities.store.app.freeHint")}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function statusLine(t     , ladder     , state) {
  if (!ladder) return t("utilities.store.app.free");
  if (state?.tier === "own") return t("utilities.store.app.owned");
  if ((state?.tier === "rent" || state?.tier === "trial") && state.expiresAt) {
    return `${t(`utilities.store.expiring.${state.tier}`)} · ${remainingLabel(daysLeft(state.expiresAt))}`;
  }
  return t("utilities.store.app.lockedHint");
}

function Tier({ title, note, usedNote, price, badge, cta, highlight, state, short = 0, onClick }) {
  const { t } = useTranslation();
  if (state === "hidden") return null;

  const disabled = state === "current" || state === "used";

  return (
    <div
      className={`rounded-[16px] p-4 transition-colors border ${
        highlight && !disabled
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border/40 bg-muted/30"
      } ${state === "current" ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <p className="text-[17px] font-bold text-foreground">{title}</p>
            {badge && !disabled && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground leading-snug">
            {state === "used" ? usedNote : note}
          </p>
        </div>
        <p className="text-[18px] font-bold text-foreground tabular-nums">{price}</p>
      </div>

      {short > 0 && (
        <p className="mt-2 text-[13px] font-semibold text-destructive">
          {t("utilities.store.tier.short", { joy: money(short) })}
        </p>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-4 w-full h-[42px] rounded-xl text-[15px] font-bold transition-colors ${
          highlight && !disabled
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-foreground hover:bg-muted-foreground/20"
        } disabled:opacity-50`}
      >
        {state === "current" ? t("utilities.store.tier.current")
          : state === "used" ? t("utilities.store.tier.used")
            : cta}
      </button>
    </div>
  );
}
