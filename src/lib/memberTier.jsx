import { memberAge, ADULT_AGE } from "./memberAge";

// Bản client của server/utils/memberTier.js — chỉ để hiển thị nhãn. Mọi quyền
// lợi (ngày duy trì, voucher) đều do server cấp, đây không phải nguồn sự thật.
export const MEMBER_MIN_AGE = 14;

export const TIER_META = {
  star14: { label: "Star-14", icon: "star_half", hint: "Thành viên 14 đến dưới 18 tuổi" },
  star18: { label: "Star-18", icon: "star", hint: "Thành viên từ đủ 18 tuổi" },
  starVip: { label: "Star-VIP", icon: "workspace_premium", hint: "Thành viên danh dự do Hugo Studio trao" },
};

/** null = chưa khai ngày sinh hoặc chưa đủ tuổi thành viên. */
export function memberTier(bio) {
  if (bio?.starVip) return "starVip";
  const age = memberAge(bio);
  if (age === null) return null;
  if (age >= ADULT_AGE) return "star18";
  if (age >= MEMBER_MIN_AGE) return "star14";
  return null;
}

/** Nhãn hạng thành viên. Dùng chung ở portal, trang quà và bảng quản trị. */
export function TierBadge({ tier, className = "" }) {
  const meta = TIER_META[tier];
  if (!meta) return null;
  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
