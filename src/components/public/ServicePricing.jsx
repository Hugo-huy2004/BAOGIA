import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import PackageName from "../brand/PackageName";
import { servicePackages } from "../../data/servicePackages";
import { ADDON_GROUPS, SERVICE_ADDONS, addonPath } from "../../data/serviceAddons";

/**
 * Bảng giá dùng chung cho /services và trang từng gói.
 *
 * Trên điện thoại mỗi dãy thẻ là một hàng VUỐT NGANG (scroll-snap của trình
 * duyệt, không thư viện trượt): ba thẻ giá xếp dọc chiếm ba màn hình, vuốt
 * thì chỉ một. Từ `lg` trở lên thẻ đứng thành lưới.
 */

const OBJ = { returnObjects: true };
const PAID = servicePackages.filter((p) => !p.freeTier);
const priceOf = (price) => (price.to ? `${price.from} – ${price.to}` : price.from);

// Hàng thẻ: vuốt ngang trên điện thoại, lưới từ lg.
const RAIL =
  "-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden";
const CARD = "flex w-[84%] shrink-0 snap-center flex-col rounded-[1.5rem] border border-border bg-card p-6 sm:w-[60%] lg:w-auto";

/** Ba gói trả phí cạnh nhau: giá, ba con số chính, nút xem gói. */
export function PackagePriceCards({ currentId }) {
  const { t } = useTranslation();
  const cells = t("servicePkg.compare.cells", OBJ);
  const stats = t("servicePkg.stats", OBJ);

  return (
    <div className={`${RAIL} lg:grid-cols-3`}>
      {PAID.map((pkg) => {
        const base = `servicePkg.items.${pkg.id}`;
        const facts = [
          [stats.time, cells.time?.[pkg.id]],
          [stats.pages, cells.pages?.[pkg.id]],
          [stats.warranty, stats.warrantyValue?.[pkg.id]],
        ];
        const current = pkg.id === currentId;
        return (
          <article key={pkg.id} className={`${CARD} ${current || pkg.recommended ? "border-foreground/30 ring-1 ring-foreground/10" : ""}`}>
            {pkg.recommended ? (
              <span className="mb-3 self-start rounded-full bg-foreground px-2.5 py-1 text-[0.7rem] font-semibold text-background">{t("servicePkg.page.recommended")}</span>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <PackageName id={pkg.id} size="md" dot={false} />
              {pkg.noDeposit ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-semibold">{t("servicePkg.policyNoDeposit.title").replace(/[.。]$/, "")}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`${base}.title`)}</p>
            <p className="mt-5 text-[2rem] leading-none font-semibold tracking-[-.045em]">
              {priceOf(t(`${base}.price`, OBJ))}
            </p>
            <dl className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-foreground/80">
              {t(`${base}.features`, OBJ).slice(0, 4).map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" /> {f}</li>
              ))}
            </ul>
            {current ? null : (
              <Link to={`/services/${pkg.slug}`} className="btn-secondary mt-6 justify-center">
                {t("servicePkg.page.detailCta")} <ArrowRight size={16} />
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}

/**
 * Thẻ gói lẻ trong danh sách: chỉ tên, một câu "cần khi nào", giá và "Xem
 * thêm". Chi tiết (gồm gì, không gồm gì, bảo hành) nằm ở trang /services/add-ons/<slug>
 * — trang chính thức để copy link gửi khách.
 */
export function AddonTile({ addon, dim = false }) {
  const { t } = useTranslation();
  const a = t(`servicePkg.addonItems.${addon.id}`, OBJ);
  return (
    <Link
      to={addonPath(addon)}
      className={`group flex h-full flex-col rounded-[1.25rem] border border-border bg-card p-5 transition-colors hover:border-foreground/30 ${dim ? "opacity-50" : ""}`}
    >
      <span className="text-[0.95rem] font-semibold tracking-[-.01em]">{a.name}</span>
      <span className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{a.when}</span>
      <span className="mt-4 flex items-end justify-between gap-3">
        <span className="text-lg leading-tight font-semibold tracking-[-.03em]">{a.price}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-hue-blue">
          {t("servicePkg.addonPage.seeMore")} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

/**
 * Toàn bộ gói lẻ theo nhóm + đơn giá lẻ. `currentId` (gói chính đang xem) làm
 * mờ gói lẻ không áp cho nó; `skip` bỏ gói lẻ đã hiện chỗ khác trên trang.
 */
export function ServiceAddons({ currentId, skip = [] }) {
  const { t } = useTranslation();
  const addons = t("servicePkg.addons", OBJ);
  const groups = t("servicePkg.addonPage.groups", OBJ);

  return (
    <div>
      <div className="space-y-8">
        {ADDON_GROUPS.map((g) => {
          const list = SERVICE_ADDONS.filter((a) => a.group === g && !skip.includes(a.id));
          if (!list.length) return null;
          return (
            <div key={g}>
              <h3 className="text-[0.72rem] font-semibold tracking-[.08em] text-muted-foreground uppercase">{groups[g]}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((addon) => (
                  <AddonTile key={addon.id} addon={addon} dim={Boolean(currentId) && !addon.appliesTo.includes(currentId)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mt-10 text-sm font-semibold tracking-[-.01em]">{t("servicePkg.detail.unitsTitle")}</h3>
      <ul className="mt-3 overflow-hidden rounded-[1.25rem] border border-border bg-card">
        {addons.units.map((u) => (
          <li key={u.title} className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="text-sm leading-6">{u.title}</span>
            <span className="shrink-0 text-sm font-semibold whitespace-nowrap">{u.price}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{addons.note}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("servicePkg.trademarkNote")}</p>
    </div>
  );
}
