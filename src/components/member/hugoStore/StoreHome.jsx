import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import SectionHead from "./ui/SectionHead";
import HeroCard from "./ui/HeroCard";
import ArtCard from "./ui/ArtCard";
import AppTile from "./ui/AppTile";
import PackRow from "./ui/PackRow";
import { PRODUCT_GROUPS, perkLabel, money, moneyUnit, formatDate, remainingLabel } from "./storeData";

const norm = (value) => String(value || "").toLowerCase();
const daysUntil = (value) => Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);

/**
 * Trang chính của Chợ, dựng theo bố cục tab của App Store: large title → ô tìm
 * kiếm → băng thẻ lớn → các băng và lưới bên dưới.
 *
 * Màu trên trang đến từ chính các app: mỗi thẻ lấy gradient của app nó bày, nên
 * cả trang là một dải nhiều màu mà không cần một tấm ảnh minh hoạ nào bịa ra.
 *
 * Không có thuật toán xếp hạng nào ở đây. Bản trước dựng một "feed" tự xoay tâm
 * điểm theo ngày, và hệ quả là chỉ app đang ở tâm điểm mới có đường vào bảng
 * giá. Giờ băng thẻ lớn chỉ là những app CÒN CỬA để giới thiệu (chưa mở khoá,
 * chưa tải), một quy tắc nói ra được thành lời.
 */
export default function StoreHome({
  entries = [], packs = [], orders = [], balance, title, search = "", onSearch,
  onOpenApp, onOpen, onInstall, onBuyPack,
}) {
  const { t } = useTranslation();
  const [heroIndex, setHeroIndex] = useState(0);
  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const shownApps = useMemo(
    () => (searching
      ? entries.filter(e => norm(e.app.label).includes(query) || norm(e.app.tagline).includes(query))
      : entries),
    [entries, query, searching]
  );

  const shownPacks = useMemo(
    () => (searching
      ? packs.filter(p => [p.name, p.description, perkLabel(p)].some(f => norm(f).includes(query)))
      : packs),
    [packs, query, searching]
  );

  // Hai kệ: ứng dụng và trò chơi. Game vẫn do app arcade quản lý và chạy —
  // Chợ chỉ là thêm một cửa để tải chúng về.
  const apps = shownApps.filter(e => !e.app.game);
  const games = shownApps.filter(e => e.app.game);

  // Thẻ lớn: ưu tiên thứ người dùng chưa có. Hết thứ chưa có thì lấy tạm mấy
  // app đầu — trang vẫn phải có đầu, không để trống một mảng.
  const heroes = useMemo(() => {
    const missing = entries.filter(e => (e.ladder && !e.state?.unlocked) || (e.installable && !e.installed));
    return (missing.length ? missing : entries).slice(0, 5);
  }, [entries]);

  // Dùng thử / thuê sắp hết hạn. Ngưỡng khác nhau vì bản dùng thử ngắn hơn
  // nhiều so với một tháng thuê: nhắc trước 7 ngày với bản thử là kịp, còn với
  // gói thuê thì 5 ngày cuối mới là lúc đáng nhắc.
  const expiring = useMemo(
    () => entries
      .filter(e => e.ladder && (e.state?.tier === "trial" || e.state?.tier === "rent") && e.state.expiresAt)
      .map(e => ({ entry: e, daysLeft: daysUntil(e.state.expiresAt) }))
      .filter(x => x.daysLeft >= 0 && x.daysLeft <= (x.entry.state.tier === "trial" ? 7 : 5))
      .sort((a, b) => a.daysLeft - b.daysLeft),
    [entries]
  );

  const nothing = searching && apps.length === 0 && games.length === 0 && shownPacks.length === 0;
  const cardActions = { onOpenDetail: onOpenApp, onOpen, onInstall };

  return (
    <div className="pb-2">
      {/* ── Large title + tìm kiếm ─────────────────────────────────────────
          Cả hai nằm TRONG vùng cuộn nên chúng trôi lên và khuất đi, nhường chỗ
          cho tiêu đề nhỏ trên thanh nav. */}
      <div className="px-4 pb-4">
        <h1 className="hgs-large-title">{title}</h1>

        <div className="relative mt-3">
          <span className="material-symbols-outlined hgs-dim pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[19px]">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={t("utilities.store.search.placeholder")}
            className="hgs-input pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label={t("utilities.store.search.clear")}
              className="hgs-dim absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {searching && !nothing && (
          <p className="hgs-dim mt-2.5 text-[13px]">
            {t("utilities.store.search.results", {
              apps: apps.length + games.length,
              packs: shownPacks.length,
            })}
          </p>
        )}
      </div>

      {nothing ? (
        <div className="px-4 pt-10 text-center">
          <span className="material-symbols-outlined hgs-dim text-[44px]">search_off</span>
          <p className="hgs-ink mt-2 text-[17px] font-semibold">{t("utilities.store.search.empty")}</p>
          <p className="hgs-dim mt-1 text-[15px]">{t("utilities.store.search.emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Băng thẻ lớn ─────────────────────────────────────────────── */}
          {!searching && heroes.length > 0 && (
            <section>
              <div
                className="hgs-rail hgs-hero-rail px-4"
                onScroll={e => {
                  const el = e.currentTarget;
                  setHeroIndex(Math.round(el.scrollLeft / (el.firstChild?.offsetWidth + 12 || 1)));
                }}
              >
                {heroes.map(entry => (
                  <HeroCard key={entry.app.id} entry={entry} {...cardActions} />
                ))}
              </div>
              {heroes.length > 1 && (
                <div className="hgs-dots">
                  {heroes.map((entry, i) => (
                    <span key={entry.app.id} className="hgs-dot" data-active={i === heroIndex} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Đang dùng dở ─────────────────────────────────────────────── */}
          {!searching && expiring.length > 0 && (
            <section>
              <SectionHead
                title={t("utilities.store.expiring.title")}
                subtitle={t("utilities.store.expiring.hint")}
              />
              <div className="hgs-rail px-4">
                {expiring.map(({ entry, daysLeft }) => (
                  <ArtCard
                    key={entry.app.id}
                    entry={entry}
                    note={remainingLabel(daysLeft)}
                    {...cardActions}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Trò chơi: băng thẻ minh hoạ ──────────────────────────────── */}
          {games.length > 0 && (
            <section>
              <SectionHead
                title={t("utilities.store.home.games")}
                subtitle={searching ? null : t("utilities.store.home.gamesHint")}
              />
              <div className="hgs-rail px-4">
                {games.map(entry => (
                  <ArtCard key={entry.app.id} entry={entry} {...cardActions} />
                ))}
              </div>
            </section>
          )}

          {/* ── Ứng dụng: lưới 4 cột ─────────────────────────────────────── */}
          {apps.length > 0 && (
            <section>
              <SectionHead
                title={t("utilities.store.home.apps")}
                subtitle={searching ? null : t("utilities.store.home.appsHint")}
              />
              <div className="hgs-grid px-3">
                {apps.map(entry => (
                  <AppTile key={entry.app.id} entry={entry} {...cardActions} />
                ))}
              </div>
            </section>
          )}

          {/* Kệ vật phẩm: mỗi loại một kệ, kệ rỗng tự biến mất. */}
          {PRODUCT_GROUPS.map(group => {
            const list = shownPacks.filter(p => (p.productType || "general") === group.type);
            if (list.length === 0) return null;
            return (
              <section key={group.type}>
                <SectionHead title={group.title} subtitle={searching ? null : group.subtitle} />
                <div className="px-4">
                  <div className="hgs-card hgs-list">
                    {list.map(pack => (
                      <PackRow key={pack._id} pack={pack} tint={group.color} onBuy={onBuyPack} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {!searching && orders.length > 0 && (
            <section>
              <SectionHead
                title={t("utilities.store.home.orders")}
                subtitle={t("utilities.store.home.ordersHint")}
              />
              <div className="px-4">
                <div className="hgs-card hgs-list">
                  {orders.slice(0, 8).map(order => (
                    <div key={order._id} className="hgs-row">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="hgs-ink truncate text-[17px] font-semibold tracking-[-0.01em]">
                          {order.productName}
                        </p>
                        <p className="hgs-dim truncate text-[13px]">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="hgs-ink text-[15px] font-semibold tabular-nums">
                          {moneyUnit(order.priceJoy)}
                        </p>
                        <p className="hgs-dim font-mono text-[11px]">{order.purchaseCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Số dư đóng trang — nhắc JOY từ đâu ra, không thúc mua thêm. */}
          {!searching && (
            <section className="px-4">
              <div className="hgs-balance">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white/75">{t("utilities.store.home.balance")}</p>
                  <JoyCoinBadge amount={balance} size="md" className="mt-1" />
                </div>
                <p className="max-w-[46%] text-right text-[13px] leading-snug text-white/75">
                  {t("utilities.store.home.balanceHint")}
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
