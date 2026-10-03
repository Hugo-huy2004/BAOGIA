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
 * Khách tự đứng tên mua; việc NỐI chúng vào website đã nằm trong giá của mọi
 * gói trả phí (2026-09-28: bỏ "Gói kết nối" tính riêng — một con số trọn).
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
    // Làm trước, trả sau: không cọc, thanh toán đủ khi nghiệm thu (user chốt
    // 2026-09-28). useServiceCopy thay điều "Cọc 50%" bằng servicePkg.policyNoDeposit.
    noDeposit: true,
  },
  {
    id: "hugo-story",
    slug: "hugo-story",
    eyebrow: "02 · Hugo Story",
    name: "Hugo Story",
    accent: "#4257D6",
    accentDark: "#8CA0FF",
    gradient: ["#6078EA", "#A76CF2"],
    // Gói gợi ý mặc định: nhãn nói theo NHU CẦU ("hợp với quán, doanh nghiệp
    // nhỏ"), không ghi "được chọn nhiều nhất" khi chưa có số liệu đơn hàng.
    recommended: true,
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

/**
 * Tiền niêm yết luôn là VNĐ, ở MỌI ngôn ngữ: Pháp lệnh Ngoại hối cấm niêm yết,
 * quảng cáo giá bằng ngoại tệ (phạt 30–50 triệu, điểm n khoản 4 Điều 23 NĐ
 * 88/2019). Bản en/zh có giá riêng cho khách nước ngoài, ghi bằng VNĐ kèm
 * "≈ $…" chỉ để tham khảo (tỷ giá ~26.000₫/US$1, ghi ở priceNotice). Hợp đồng
 * với khách nước ngoài vẫn có thể tính USD (shared/projectPackages.js MARKETS).
 * Giữ tham số `lang` để chỗ gọi không phải đổi.
 */
// eslint-disable-next-line no-unused-vars
export const priceCurrency = (lang) => "VND";

export function findServicePackage(slug) {
  return servicePackages.find((pkg) => pkg.slug === slug || pkg.id === slug);
}

export { findServicePackage as getServicePackage };
