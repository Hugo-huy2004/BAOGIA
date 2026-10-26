import { useTranslation } from "react-i18next";
import { money, remainingLabel, appById, tileAction } from "./storeData";
import { joyText } from "../../../lib/joyDisplay";
import { BioRow, BioSection } from "../bioEditorKit";
import { AppIcon, StorePill } from "./StoreHome";

const daysLeft = (value) =>
  Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));

/**
 * Màn chi tiết một app — làm lại 26/10/2026 cùng màn chính: bỏ quầng sáng sau
 * icon và ba thẻ bậc to; ba bậc giờ là ba dòng trong một nhóm, giá và nút nằm
 * cùng một cột bên phải để so sánh liếc là thấy.
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

  const shortOf = (total) => (balance != null && balance < total ? total - balance : 0);

  return (
    <div className="space-y-7 px-4 pt-2">
      <section className="flex items-start gap-4">
        <AppIcon app={app} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-foreground">{app.label}</h2>
          <p className="mt-1 line-clamp-3 text-[15px] leading-snug text-muted-foreground">{app.tagline}</p>
          <div className="mt-3 flex items-center gap-2">
            <StorePill label={primary.label} onClick={primary.run || undefined} disabled={!primary.run} filled={Boolean(primary.run)} />
            {ladder && (
              <button
                type="button"
                onClick={() => onGift?.(ladder.appId)}
                aria-label={t("utilities.store.app.giftAria", { app: app.label })}
                title={t("utilities.store.app.giftAria", { app: app.label })}
                className="grid h-11 w-11 place-items-center rounded-full text-primary transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">redeem</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {ladder ? (
        <BioSection
          title={t("utilities.store.app.choose")}
          aside={statusLine(t, ladder, state)}
          hint={ladder.appId === app.id
            ? t("utilities.store.app.chooseHint")
            : t("utilities.store.app.viaPlan", { plan: appById(ladder.appId)?.label || ladder.label })}
        >
          <Tier
            title={t("utilities.store.tier.trial", { count: ladder.trial.days })}
            note={state.trialUsed && state.tier !== "trial" ? t("utilities.store.tier.trialUsed") : t("utilities.store.tier.trialNote")}
            price={t("utilities.store.tier.free")}
            cta={t("utilities.store.tier.start")}
            state={state.tier === "trial" ? "current" : state.unlocked ? "hidden" : state.trialUsed ? "used" : "open"}
            onClick={() => onTrial?.(ladder)}
          />
          <Tier
            title={t("utilities.store.tier.rent")}
            badge={t("utilities.store.tier.popular")}
            note={state.tier === "rent" ? t("utilities.store.tier.rentAgainNote") : t("utilities.store.tier.rentNote")}
            price={joyText(ladder.rent.total)}
            cta={state.tier === "rent" ? t("utilities.store.tier.renewCta") : t("utilities.store.tier.rentCta")}
            highlight
            state={state.tier === "own" ? "hidden" : "open"}
            short={shortOf(ladder.rent.total)}
            onClick={() => onRent?.(ladder)}
          />
          <Tier
            title={t("utilities.store.tier.own")}
            badge={t("utilities.store.tier.save", { percent: ladder.own.savePercent })}
            note={t("utilities.store.tier.ownNote", { months: ladder.own.equivMonths, joy: money(ladder.own.comparedTo) })}
            price={joyText(ladder.own.total)}
            cta={t("utilities.store.tier.ownCta")}
            state={state.tier === "own" ? "current" : "open"}
            short={shortOf(ladder.own.total)}
            onClick={() => onOwn?.(ladder)}
          />
        </BioSection>
      ) : (
        <BioSection hint={t("utilities.store.app.freeHint")}>
          <BioRow icon="check_circle" title={t("utilities.store.app.free")} />
        </BioSection>
      )}
    </div>
  );
}

function statusLine(t, ladder, state) {
  if (state?.tier === "own") return t("utilities.store.app.owned");
  if ((state?.tier === "rent" || state?.tier === "trial") && state.expiresAt) {
    return `${t(`utilities.store.expiring.${state.tier}`)} · ${remainingLabel(daysLeft(state.expiresAt))}`;
  }
  return t("utilities.store.app.lockedHint");
}

function Tier({ title, note, price, badge, cta, highlight, state, short = 0, onClick }) {
  const { t } = useTranslation();
  if (state === "hidden") return null;
  const disabled = state === "current" || state === "used";

  return (
    <div className="flex items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-border/50">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-foreground">
          {title}
          {badge && !disabled && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[13px] font-semibold text-primary">{badge}</span>
          )}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{note}</p>
        {short > 0 && !disabled && (
          <p className="mt-0.5 text-[13px] font-semibold text-destructive">{t("utilities.store.tier.short", { joy: money(short) })}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[15px] font-bold tabular-nums text-foreground">{price}</span>
        <StorePill
          label={state === "current" ? t("utilities.store.tier.current") : state === "used" ? t("utilities.store.tier.used") : cta}
          onClick={onClick}
          disabled={disabled}
          filled={highlight && !disabled}
        />
      </div>
    </div>
  );
}
