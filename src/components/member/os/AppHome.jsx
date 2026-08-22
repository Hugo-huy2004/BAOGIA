/**
 * HugoOS — bộ dựng trang chủ ứng dụng.
 *
 * Mỗi app trong HugoOS phải có một trang chủ: chỗ nói app này làm được gì,
 * việc đang dở là gì và bấm tiếp vào đâu. Trước đây app nào cũng thả người dùng
 * thẳng vào một danh sách công cụ trần, nên app nào cũng "mỏng" như nhau dù bên
 * trong có nhiều thứ.
 *
 * Ở đây trang chủ là bốn khối khai báo — hero, việc dở, lưới hành động nhanh,
 * mục nội dung — chứ không phải một màn hình phải thiết kế lại từ đầu cho từng
 * app. Thêm tính năng nghĩa là thêm một ô trong QuickGrid, không phải dựng lại
 * bố cục.
 *
 * ponytail: dùng token màu của iosKit (--ios-*) như AppFrame, không tự bịa
 * bảng màu riêng.
 */

/** Khối mở đầu: app là gì, số liệu nổi bật, một nút hành động chính. */
export function HomeHero({ icon, title, tagline, stat, statLabel, action, actionLabel, onAction }) {
  return (
    <section
      className="mb-5 overflow-hidden rounded-[18px] p-5"
      style={{ background: "var(--ios-surface)" }}
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <span
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--ax)" }}
          >
            <span className="material-symbols-outlined text-[28px] text-white" aria-hidden="true">{icon}</span>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em]">{title}</h2>
          {tagline && (
            <p className="mt-1 text-[15px] leading-snug" style={{ color: "var(--ios-label-2)" }}>{tagline}</p>
          )}
        </div>
      </div>

      {stat != null && (
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[32px] font-bold tabular-nums leading-none tracking-[-0.03em]">{stat}</span>
          {statLabel && <span className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>{statLabel}</span>}
        </div>
      )}

      {(action || (actionLabel && onAction)) && (
        <div className="mt-4">
          {action || (
            <button
              type="button"
              onClick={onAction}
              className="min-h-[44px] w-full rounded-[12px] px-5 text-[17px] font-semibold text-white transition-transform active:scale-[0.985]"
              style={{ background: "var(--ax)" }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Tiêu đề mục + hành động phụ bên phải. */
export function HomeSection({ title, actionLabel, onAction, children, className = "" }) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || actionLabel) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
          {title && <h3 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h3>}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 text-[15px] font-medium"
              style={{ color: "var(--ax)" }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Lưới hành động nhanh. `items`: { id, icon, label, hint, badge, onClick }.
 * Hai cột trên điện thoại, bốn cột từ tablet trở lên.
 */
export function QuickGrid({ items = [], columns = 2 }) {
  if (!items.length) return null;
  return (
    <div className={`grid gap-2.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"} sm:grid-cols-4`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          disabled={item.disabled}
          className="relative flex min-h-[104px] flex-col items-start gap-2 rounded-[16px] p-3.5 text-left transition-transform active:scale-[0.97] disabled:opacity-40"
          style={{ background: "var(--ios-surface)" }}
        >
          <span
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px]"
            style={{ background: "var(--ios-fill)" }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ax)" }} aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-tight">{item.label}</span>
            {item.hint && (
              <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
                {item.hint}
              </span>
            )}
          </span>
          {item.badge && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-[#FF3B30] px-1.5 text-[11px] font-semibold leading-[17px] text-white">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Thẻ "tiếp tục việc đang dở" — thứ khiến app nhớ người dùng đã làm tới đâu. */
export function ContinueCard({ icon, label, title, subtitle, progress, onClick, actionLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[16px] p-4 text-left transition-transform active:scale-[0.985]"
      style={{ background: "var(--ios-surface)" }}
    >
      {icon && (
        <span
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px]"
          style={{ background: "var(--ios-fill)" }}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--ax)" }} aria-hidden="true">{icon}</span>
        </span>
      )}
      <span className="min-w-0 flex-1">
        {label && (
          <span className="block text-[12px] font-semibold uppercase tracking-[0.04em]" style={{ color: "var(--ios-label-2)" }}>
            {label}
          </span>
        )}
        <span className="mt-0.5 block truncate text-[17px] font-semibold tracking-[-0.01em]">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[13px]" style={{ color: "var(--ios-label-2)" }}>{subtitle}</span>
        )}
        {typeof progress === "number" && (
          <span className="mt-2 block h-[5px] w-full overflow-hidden rounded-full" style={{ background: "var(--ios-fill)" }}>
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: "var(--ax)" }}
            />
          </span>
        )}
      </span>
      <span className="shrink-0 text-[15px] font-medium" style={{ color: "var(--ax)" }}>
        {actionLabel || <span className="material-symbols-outlined text-[22px]" aria-hidden="true">chevron_right</span>}
      </span>
    </button>
  );
}

/** Dải số liệu ba ô — trạng thái app trong một liếc mắt. */
export function StatStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <div key={item.id} className="rounded-[14px] p-3 text-center" style={{ background: "var(--ios-surface)" }}>
          <p className="text-[20px] font-bold tabular-nums leading-tight tracking-[-0.02em]">{item.value}</p>
          <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--ios-label-2)" }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Trạng thái rỗng dùng chung, thay cho mỗi app tự vẽ một kiểu. */
export function EmptyState({ icon = "inbox", title, body, actionLabel, onAction }) {
  return (
    <div className="rounded-[16px] px-6 py-10 text-center" style={{ background: "var(--ios-surface)" }}>
      <span className="material-symbols-outlined text-[40px]" style={{ color: "var(--ios-label-3)" }} aria-hidden="true">{icon}</span>
      {title && <p className="mt-2 text-[17px] font-semibold">{title}</p>}
      {body && <p className="mt-1 text-[15px] leading-snug" style={{ color: "var(--ios-label-2)" }}>{body}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[44px] rounded-[12px] px-5 text-[17px] font-semibold"
          style={{ background: "var(--ios-fill)", color: "var(--ax)" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
