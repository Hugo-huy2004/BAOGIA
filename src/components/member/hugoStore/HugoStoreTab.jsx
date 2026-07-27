import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCartStore } from "../../../stores/cartStore";
import BackButton from "../shared/BackButton";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import StoreFeedView from "./StoreFeedView";
import StoreCheckout from "./StoreCheckout";
import { StoreFeed } from "./storeFeed";
import { money } from "./storeData";
import "./hugo-store.css";

const API = import.meta.env.VITE_API_URL || "/api";
const SAVED_PROMOS_KEY = "hugo_store_promos";

const readSavedPromos = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_PROMOS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

/**
 * Hugo Store chạy như một ứng dụng độc lập: chiếm trọn màn hình, không có
 * thanh tab hệ thống, lối ra duy nhất là nút quay lại ở góc trái.
 *
 * Trang không chia tab. Nội dung do `StoreFeed` tự quyết định bày cái gì
 * (xem `storeFeed.js`) — chưa mua gì thì không có mục "Đã mua", đang tìm
 * kiếm thì cả trang nhường chỗ cho kết quả.
 */
export default function HugoStoreTab({ bio, showToast, onBioUpdate, onBack, onOpenUtility }) {
  const { t } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promos, setPromos] = useState(readSavedPromos);
  const [promoDraft, setPromoDraft] = useState("");
  const [savingPromo, setSavingPromo] = useState(false);
  const sentinelRef = useRef(null);

  const items = useCartStore(s => s.items);
  const sync = useCartStore(s => s.sync);
  const addItem = useCartStore(s => s.addItem);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const dockTotal = items.reduce((sum, i) => sum + i.priceJoy * i.quantity, 0);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/utility-store/products`)
      .then(r => r.json())
      .then(d => { if (alive) setProducts(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!bio?.email) return;
    let alive = true;
    sync(bio.email);
    fetch(`${API}/store/orders`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (alive) setOrders(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bio?.email, sync]);

  // Header chỉ kẻ viền dưới khi nội dung đã trượt lên.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sheet mở thì giấu mọi thanh điều hướng còn sót của portal.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: checkoutOpen } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [checkoutOpen]);

  // Một hành động duy nhất cho mọi sản phẩm: thêm vào giỏ rồi mở thẳng trang
  // thanh toán. Không có bước "xem giỏ" riêng — sửa số lượng ngay trong sheet.
  const handleBuy = useCallback(async (product) => {
    if (product) {
      try {
        await addItem(bio?.email, product);
      } catch (e) {
        showToast?.(e.message || "Không thêm được vào giỏ", "error");
        return;
      }
    }
    setCheckoutOpen(true);
  }, [addItem, bio?.email, showToast]);

  const handleSavePromo = useCallback(async () => {
    const code = promoDraft.trim();
    if (!code) return;
    setSavingPromo(true);
    try {
      const r = await fetch(`${API}/store/promos/validate?code=${encodeURIComponent(code)}`, {
        credentials: "include",
      });
      const data = await r.json();
      if (!data.valid) {
        showToast?.(data.error || "Mã không hợp lệ", "error");
        return;
      }
      setPromos(prev => {
        if (prev.some(p => p.code === data.promo.code)) return prev;
        const next = [...prev, data.promo];
        localStorage.setItem(SAVED_PROMOS_KEY, JSON.stringify(next));
        return next;
      });
      setPromoDraft("");
      showToast?.(`Đã lưu mã ${data.promo.code}`, "success");
    } catch {
      showToast?.("Không kiểm tra được mã", "error");
    } finally {
      setSavingPromo(false);
    }
  }, [promoDraft, showToast]);

  const handleForgetPromo = useCallback((code) => {
    setPromos(prev => {
      const next = prev.filter(p => p.code !== code);
      localStorage.setItem(SAVED_PROMOS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const sections = useMemo(
    () => new StoreFeed({
      products,
      orders,
      promos,
      query: search.trim().toLowerCase(),
      balance: bio?.joyBalance || 0,
    }).compose(),
    [products, orders, promos, search, bio?.joyBalance]
  );

  const cartIds = useMemo(() => new Set(items.map(i => i.productId)), [items]);

  return (
    <div className="hgs flex h-full min-h-0 flex-col text-left">
      {/* ── Header ứng dụng: quay lại · tên · số dư · tìm kiếm ───────────── */}
      <header data-scrolled={scrolled} className="hgs-header shrink-0 px-4 pb-3">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={onBack}
            iconOnly
            className="rounded-[14px] border border-[var(--hgs-line)] bg-[var(--hgs-surface)]"
          />
          <h1 className="hgs-ink min-w-0 flex-1 truncate text-[19px] font-bold tracking-[-0.01em]">
            {t("store.title", "Hugo Store")}
          </h1>
          {/* JOY giữ đồng xu vàng làm dấu hiệu ngữ nghĩa, chỉ bọc lại bằng
              viên nang phẳng cho khớp phần còn lại. */}
          <span className="hgs-card flex h-10 shrink-0 items-center rounded-full px-3">
            <JoyCoinBadge amount={bio?.joyBalance} size="sm" />
          </span>
        </div>

        <div className="relative mt-3">
          <span className="material-symbols-outlined hgs-dim pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("store.shop.search", "Tìm ứng dụng và gói dịch vụ")}
            className="hgs-input pl-11 pr-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Xoá tìm kiếm"
              className="hgs-dim absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Dòng nội dung ────────────────────────────────────────────────── */}
      <div className={`min-h-0 flex-1 overflow-y-auto pt-4 ${itemCount > 0 ? "pb-32" : "pb-10"}`}>
        <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
        <StoreFeedView
          sections={sections}
          cartIds={cartIds}
          onOpenUtility={onOpenUtility}
          onBuy={handleBuy}
          promoDraft={promoDraft}
          onPromoDraft={setPromoDraft}
          onSavePromo={handleSavePromo}
          onForgetPromo={handleForgetPromo}
          savingPromo={savingPromo}
        />
      </div>

      {/* ── Dock giỏ hàng: một chạm là tới trang thanh toán ──────────────── */}
      {itemCount > 0 && !checkoutOpen && (
        <div className="hgs-dock fixed inset-x-0 z-40 px-4">
          <button
            type="button"
            onClick={() => handleBuy()}
            className="hgs-violet mx-auto flex h-16 w-full max-w-md items-center gap-3 px-4 text-left transition-transform active:scale-[0.98]"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/18">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              <span className="absolute -right-1.5 -top-1.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[var(--hgs-accent-press)]">
                {itemCount}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{itemCount} món trong giỏ</span>
              <span className="block text-[12.5px] text-white/75">Tạm tính {money(dockTotal)} JOY</span>
            </span>
            <span className="flex h-10 shrink-0 items-center rounded-full bg-white px-4 text-[14px] font-bold text-[var(--hgs-accent-press)]">
              Thanh toán
            </span>
          </button>
        </div>
      )}

      {checkoutOpen && (
        <StoreCheckout
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          onClose={() => setCheckoutOpen(false)}
          onDone={(result) => {
            setCheckoutOpen(false);
            // Đơn mới hiện ngay ở mục "Đã mua" mà không cần gọi lại API.
            if (result?.orders?.length) setOrders(prev => [...result.orders, ...prev]);
          }}
        />
      )}
    </div>
  );
}
