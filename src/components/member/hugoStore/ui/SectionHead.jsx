/** Tiêu đề của một mảng nội dung trong cửa hàng. */
export default function SectionHead({ title, subtitle, action, onAction }) {
  if (!title) return null;
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className="hgs-ink truncate text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="hgs-dim truncate text-[13px]">{subtitle}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="hgs-accent-text shrink-0 pb-0.5 text-[14px] font-semibold"
        >
          {action}
        </button>
      )}
    </div>
  );
}
