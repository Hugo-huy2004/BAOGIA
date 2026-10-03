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
  const paid = !pkg.freeTier;
  // Gói miễn cọc thay điều số 2 ("Cọc 50%") bằng "Không cần cọc".
  const policy = t("servicePkg.policy", OBJ).map((item, i) => (i === 1 && pkg.noDeposit ? t("servicePkg.policyNoDeposit", OBJ) : item));
  const tail = paid ? t("servicePkg.includesTail", OBJ) : [];

  return {
    ...pkg,
    title: t(`${base}.title`),
    lede: t(`${base}.lede`),
    seo: t(`${base}.seo`, OBJ),
    audience: t(`${base}.audience`, OBJ),
    includes: [t("servicePkg.handCoded", OBJ), ...t(`${base}.includes`, OBJ), ...tail],
    excludes: t("servicePkg.excludes", OBJ),
    warranty: t(`${base}.warranty`, OBJ),
    policy: paid ? [...policy, ...policyExtra] : policyExtra,
    price: t(`${base}.price`, OBJ),
    // Câu hỏi "nhích lên tí" chỉ dành cho gói trả phí; /student-pricing đọc chung nguồn này.
    faq: [...t(`${base}.faq`, OBJ), ...(paid ? t("servicePkg.faqShared", OBJ) : [])],
    // Icon ghép theo chỉ số, đúng thứ tự đã ghép chữ ở trên.
    icons: {
      audience: icons.audience,
      includes: [SHARED_ICONS.handCoded, ...icons.includes, ...(paid ? SHARED_ICONS.includesTail : [])],
      excludes: SHARED_ICONS.excludes,
      warranty: icons.warranty,
      policy: paid ? [...SHARED_ICONS.policy, ...icons.policyExtra] : icons.policyExtra,
    },
  };
}

/** Phần dùng chung cho mọi gói: điều kiện bảo hành, ghi chú giá, gói đính kèm, ưu đãi người học. */
export function useSharedServiceCopy() {
  const { t } = useTranslation();
  return {
    priceNotice: t("servicePkg.priceNotice", OBJ),
    addons: t("servicePkg.addons", OBJ),
    warrantyTerms: t("servicePkg.warrantyTerms", OBJ),
    warrantyExclusions: t("servicePkg.warrantyExclusions", OBJ),
    feedback: t("servicePkg.feedback", OBJ),
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
