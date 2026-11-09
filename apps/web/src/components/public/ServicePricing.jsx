import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ADDON_GROUPS, SERVICE_ADDONS, addonPath } from "../../data/serviceAddons";

/**
 * Bảng giá dùng chung cho /services và trang từng gói.
 *
 * Trên điện thoại mỗi dãy thẻ là một hàng VUỐT NGANG (scroll-snap của trình
 * duyệt, không thư viện trượt): ba thẻ giá xếp dọc chiếm ba màn hình, vuốt
 * thì chỉ một. Từ `lg` trở lên thẻ đứng thành lưới.
 */

const OBJ = { returnObjects: true };

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
