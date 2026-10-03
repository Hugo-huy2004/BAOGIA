/** Khối dựng chung cho trang gói (/services/:slug) và trang gói lẻ (/services/add-ons/:slug). */

export function Section({ id, kicker, title, lede, children, muted = false }) {
  return (
    <section id={id} className={`scroll-mt-24 px-5 py-12 sm:px-8 sm:py-20 ${muted ? "bg-band" : "bg-background"}`}>
      <div className="mx-auto max-w-6xl">
        {kicker ? <p className="kicker text-hue-blue">{kicker}</p> : null}
        <h2 className="mt-2 max-w-3xl text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.1] font-semibold tracking-[-.04em]">{title}</h2>
        {lede ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{lede}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/**
 * Danh sách có icon nhỏ, hai cột từ `sm`. Thay cho lưới thẻ to cũ: mỗi thẻ
 * từng cao ~380px trên điện thoại, cả trang dài 17 màn hình (2026-09-28).
 */
export function IconList({ items, icons, fallbackIcon = "check" }) {
  return (
    <ul className="grid gap-x-10 border-t border-border sm:grid-cols-2">
      {items.map((item, i) => (
        <li key={item.title} className="flex gap-3.5 border-b border-border py-4">
          <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[19px] text-foreground">
            {icons?.[i] || fallbackIcon}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.95rem] font-semibold tracking-[-.01em]">{item.title}</span>
            <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">{item.body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
