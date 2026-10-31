import { useTranslation } from "react-i18next";

export default function AgeProtectionCard() {
  const { t } = useTranslation();
  const rules = t("memberPortal.ageProtection.rules", { returnObjects: true });
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <div className="grid place-items-center bg-foreground px-6 py-8 text-background sm:py-10">
          <span className="material-symbols-outlined text-7xl" aria-hidden="true">shield_person</span>
          <strong className="mt-2 text-6xl font-black tracking-[-0.08em]">14+</strong>
          <span className="mt-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-background/65">{t("memberPortal.ageProtection.badge")}</span>
        </div>

        <div className="space-y-4 p-5 sm:p-7">
          <div>
            <p className="text-base font-black text-foreground">{t("memberPortal.ageProtection.title")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("memberPortal.ageProtection.description")}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-foreground">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">family_restroom</span>
              {t("memberPortal.ageProtection.groupTitle")}
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {(Array.isArray(rules) ? rules : []).map((rule) => <li key={rule}>• {rule}</li>)}
            </ul>
          </div>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="material-symbols-outlined mt-px text-base" aria-hidden="true">verified_user</span>
            <span>{t("memberPortal.ageProtection.commitment")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
