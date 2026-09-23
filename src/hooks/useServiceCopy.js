import { useTranslation } from "react-i18next";
import { findServicePackage, servicePackages } from "../data/servicePackages";
import { PACKAGE_ICONS, SHARED_ICONS } from "../data/serviceIcons";

/**
 * Chữ nghĩa của các gói dịch vụ, lấy theo ngôn ngữ đang chọn.
 *
 * `src/data/servicePackages.js` chỉ còn giữ phần KHÔNG dịch: mã gói, đường
 * dẫn, màu nhận diện, tên gói. Toàn bộ câu chữ nằm trong `servicePkg.*` của
 * translation.json (vi/en/zh) — sửa lời thì sửa ở đó, ba ngôn ngữ cùng khoá.
 *
 * Hai phép ghép nằm ở đây thay vì rải trong trang:
 *   • "Mã nguồn viết tay 100%" luôn đứng đầu mục Gói bao gồm của mọi gói;
 *   • gói trả phí dùng 4 điều chính sách chung rồi mới tới điều riêng, còn gói
 *     miễn phí (`freeTier`) chỉ có điều riêng — dán điều khoản đặt cọc vào một
 *     gói không mất tiền là sai và mất tin.
 */

const OBJ = { returnObjects: true };

export function useServiceCopy(idOrSlug) {
  const { t } = useTranslation();
  const pkg = findServicePackage(idOrSlug);
  if (!pkg) return null;

  const base = `servicePkg.items.${pkg.id}`;
  const policyExtra = t(`${base}.policyExtra`, OBJ) || [];
  const icons = PACKAGE_ICONS[pkg.id] || { audience: [], includes: [], warranty: [], policyExtra: [] };

  return {
    ...pkg,
    title: t(`${base}.title`),
    lede: t(`${base}.lede`),
    intro: t(`${base}.intro`, OBJ),
    audience: t(`${base}.audience`, OBJ),
    includes: [t("servicePkg.handCoded", OBJ), ...t(`${base}.includes`, OBJ)],
    // Gói đã gộp Gói kết nối vào giá thì không được liệt kê nó ở "chưa bao gồm".
    excludes: pkg.connectIncluded
      ? t("servicePkg.excludes", OBJ)
      : [...t("servicePkg.excludes", OBJ), t("servicePkg.connectExclude", OBJ)],
    warranty: t(`${base}.warranty`, OBJ),
    policy: pkg.freeTier ? policyExtra : [...t("servicePkg.policy", OBJ), ...policyExtra],
    price: t(`${base}.price`, OBJ),
    faq: t(`${base}.faq`, OBJ),
    // Icon ghép theo chỉ số, đúng thứ tự đã ghép chữ ở trên.
    icons: {
      audience: icons.audience,
      includes: [SHARED_ICONS.handCoded, ...icons.includes],
      excludes: pkg.connectIncluded ? SHARED_ICONS.excludes : [...SHARED_ICONS.excludes, SHARED_ICONS.connectExclude],
      warranty: icons.warranty,
      policy: pkg.freeTier ? icons.policyExtra : [...SHARED_ICONS.policy, ...icons.policyExtra],
    },
  };
}

/** Phần dùng chung cho mọi gói: gói kết nối, gói chăm sóc, ghi chú giá, phí phát sinh, ưu đãi người học. */
export function useSharedServiceCopy() {
  const { t } = useTranslation();
  return {
    connect: t("servicePkg.connect", OBJ),
    priceNotice: t("servicePkg.priceNotice", OBJ),
    extraFees: t("servicePkg.extraFees", OBJ),
    care: t("servicePkg.care", OBJ),
    compare: t("servicePkg.compare", OBJ),
    stats: t("servicePkg.stats", OBJ),
    studentDiscount: { ...t("servicePkg.studentDiscount", OBJ), href: "/student-pricing" },
  };
}

/** Danh sách gói kèm tiêu đề đã dịch — cho trang /services và phim cuộn. */
export function useServicePackageList() {
  const { t } = useTranslation();
  return servicePackages.map((pkg) => ({
    ...pkg,
    title: t(`servicePkg.items.${pkg.id}.title`),
    lede: t(`servicePkg.items.${pkg.id}.lede`),
  }));
}
