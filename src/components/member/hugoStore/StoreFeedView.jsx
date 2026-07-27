import UtilityAppIcon from "../utilities/UtilityAppIcon";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import { GRADIENTS, perkLabel, money } from "./storeData";

/**
 * Lớp vẽ của cửa hàng.
 *
 * Không chứa quyết định "hiện cái gì" — cái đó là việc của `storeFeed.js`.
 * Ở đây chỉ có: một mô tả `kind` ↔ một cách vẽ.
 */

function SectionHead({ title, subtitle, action, onAction }) {
  if (!title) return null;
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className="hgs-ink truncate text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="hgs-dim truncate text-[13px]">{subtitle}</p>}
      </div>
      {action && (
        <button type="button" onClick={onAction} className="hgs-accent-text shrink-0 pb-0.5 text-[14px] font-semibold">
          {action}
        </button>
      )}
    </div>
  );
}

function AppRow({ app, onOpen }) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="medium" />
      <div className="min-w-0 flex-1">
        <p className="hgs-ink truncate text-[15px] font-semibold">{app.label}</p>
        <p className="hgs-dim truncate text-[12.5px]">{app.tagline}</p>
      </div>
      <button type="button" onClick={() => onOpen?.(app.id)} className="hgs-pill">
        Mở
      </button>
    </div>
  );
}

function PackRow({ pack, onBuy, inCart }) {
  const soldOut = pack.stock !== -1 && pack.stock <= 0;
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--hgs-accent-soft)]">
        <span className="material-symbols-outlined hgs-accent-text text-[21px]">{pack.icon || "redeem"}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="hgs-ink truncate text-[15px] font-semibold">{pack.name}</p>
        <p className="hgs-dim truncate text-[12.5px]">
          {perkLabel(pack) || pack.description || "Vật phẩm cửa hàng"}
        </p>
      </div>
      <button type="button" disabled={soldOut} onClick={() => onBuy?.(pack)} className="hgs-pill">
        {soldOut ? "Hết" : inCart ? "Mua thêm" : money(pack.priceJoy)}
      </button>
    </div>
  );
}

/* ── Từng loại section ────────────────────────────────────────────────── */

function Spotlight({ section, onOpenUtility }) {
  const app = section.app;
  return (
    <section className="px-4">
      <div className="hgs-violet p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">
          Ứng dụng trong ngày
        </p>
        <h2 className="mt-1.5 text-[24px] font-bold leading-tight">{app.label}</h2>
        <p className="mt-1.5 max-w-[24ch] text-[14.5px] leading-snug text-white/80">{app.tagline}</p>

        <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-white/14 p-2.5">
          <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="medium" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{app.label}</p>
            <p className="truncate text-[12.5px] text-white/70">Có sẵn trong gói của bạn</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenUtility?.(app.id)}
            className="hgs-btn h-11 shrink-0 bg-white text-[var(--hgs-accent-press)]"
          >
            Mở ngay
          </button>
        </div>
      </div>
    </section>
  );
}

function FeaturedPack({ section, onBuy }) {
  const pack = section.pack;
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--hgs-accent-soft)]">
              <span className="material-symbols-outlined hgs-accent-text text-[24px]">
                {pack.icon || "redeem"}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="hgs-ink text-[17px] font-bold leading-snug">{pack.name}</h3>
              <p className="hgs-dim mt-0.5 line-clamp-2 text-[13.5px] leading-snug">
                {perkLabel(pack) || pack.description || "Vật phẩm cửa hàng"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="hgs-dim text-[12px]">Giá</p>
              <p className="hgs-ink text-[19px] font-bold tabular-nums">
                {money(pack.priceJoy)} <span className="text-[13px] font-semibold">JOY</span>
              </p>
            </div>
            <button type="button" onClick={() => onBuy?.(pack)} className="hgs-btn hgs-btn--primary shrink-0">
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppRail({ section, onOpenUtility }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="hgs-rail gap-3 px-4 pb-1">
        {section.apps.map(app => (
          <button
            key={app.id}
            type="button"
            onClick={() => onOpenUtility?.(app.id)}
            className="hgs-card w-[170px] p-4 text-left transition-transform active:scale-[0.97]"
          >
            <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="large" />
            <p className="hgs-ink mt-3 truncate text-[15px] font-bold">{app.label}</p>
            <p className="hgs-dim mt-0.5 line-clamp-2 h-[34px] text-[12.5px] leading-snug">{app.tagline}</p>
            <span className="hgs-pill mt-3 w-full">Mở</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PackList({ section, onBuy, cartIds }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-card hgs-divide overflow-hidden">
          {section.packs.map(pack => (
            <PackRow key={pack._id} pack={pack} onBuy={onBuy} inCart={cartIds.has(pack._id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchResults({ section, onOpenUtility, onBuy, cartIds }) {
  const nothing = section.apps.length === 0 && section.packs.length === 0;
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      {nothing ? (
        <div className="px-4 pb-6 pt-2 text-center">
          <span className="material-symbols-outlined hgs-dim text-[40px]">search_off</span>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {section.apps.length > 0 && (
            <div className="hgs-card hgs-divide overflow-hidden">
              {section.apps.map(app => (
                <AppRow key={app.id} app={app} onOpen={onOpenUtility} />
              ))}
            </div>
          )}
          {section.packs.length > 0 && (
            <div className="hgs-card hgs-divide overflow-hidden">
              {section.packs.map(pack => (
                <PackRow key={pack._id} pack={pack} onBuy={onBuy} inCart={cartIds.has(pack._id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PromoWallet({ section, promoDraft, onPromoDraft, onSavePromo, onForgetPromo, savingPromo }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="space-y-3 px-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={promoDraft}
            onChange={e => onPromoDraft(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && onSavePromo()}
            placeholder="Nhập mã của bạn"
            className="hgs-input min-w-0 flex-1 px-4 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
          />
          <button
            type="button"
            onClick={onSavePromo}
            disabled={savingPromo || !promoDraft.trim()}
            className="hgs-btn hgs-btn--soft h-[46px] shrink-0"
          >
            {savingPromo ? "..." : "Lưu mã"}
          </button>
        </div>

        {section.promos.length > 0 && (
          <div className="hgs-card hgs-divide overflow-hidden">
            {section.promos.map(promo => (
              <div key={promo.code} className="flex items-center gap-3 p-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-500/12 text-amber-600 dark:text-amber-400">
                  <span className="material-symbols-outlined text-[21px]">confirmation_number</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="hgs-ink truncate font-mono text-[15px] font-bold tracking-wider">{promo.code}</p>
                  <p className="hgs-dim truncate text-[12.5px]">
                    {promo.discountType === "percent"
                      ? `Giảm ${promo.discountValue}%`
                      : `Giảm ${money(promo.discountValue)} JOY`}
                    {promo.minOrderJoy > 0 ? ` · đơn từ ${money(promo.minOrderJoy)} JOY` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onForgetPromo(promo.code)}
                  aria-label={`Bỏ lưu ${promo.code}`}
                  className="hgs-dim flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                >
                  <span className="material-symbols-outlined text-[19px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Orders({ section }) {
  return (
    <section>
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <div className="px-4">
        <div className="hgs-card hgs-divide overflow-hidden">
          {section.orders.map(order => (
            <div key={order._id} className="flex items-center gap-3 p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-[21px]">check_circle</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="hgs-ink truncate text-[15px] font-semibold">{order.productName}</p>
                <p className="hgs-dim truncate text-[12.5px]">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="hgs-ink text-[14px] font-bold tabular-nums">{money(order.priceJoy)} JOY</p>
                <p className="hgs-dim font-mono text-[10.5px]">{order.purchaseCode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Balance({ section }) {
  return (
    <section className="px-4">
      <div className="hgs-card flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="hgs-dim text-[13px]">Số dư của bạn</p>
          <JoyCoinBadge amount={section.balance} size="md" className="mt-1" />
        </div>
        <p className="hgs-dim max-w-[46%] text-right text-[12px] leading-snug">
          Mọi thanh toán trong cửa hàng đều dùng JOY.
        </p>
      </div>
    </section>
  );
}

const RENDERERS = {
  spotlight: Spotlight,
  featuredPack: FeaturedPack,
  appRail: AppRail,
  packList: PackList,
  search: SearchResults,
  promoWallet: PromoWallet,
  orders: Orders,
  balance: Balance,
};

export default function StoreFeedView({ sections, ...handlers }) {
  return (
    <div className="space-y-7">
      {sections.map(section => {
        const Renderer = RENDERERS[section.kind];
        return Renderer ? <Renderer key={section.id} section={section} {...handlers} /> : null;
      })}
    </div>
  );
}
