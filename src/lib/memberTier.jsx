import { memberAge, ADULT_AGE } from "./memberAge";

// Bản client của server/utils/memberTier.js — chỉ để hiển thị nhãn. Mọi quyền
// lợi (ngày duy trì, voucher) đều do server cấp, đây không phải nguồn sự thật.
export const MEMBER_MIN_AGE = 14;
export { ADULT_AGE } from "./memberAge";
export const STAR_MAX_AGE = 23; // Star-18 đến hết tháng sinh nhật 23 tuổi

export const TIER_META = {
  star14: { label: "Star-14", icon: "star_half", hint: "Thành viên 14 đến dưới 18 tuổi" },
  star18: { label: "Star-18", icon: "star", hint: "Thành viên 18 đến hết tháng sinh nhật 23 tuổi" },
  starVip: { label: "Star-VIP", icon: "workspace_premium", hint: "Thành viên danh dự do Hugo Studio trao tặng" },
  eco: { label: "Eco", icon: "eco", hint: "Thành viên Eco (trên 23 tuổi hoặc dùng thử nghiệm)" },
};

/**
 * Kiểm tra xem đã qua hết tháng sinh nhật năm 23 tuổi chưa.
 * Thành viên Star-18 kết thúc vào cuối tháng sinh nhật tuổi 23.
 */
export function isPastStar18(birthYear, birthMonth) {
  const year = Number(birthYear);
  if (!Number.isInteger(year) || year < 1900) return true;
  const monthRaw = Number(birthMonth);
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : 12;
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const expYear = year + 23;
  if (curYear > expYear) return true;
  if (curYear === expYear && curMonth > month) return true;
  return false;
}

/** Phân loại hạng thành viên theo tuổi và trạng thái danh dự. */
export function memberTier(bio) {
  if (bio?.starVip) return "starVip";
  const age = memberAge(bio);
  if (age === null) return "eco";
  // Thành viên Star-18 chỉ từ 18 đến hết tháng sinh nhật 23 tuổi.
  // Qua tháng sinh nhật 23 tuổi (trên 23 tuổi) là hạng Eco.
  if (isPastStar18(bio?.birthYear, bio?.birthMonth)) return "eco";
  if (age >= ADULT_AGE) return "star18"; // 18 đến hết tháng sinh nhật 23 tuổi
  if (age >= MEMBER_MIN_AGE) return "star14"; // 14 đến dưới 18 tuổi
  return "eco";
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
