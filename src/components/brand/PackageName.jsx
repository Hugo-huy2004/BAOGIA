import { findServicePackage } from "../../data/servicePackages";
import "./packageName.css";

/**
 * Tên gói dịch vụ, một kiểu duy nhất cho toàn hệ thống.
 *
 *   <PackageName id="hugo-one" />                       → Hugo One
 *   <PackageName id="hugo-flow-plus" variant="badge" /> → viên thuốc nền màu nhạt
 *   <PackageName id="hugo-story" prefix />              → 01 · Hugo Story
 *   <PackageName id="hugo-edu-plus" variant="plain" />  → chỉ chữ, không màu
 *   <PackageName id="hugo-one" size="inherit" />        → mượn cỡ chữ của tiêu đề
 *   <PackageName id="hugo-one" variant="lockup" caption="là gì." />
 *                                                       → "Hugo One" nổi khối
 *
 * Chữ "Hugo" giữ nguyên màu chữ của trang; chỉ HẬU TỐ (One, Story, Flow+,
 * Edu+) được tô gradient riêng. Bốn gói vì thế vừa phân biệt được với nhau,
 * vừa đọc ra là một nhà.
 *
 * Vì sao là component chứ không phải viết tay mỗi nơi: tên gói xuất hiện ở
 * trang dịch vụ, trang chi tiết, email báo giá và sau này là màn quản trị.
 * Đổi tên hay đổi màu một gói thì sửa `src/data/servicePackages.js`, mọi chỗ
 * dán component này đổi theo — không phải đi tìm từng chỗ.
 */

const SIZES = {
  xs: { text: "text-[0.7rem]", dot: "size-1", pad: "px-2 py-[.15rem]" },
  sm: { text: "text-xs", dot: "size-1.5", pad: "px-2.5 py-1" },
  md: { text: "text-sm", dot: "size-1.5", pad: "px-3 py-1.5" },
  lg: { text: "text-base", dot: "size-2", pad: "px-3.5 py-2" },
  // Nằm trong tiêu đề có sẵn: mượn nguyên cỡ chữ của tiêu đề, chỉ mang màu.
  inherit: { text: "text-[length:inherit] leading-[inherit] tracking-[inherit]", dot: "size-[.5em]", pad: "px-3 py-1.5" },
};

/** "Hugo Edu+" → ["Hugo", "Edu+"]. Tên một chữ thì phần tô gradient là cả tên. */
function splitName(name) {
  const at = name.indexOf(" ");
  return at === -1 ? ["", name] : [name.slice(0, at), name.slice(at + 1)];
}

export default function PackageName({
  id,
  variant = "inline",
  size = "md",
  dot = true,
  prefix = false,
  caption = "",
  className = "",
  as: Tag = "span",
}) {
  const pkg = findServicePackage(id);
  if (!pkg) return null;

  const scale = SIZES[size] || SIZES.md;
  const [house, suffix] = splitName(pkg.name);
  // Số thứ tự trong eyebrow ("01 · Hugo One") đứng riêng, tông nhạt.
  const order = prefix ? pkg.eyebrow.split("·")[0].trim() : "";
  const paint = `linear-gradient(100deg, ${pkg.gradient[0]}, ${pkg.gradient[1]})`;

  const body = (
    <>
      {dot ? <span aria-hidden style={{ backgroundImage: paint }} className={`${scale.dot} shrink-0 rounded-full`} /> : null}
      {order ? <span className="font-mono opacity-55">{order} ·</span> : null}
      {house ? <span>{house}&nbsp;</span> : null}
      <span style={{ backgroundImage: paint }} className="bg-clip-text text-transparent">{suffix}</span>
    </>
  );

  // Khối tên nổi: LUÔN là tên đầy đủ "Hugo <hậu tố>" — trang pháp lý, bảo hành
  // và hợp đồng phải đọc ra tên, không phải đoán qua một hình. Chú giải đi kèm
  // nhỏ và nhẹ hơn hẳn để mắt đọc tên gói trước.
  if (variant === "lockup") {
    return (
      <Tag className={className} style={{ "--pkg-paint": paint }}>
        <span className="pkg-lockup">
          {house ? <span className="pkg-lockup__house">{house}</span> : null}
          <span className="pkg-lockup__word">{suffix}</span>
        </span>
        {caption ? <span className="pkg-caption">{caption}</span> : null}
      </Tag>
    );
  }

  if (variant === "plain") {
    return <Tag className={`font-semibold tracking-[-.02em] ${scale.text} ${className}`}>{prefix ? pkg.eyebrow : pkg.name}</Tag>;
  }

  if (variant === "badge") {
    return (
      <Tag
        style={{ "--pkg-accent": pkg.accent, "--pkg-accent-dark": pkg.accentDark }}
        className={`inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pkg-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--pkg-accent)_9%,transparent)] font-semibold tracking-[-.01em] dark:border-[color-mix(in_srgb,var(--pkg-accent-dark)_32%,transparent)] dark:bg-[color-mix(in_srgb,var(--pkg-accent-dark)_14%,transparent)] ${scale.text} ${scale.pad} ${className}`}
      >
        {body}
      </Tag>
    );
  }

  return (
    <Tag className={`inline-flex items-center gap-1.5 font-semibold tracking-[-.02em] ${scale.text} ${className}`}>
      {body}
    </Tag>
  );
}
