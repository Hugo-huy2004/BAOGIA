/**
 * Bộ khung dùng chung cho các tab của app Danh Thiếp (làm lại 26/10/2026).
 *
 * Trước đây mỗi tab tự vẽ thẻ, tiêu đề, công tắc theo kiểu riêng (chữ 10px
 * in hoa, nút xoá chỉ hiện khi rê chuột, chuỗi dài không ngắt nên đẩy cả màn
 * tràn ngang). Ba mảnh dưới đây là toàn bộ "ngôn ngữ" của app: nhóm, dòng,
 * công tắc — kiểu danh sách nhóm của Cài đặt iOS, phẳng, chữ ≥ 13px, chạm ≥ 44px.
 */

export function BioSection({ title, hint, aside, children, className = "" }) {
  return (
    <section className={`min-w-0 ${className}`}>
      {(title || aside) && (
        <div className="mb-2 flex items-end justify-between gap-3 px-1">
          {title && <h3 className="min-w-0 text-[15px] font-semibold text-foreground">{title}</h3>}
          {aside && <span className="shrink-0 text-[13px] text-muted-foreground">{aside}</span>}
        </div>
      )}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card">{children}</div>
      {hint && <p className="mt-2 px-1 text-[13px] leading-relaxed text-muted-foreground">{hint}</p>}
    </section>
  );
}

/**
 * Một dòng trong nhóm. `icon` là tên Material Symbol hoặc một phần tử React.
 * Phần chính bấm được (onClick/href) còn `trailing` đứng NGOÀI nó — để nút xoá
 * ở cuối dòng không thành nút lồng trong nút.
 */
export function BioRow({ icon, media, title, detail, trailing, onClick, href, danger = false }) {
  // `media`: phần tử tự lo khung (vd icon app của Thương Điếm), không bọc ô xám.
  const body = (
    <>
      {media}
      {!media && icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
          {typeof icon === "string" ? <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span> : icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{title}</span>
        {detail && <span className="block truncate text-[13px] text-muted-foreground">{detail}</span>}
      </span>
    </>
  );
  const main = "flex min-h-[56px] min-w-0 flex-1 items-center gap-3 py-2 text-left transition-opacity active:opacity-60";
  return (
    <div className="flex min-w-0 items-center gap-1 px-4 [&+&]:border-t [&+&]:border-border/50">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={main}>{body}</a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={main}>{body}</button>
      ) : (
        <div className={main}>{body}</div>
      )}
      {trailing}
    </div>
  );
}

export function BioToggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${checked ? "bg-primary" : "bg-muted-foreground/25"}`}
    >
      <span className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** Nút tròn nhỏ ở cuối dòng (mở, xoá…). */
export function BioIconButton({ icon, label, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40 ${danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted"}`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
    </button>
  );
}

export const bioInputClass =
  "block w-full min-w-0 bg-transparent px-4 py-3 text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none";
