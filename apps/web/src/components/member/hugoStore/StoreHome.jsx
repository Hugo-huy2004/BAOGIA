import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PRODUCT_GROUPS, perkLabel, moneyUnit, formatDate, tileAction, remainingLabel, GRADIENTS } from "./storeData";
import UtilityAppIcon from "../utilities/UtilityAppIcon";
import { BioRow, BioSection } from "../bioEditorKit";

/**
 * Màn chính Thương Điếm — làm lại 26/10/2026.
 *
 * Bản trước: tiêu đề vẽ hai lần (AppFrame đã có tiêu đề lớn), băng chuyền "Nổi
 * Bật" gradient + kính mờ với chữ tiếng Việt viết cứng, thẻ số dư gradient cam
 * kéo hoạ tiết từ một trang ngoài, và các ô bấm là `div` lồng nút. Giờ mọi kệ
 * là danh sách nhóm phẳng như Danh Thiếp: một dòng = icon, tên, mô tả, một nút.
 */

const norm = (value) => String(value || "").toLowerCase();

const daysLeft = (value) => Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));

/** Nút viên nang cuối dòng — cùng một kiểu cho tải, mở, mua. */
export function StorePill({ label, onClick, disabled = false, filled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[32px] min-w-[72px] shrink-0 rounded-full px-4 text-[13px] font-bold transition-opacity active:opacity-60 disabled:opacity-50 ${
        filled ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
      }`}
    >
      {label}
    </button>
  );
}

const ICON_SIZE = { sm: "!h-10 !w-10", md: "!h-12 !w-12", lg: "!h-24 !w-24" };

/** Icon app bo góc theo PHẦN TRĂM như iOS, để cỡ nào cũng cùng một dáng. */
export const AppIcon = ({ app, size = "md" }) => (
  <UtilityAppIcon
    app={app}
    gradient={GRADIENTS[app.color]}
    className={`${ICON_SIZE[size]} !rounded-[22.5%]`}
  />
);

export default function StoreHome({
  entries = [], packs = [], orders = [], search = "", onSearch,
  onOpenApp, onBuyPack, onInstall, onOpen,
}) {
  const { t } = useTranslation();
  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const shown = useMemo(
    () => (searching
      ? entries.filter((e) => norm(e.app.label).includes(query) || norm(e.app.tagline).includes(query))
      : entries),
    [entries, query, searching]
  );
  const shownPacks = useMemo(
    () => (searching
      ? packs.filter((p) => [p.name, p.description, perkLabel(p)].some((f) => norm(f).includes(query)))
      : packs),
    [packs, query, searching]
  );

  const apps = shown.filter((e) => !e.app.game);
  const games = shown.filter((e) => e.app.game);
  // Gói trải nghiệm/theo tháng sắp hết — số ngày là số thật từ server.
  const expiring = searching ? [] : entries.filter(
    (e) => (e.state?.tier === "trial" || e.state?.tier === "rent") && e.state.expiresAt && e.ladder?.appId === e.app.id
  );
  const nothing = searching && shown.length === 0 && shownPacks.length === 0;

  const actionPill = (entry) => {
    const action = tileAction(entry);
    const config = {
      installing: { label: t("utilities.store.app.installing", { percent: entry.progress }), run: null },
      locked: { label: t("utilities.store.app.see"), run: () => onOpenApp(entry.app.id) },
      install: { label: t("utilities.store.app.install"), run: () => onInstall?.(entry) },
      open: { label: t("utilities.store.app.open"), run: () => onOpen?.(entry) },
    }[action];
    return <StorePill label={config.label} onClick={config.run || undefined} disabled={!config.run} />;
  };

  const appRows = (list) => list.map((entry) => (
    <BioRow
      key={entry.app.id}
      media={<AppIcon app={entry.app} />}
      title={entry.app.label}
      detail={entry.app.tagline}
      onClick={() => onOpenApp(entry.app.id)}
      trailing={actionPill(entry)}
    />
  ));

  return (
    <div className="space-y-7 px-4 pt-1">
      <label className="relative block">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground" aria-hidden="true">search</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("utilities.store.search.placeholder")}
          aria-label={t("utilities.store.search.placeholder")}
          className="h-11 w-full rounded-xl bg-muted pl-10 pr-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      {nothing ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="material-symbols-outlined text-[44px] text-muted-foreground" aria-hidden="true">search_off</span>
          <p className="mt-3 text-[17px] font-semibold text-foreground">{t("utilities.store.search.empty")}</p>
          <p className="mt-1 text-[15px] text-muted-foreground">{t("utilities.store.search.emptyHint")}</p>
        </div>
      ) : (
        <>
          {expiring.length > 0 && (
            <BioSection title={t("utilities.store.expiring.title")} hint={t("utilities.store.expiring.hint")}>
              {expiring.map((entry) => (
                <BioRow
                  key={entry.app.id}
                  media={<AppIcon app={entry.app} size="sm" />}
                  title={entry.app.label}
                  detail={`${t(`utilities.store.expiring.${entry.state.tier}`)} · ${remainingLabel(daysLeft(entry.state.expiresAt))}`}
                  onClick={() => onOpenApp(entry.app.id)}
                  trailing={<StorePill label={t("utilities.store.expiring.cta")} onClick={() => onOpenApp(entry.app.id)} />}
                />
              ))}
            </BioSection>
          )}

          {apps.length > 0 && (
            <BioSection title={t("utilities.store.home.apps")} aside={searching ? null : t("utilities.store.home.appsHint")}>
              {appRows(apps)}
            </BioSection>
          )}

          {games.length > 0 && (
            <BioSection title={t("utilities.store.home.games")} aside={searching ? null : t("utilities.store.home.gamesHint")}>
              {appRows(games)}
            </BioSection>
          )}

          {PRODUCT_GROUPS.map((group) => {
            const list = shownPacks.filter((p) => (p.productType || "general") === group.type);
            if (list.length === 0) return null;
            return (
              <BioSection key={group.type} title={group.title} aside={searching ? null : group.subtitle}>
                {list.map((pack) => (
                  <BioRow
                    key={pack._id}
                    icon="redeem"
                    title={pack.name}
                    detail={perkLabel(pack) || pack.description}
                    trailing={<StorePill label={moneyUnit(pack.priceJoy)} onClick={() => onBuyPack(pack)} />}
                  />
                ))}
              </BioSection>
            );
          })}

          {!searching && orders.length > 0 && (
            <BioSection title={t("utilities.store.home.orders")} aside={t("utilities.store.home.ordersHint")}>
              {orders.slice(0, 5).map((order) => (
                <BioRow
                  key={order._id}
                  icon="receipt_long"
                  title={order.productName}
                  detail={`${formatDate(order.createdAt)} · ${order.purchaseCode}`}
                  trailing={<span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">{moneyUnit(order.priceJoy)}</span>}
                />
              ))}
            </BioSection>
          )}

          {!searching && (
            <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">{t("utilities.store.home.balanceHint")}</p>
          )}
        </>
      )}
    </div>
  );
}
