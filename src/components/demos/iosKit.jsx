/**
 * Bộ dựng hình chuẩn iOS dùng chung cho toàn bộ demo trong trang Dịch vụ.
 *
 * Mỗi demo trước đây tự bịa màu, bo góc và cỡ chữ (nhiều chỗ 8–10px) nên nhìn
 * rời rạc và bẩn. Kit này khoá lại đúng ngôn ngữ hệ thống của iOS: bảng màu
 * system, type scale thật (body 17px), list dạng inset-grouped, thanh nav/tab
 * mờ nền, vùng chạm tối thiểu 44px. Demo chỉ còn khai báo nội dung + màu nhấn.
 *
 * ponytail: bo góc dùng border-radius thường thay cho squircle bằng SVG mask —
 * lệch không đáng kể ở kích thước này; đổi sang mask nếu cần phóng to.
 */
import { useEffect, useState } from "react";

const SCHEMES = {
  light: {
    "--ios-bg": "#F2F2F7",
    "--ios-elevated": "#FFFFFF",
    "--ios-surface": "#FFFFFF",
    "--ios-surface-2": "#F2F2F7",
    "--ios-sep": "rgba(60,60,67,0.29)",
    "--ios-label": "#000000",
    "--ios-label-2": "rgba(60,60,67,0.6)",
    "--ios-label-3": "rgba(60,60,67,0.3)",
    "--ios-fill": "rgba(120,120,128,0.12)",
    "--ios-fill-2": "rgba(120,120,128,0.08)",
    "--ios-chrome": "rgba(249,249,249,0.82)",
  },
  dark: {
    "--ios-bg": "#000000",
    "--ios-elevated": "#1C1C1E",
    "--ios-surface": "#1C1C1E",
    "--ios-surface-2": "#2C2C2E",
    "--ios-sep": "rgba(84,84,88,0.65)",
    "--ios-label": "#FFFFFF",
    "--ios-label-2": "rgba(235,235,245,0.6)",
    "--ios-label-3": "rgba(235,235,245,0.3)",
    "--ios-fill": "rgba(120,120,128,0.24)",
    "--ios-fill-2": "rgba(120,120,128,0.16)",
    "--ios-chrome": "rgba(28,28,30,0.8)",
  },
};

export const IOS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", system-ui, sans-serif';

export const vnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

/**
 * Khung ứng dụng: đặt token màu, font và nền hệ thống.
 *
 * `vars` đè lên bảng màu mặc định — HugoOS dùng nó để mỗi app sơn nền theo màu
 * riêng thay vì dùng chung một bảng xám. Demo không truyền gì thì không đổi.
 */
export function IosApp({ scheme = "light", accent = "#0A84FF", vars: overrides, children, className = "" }) {
  const vars = { ...SCHEMES[scheme] || SCHEMES.light, ...overrides, "--ax": accent, fontFamily: IOS_FONT };
  return (
    <div
      style={{ ...vars, background: "var(--ios-bg)", color: "var(--ios-label)", colorScheme: scheme }}
      className={`relative flex h-full w-full flex-col overflow-hidden text-[17px] leading-[1.29] antialiased ${className}`}
    >
      {children}
    </div>
  );
}

/** Thanh trạng thái iOS — chỉ hiện ở khung điện thoại/tablet. */
export function StatusBar({ show = true }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!show) return null;
  const label = time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <div className="relative z-40 flex h-[52px] shrink-0 select-none items-end justify-between px-6 pb-1.5 text-[15px] font-semibold tracking-[-0.01em]">
      <span>{label}</span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11.2 6 8.9a3 3 0 0 1 4 0l-2 2.3Zm-4-4.6-1.6-1.8a8.2 8.2 0 0 1 11.2 0L12 6.6a6 6 0 0 0-8 0Z" /><path d="M8 0a11 11 0 0 1 7.6 3l-1.5 1.7a8.8 8.8 0 0 0-12.2 0L.4 3A11 11 0 0 1 8 0Z" opacity=".9" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity=".38" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><path d="M23.5 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" opacity=".5" /></svg>
      </span>
    </div>
  );
}

/**
 * Thanh điều hướng: mờ nền khi cuộn, tiêu đề lớn thu nhỏ dần như iOS.
 * `scrolled` do vùng nội dung báo lên (xem `useScrolled`).
 */
export function NavBar({ title, subtitle, large = true, left, right, scrolled = false }) {
  return (
    <header
      className="sticky top-0 z-30 shrink-0 px-4 transition-all"
      style={{
        background: scrolled ? "var(--ios-chrome)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: `0.5px solid ${scrolled ? "var(--ios-sep)" : "transparent"}`,
      }}
    >
      <div className="flex min-h-[44px] items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">{left}</div>
        <span
          className="pointer-events-none max-w-[55%] truncate text-[17px] font-semibold transition-opacity duration-200"
          style={{ opacity: large ? (scrolled ? 1 : 0) : 1 }}
        >
          {title}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">{right}</div>
      </div>
      {large && (
        <div
          className="overflow-hidden pb-1 transition-all duration-200"
          style={{ opacity: scrolled ? 0 : 1, maxHeight: scrolled ? 0 : "5rem" }}
        >
          <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.028em]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[15px]" style={{ color: "var(--ios-label-2)" }}>{subtitle}</p>}
        </div>
      )}
    </header>
  );
}

/** Vùng nội dung cuộn được, tự báo trạng thái đã cuộn cho NavBar. */
export function Scroll({ onScrolledChange, children, className = "" }) {
  return (
    <div
      onScroll={(e) => onScrolledChange?.(e.currentTarget.scrollTop > 8)}
      className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  );
}

/** Thanh tab dưới cùng, mờ nền như iOS. */
export function TabBar({ items, value, onChange }) {
  return (
    <nav
      className="relative z-30 flex shrink-0 items-start justify-around px-2 pb-5 pt-2"
      style={{
        background: "var(--ios-chrome)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "0.5px solid var(--ios-sep)",
      }}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={active ? "page" : undefined}
            className="relative flex min-h-[44px] min-w-[52px] flex-col items-center justify-start gap-0.5 rounded-xl px-2 transition-opacity active:opacity-50"
            style={{ color: active ? "var(--ax)" : "var(--ios-label-2)" }}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute right-1 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[11px] font-semibold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Khung ứng dụng hai dạng: điện thoại (status bar + nav + tab bar dưới) và
 * desktop (sidebar trái + thanh công cụ trên). Demo chỉ khai báo một danh sách
 * tab duy nhất, không phải viết hai bộ điều hướng.
 */
export function AppShell({ isMobile, brand, tabs, value, onChange, title, subtitle, actions, sidebarNote, bottomBar, children }) {
  const [scrolled, setScrolled] = useState(false);

  if (isMobile) {
    return (
      <>
        <StatusBar show />
        <NavBar
          scrolled={scrolled}
          title={title}
          subtitle={subtitle}
          left={brand?.icon ? <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--ax)" }}>{brand.icon}</span> : null}
          right={actions}
        />
        <Scroll onScrolledChange={setScrolled} className="px-4 pb-6">{children}</Scroll>
        {bottomBar && <div className="px-4 pb-2">{bottomBar}</div>}
        <TabBar items={tabs} value={value} onChange={onChange} />
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className="flex w-[212px] shrink-0 flex-col px-3 py-4"
        style={{ background: "var(--ios-surface)", borderRight: "0.5px solid var(--ios-sep)" }}
      >
        <div className="flex items-center gap-2 px-2 pb-4">
          {brand?.icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "var(--ax)" }}>
              <span className="material-symbols-outlined text-[20px] text-white">{brand.icon}</span>
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{brand?.name}</span>
            {brand?.note && <span className="block truncate text-[12px]" style={{ color: "var(--ios-label-2)" }}>{brand.note}</span>}
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {tabs.map((tab) => {
            const active = value === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[38px] items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[15px] font-medium transition-colors"
                style={active ? { background: "var(--ax)", color: "#fff" } : { color: "var(--ios-label)" }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {tab.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                    style={active ? { background: "rgba(255,255,255,0.28)", color: "#fff" } : { background: "#FF3B30", color: "#fff" }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {sidebarNote && <div className="mt-auto px-2 pt-4 text-[12px] leading-snug" style={{ color: "var(--ios-label-2)" }}>{sidebarNote}</div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex min-h-[54px] shrink-0 items-center justify-between gap-3 px-6"
          style={{ borderBottom: "0.5px solid var(--ios-sep)", background: "var(--ios-chrome)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-bold tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="truncate text-[13px]" style={{ color: "var(--ios-label-2)" }}>{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        </header>
        <Scroll onScrolledChange={setScrolled} className="px-6 py-5">{children}</Scroll>
        {bottomBar && (
          <div className="shrink-0 px-6 py-3" style={{ borderTop: "0.5px solid var(--ios-sep)" }}>{bottomBar}</div>
        )}
      </div>
    </div>
  );
}

/** Tiêu đề khối cho bố cục desktop. */
export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">{children}</h2>
      {action}
    </div>
  );
}

/** Segmented control (UISegmentedControl) với viên trượt. */
export function Segmented({ items, value, onChange, className = "" }) {
  return (
    <div
      className={`flex gap-0.5 rounded-[9px] p-0.5 ${className}`}
      style={{ background: "var(--ios-fill)" }}
      role="tablist"
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className="min-h-[32px] flex-1 truncate rounded-[7px] px-2 text-[13px] font-semibold transition-all active:scale-[0.97]"
            style={
              active
                ? { background: "var(--ios-elevated)", color: "var(--ios-label)", boxShadow: "0 3px 8px rgba(0,0,0,0.12)" }
                : { color: "var(--ios-label-2)" }
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Nhóm danh sách inset-grouped: tiêu đề chữ hoa nhỏ + thẻ bo góc. */
export function ListGroup({ header, footer, children, className = "" }) {
  return (
    <section className={className}>
      {header && (
        <h2 className="px-4 pb-1.5 text-[13px] font-normal uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>
          {header}
        </h2>
      )}
      <div className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
        {children}
      </div>
      {footer && (
        <p className="px-4 pt-1.5 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
          {footer}
        </p>
      )}
    </section>
  );
}

/** Một dòng trong ListGroup. Đường kẻ thụt vào đúng kiểu iOS. */
export function ListRow({ icon, iconBg, title, subtitle, value, trailing, chevron, onClick, danger, last }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 text-left transition-colors ${onClick ? "active:bg-[var(--ios-fill-2)]" : ""}`}
      style={{ minHeight: 44 }}
    >
      {icon && (
        <span
          className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[7px]"
          style={{ background: iconBg || "var(--ax)" }}
        >
          <span className="material-symbols-outlined text-[18px] text-white">{icon}</span>
        </span>
      )}
      <span className={`flex min-w-0 flex-1 items-center gap-3 py-2.5 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] tracking-[-0.01em]" style={{ color: danger ? "#FF3B30" : "var(--ios-label)" }}>
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
              {subtitle}
            </span>
          )}
        </span>
        {value && <span className="shrink-0 text-[17px]" style={{ color: "var(--ios-label-2)" }}>{value}</span>}
        {trailing}
        {chevron && (
          <span className="material-symbols-outlined shrink-0 text-[20px]" style={{ color: "var(--ios-label-3)" }} aria-hidden="true">
            chevron_right
          </span>
        )}
      </span>
    </Tag>
  );
}

/** Thẻ nội dung tự do (khác ListGroup ở chỗ có padding sẵn). */
export function Card({ children, className = "", padded = true, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`block w-full overflow-hidden rounded-[16px] text-left ${padded ? "p-4" : ""} ${onClick ? "transition-transform active:scale-[0.985]" : ""} ${className}`}
      style={{ background: "var(--ios-surface)" }}
    >
      {children}
    </Tag>
  );
}

const BTN_SIZES = {
  sm: "min-h-[34px] px-4 text-[15px] rounded-[10px]",
  md: "min-h-[44px] px-5 text-[17px] rounded-[12px]",
  lg: "min-h-[50px] px-6 text-[17px] rounded-[14px]",
};

/** Nút chuẩn iOS: filled / tinted / gray / plain. */
export function Button({ variant = "filled", size = "md", full, children, className = "", style: styleOverride, ...rest }) {
  const styles = {
    filled: { background: "var(--ax)", color: "#fff" },
    tinted: { background: "color-mix(in srgb, var(--ax) 15%, transparent)", color: "var(--ax)" },
    gray: { background: "var(--ios-fill)", color: "var(--ios-label)" },
    plain: { background: "transparent", color: "var(--ax)" },
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      style={{ ...styles, ...(rest.disabled ? { opacity: 0.4 } : null), ...styleOverride }}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold tracking-[-0.01em] transition-transform active:scale-[0.97] disabled:active:scale-100 ${BTN_SIZES[size]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

/** Công tắc iOS. */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? "#34C759" : "var(--ios-fill)" }}
    >
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-transform duration-200"
        style={{ left: 2, transform: `translateX(${checked ? 20 : 0}px)` }}
      />
    </button>
  );
}

/** Bộ tăng giảm số lượng. */
export function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-[9px] p-0.5" style={{ background: "var(--ios-fill)" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Giảm"
        className="flex h-8 w-9 items-center justify-center rounded-[7px] transition-transform active:scale-95 disabled:opacity-30"
        style={{ background: "var(--ios-elevated)" }}
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <span className="w-8 text-center text-[17px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Tăng"
        className="flex h-8 w-9 items-center justify-center rounded-[7px] transition-transform active:scale-95 disabled:opacity-30"
        style={{ background: "var(--ios-elevated)" }}
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
    </span>
  );
}

/** Ô tìm kiếm kiểu iOS. */
export function SearchField({ value, onChange, placeholder = "Tìm kiếm" }) {
  return (
    <label className="flex min-h-[36px] items-center gap-1.5 rounded-[10px] px-2" style={{ background: "var(--ios-fill)" }}>
      <span className="material-symbols-outlined text-[19px]" style={{ color: "var(--ios-label-2)" }} aria-hidden="true">search</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent p-0 text-[17px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Xoá" className="flex h-6 w-6 items-center justify-center">
          <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--ios-label-3)" }}>cancel</span>
        </button>
      )}
    </label>
  );
}

/** Ô nhập trong form dạng list-row. */
export function Field({ label, hint, ...rest }) {
  return (
    <label className="flex min-h-[44px] items-center gap-3 border-b-[0.5px] px-4 last:border-b-0" style={{ borderColor: "var(--ios-sep)" }}>
      <span className="w-[86px] shrink-0 text-[17px]">{label}</span>
      <input
        {...rest}
        className="w-full border-0 bg-transparent p-0 py-2.5 text-[17px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0"
      />
      {hint}
    </label>
  );
}

/** Sheet kéo từ dưới lên, có tay nắm và lớp nền mờ. */
export function Sheet({ open, onClose, title, children, action }) {
  return (
    <div className={`absolute inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Đóng"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-[20px] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ background: "var(--ios-bg)" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2">
          <span className="h-[5px] w-9 rounded-full" style={{ background: "var(--ios-label-3)" }} aria-hidden="true" />
        </div>
        <div className="flex min-h-[44px] shrink-0 items-center justify-between gap-2 px-4">
          <span className="truncate text-[17px] font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
            style={{ background: "var(--ios-fill)", color: "var(--ios-label-2)" }}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
        {action && (
          <div
            className="shrink-0 border-t-[0.5px] px-4 pb-6 pt-3"
            style={{ borderColor: "var(--ios-sep)", background: "var(--ios-chrome)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          >
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

/** Thông báo dạng capsule trượt từ trên xuống (kiểu Dynamic Island). */
export function Toast({ message, icon = "check_circle" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-3 z-[60] flex justify-center px-4 transition-all duration-300 ${message ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
      role="status"
      aria-live="polite"
    >
      <span className="flex max-w-full items-center gap-2 rounded-full bg-black/85 px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{icon}</span>
        <span className="truncate">{message}</span>
      </span>
    </div>
  );
}

/** Hook toast dùng chung: `const [toast, showToast] = useToast()`. */
export function useToast(ms = 2200) {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(id);
  }, [toast, ms]);
  return [toast, setToast];
}

/** Thanh tiến trình mảnh. */
export function ProgressBar({ value, tint }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--ios-fill)" }}>
      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${value}%`, background: tint || "var(--ax)" }} />
    </span>
  );
}

/** Nhãn trạng thái nhỏ. */
export function Chip({ children, tint, filled }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={
        filled
          ? { background: tint || "var(--ax)", color: "#fff" }
          : { background: `color-mix(in srgb, ${tint || "var(--ax)"} 15%, transparent)`, color: tint || "var(--ax)" }
      }
    >
      {children}
    </span>
  );
}
