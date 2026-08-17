/**
 * Tiêu đề một nhóm nội dung, cỡ 22px như tiêu đề nhóm của App Store.
 *
 * `onAction` có thì tiêu đề thành nút và mọc chevron — iOS chỉ vẽ mũi tên khi
 * thật sự bấm được, nên đừng thêm chevron cho đẹp.
 */
export default function SectionHead({ title, subtitle, onAction }) {
  if (!title) return null;

  const head = (
    <>
      <span className="hgs-section-title">{title}</span>
      {onAction && (
        <span className="material-symbols-outlined hgs-dim ml-0.5 text-[22px]">chevron_right</span>
      )}
    </>
  );

  return (
    <div className="mb-2.5 px-4">
      {onAction ? (
        <button type="button" onClick={onAction} className="flex items-center">
          {head}
        </button>
      ) : (
        <div className="flex items-center">{head}</div>
      )}
      {subtitle && <p className="hgs-dim mt-0.5 text-[13px] leading-snug">{subtitle}</p>}
    </div>
  );
}
