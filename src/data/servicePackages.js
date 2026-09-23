/**
 * Nguồn DUY NHẤT cho 4 gói dịch vụ — phần KHÔNG dịch.
 *
 * Câu chữ (tiêu đề, mô tả, bao gồm, chưa bao gồm, bảo hành, chính sách, giá,
 * hỏi đáp) nằm trong `servicePkg.*` của `src/i18n/locales/<lang>/translation.json`
 * và đọc ra bằng `src/hooks/useServiceCopy.js`. Ba ngôn ngữ dùng chung khoá,
 * nên sửa lời ở một nơi là cả vi/en/zh cùng đổi cấu trúc.
 *
 * TÊN GÓI KHÔNG DỊCH. Hugo One / Hugo Story / Hugo Flow+ / Hugo Edu+ giữ
 * nguyên ở mọi ngôn ngữ, như cách Apple giữ iPhone và MacBook Air.
 *
 * `accent`/`accentDark` là màu nhận diện (nền sáng / nền tối), `gradient` là
 * cặp màu tô cho HẬU TỐ tên gói. Chỉ `PackageName` được đọc ba giá trị này —
 * đừng viết mã màu vào JSX, nếu không mỗi trang sẽ trôi một kiểu.
 *
 * Hugo Studio KHÔNG bán tên miền và KHÔNG bán hạ tầng lưu trữ / cơ sở dữ liệu.
 * Khách tự đứng tên mua; Hugo chỉ hỗ trợ chọn mua và nối vào website qua Gói
 * kết nối. Điều này nằm trong `servicePkg.connectExclude` dùng chung, và chỉ
 * hiện với gói KHÔNG có `connectIncluded` — Hugo One đã gộp phần đó vào giá.
 *
 * TUYỆT ĐỐI không viết câu so sánh giá hay chất lượng với bên cung cấp khác
 * ("agency báo X", "rẻ hơn Y"): khoản 10 Điều 8 Luật Quảng cáo 2012 cấm so
 * sánh trực tiếp, mức phạt với cá nhân là 40 – 60 triệu. Nói về mình thôi.
 * Và không nhắc tới thuế ở bất kỳ đâu — phần đó chủ dịch vụ tự xử lý.
 */

export const servicePackages = [
  {
    id: "hugo-one",
    slug: "hugo-one",
    eyebrow: "01 · Hugo One",
    name: "Hugo One",
    accent: "#0E9E96",
    accentDark: "#3FD9CE",
    gradient: ["#17EAD9", "#2F8FE0"],
    // Gói kết nối đã nằm trong giá: một con số trọn, không phát sinh lúc bàn
    // giao. Cờ này ẩn thẻ Gói kết nối và bỏ nó khỏi mục "chưa bao gồm".
    connectIncluded: true,
  },
  {
    id: "hugo-story",
    slug: "hugo-story",
    eyebrow: "02 · Hugo Story",
    name: "Hugo Story",
    accent: "#4257D6",
    accentDark: "#8CA0FF",
    gradient: ["#6078EA", "#A76CF2"],
  },
  {
    id: "hugo-flow-plus",
    slug: "hugo-flow-plus",
    eyebrow: "03 · Hugo Flow+",
    name: "Hugo Flow+",
    accent: "#C2571F",
    accentDark: "#FF9B62",
    gradient: ["#FFB05C", "#E3553D"],
  },
  {
    id: "hugo-edu-plus",
    slug: "hugo-edu-plus",
    eyebrow: "04 · Hugo Edu+",
    name: "Hugo Edu+",
    accent: "#B83A67",
    accentDark: "#FF8FB4",
    gradient: ["#FF8FB4", "#C03B8C"],
    // Không có trang /services/:slug riêng — điều hướng thẳng sang
    // /student-pricing, và không kế thừa chính sách thương mại của gói trả phí.
    freeTier: true,
    verifyHref: "/student-pricing",
  },
];

export function findServicePackage(slug) {
  return servicePackages.find((pkg) => pkg.slug === slug || pkg.id === slug);
}

export { findServicePackage as getServicePackage };
