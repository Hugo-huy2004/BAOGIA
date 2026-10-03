/**
 * Danh mục gói cho quản lý dự án — NGUỒN DUY NHẤT cho trang quản trị, cổng
 * khách, máy chủ và hợp đồng tự sinh.
 *
 * Giá, bảo hành, đợt thanh toán ở đây phải khớp bảng giá công khai trên
 * /services (servicePkg.* trong translation.json). Sửa giá thì sửa cả hai nơi.
 *
 * `id` là thứ lưu xuống cơ sở dữ liệu: ĐỪNG đổi id đã dùng. Tên cũ từng lưu
 * trước đợt đổi bảng giá ("Hugo One", "Gói kết nối"…) nằm trong `aliases`, nên
 * dự án cũ vẫn tra ra đúng gói — `normalizePackageId()` là cửa đổi tên cũ sang id.
 *
 * Mỗi gói có hai giá: `vnd` cho dự án trong nước, `usd` cho dự án quốc tế (xem
 * MARKETS). Hợp đồng và sổ chi phí cộng trên số; chuỗi hiển thị chỉ sinh lúc in.
 */

export const LIFETIME = 'lifetime';

export const PROJECT_PACKAGE_GROUPS = [
  {
    id: 'main',
    label: 'Gói dịch vụ',
    options: [
      { id: 'hugo-one', label: 'Hugo One', aliases: ['Hugo One'], hint: 'Landing page một trang, không cần cọc',
        price: { vnd: 1290000, usd: 219 }, durationDays: [7, 10], warranty: LIFETIME, contentEditDays: 7, payments: [100], noDeposit: true },
      { id: 'hugo-story', label: 'Hugo Story', aliases: ['Hugo Story'], hint: 'Website 4 trang, đã gồm liên kết',
        price: { vnd: 2990000, usd: 449 }, durationDays: [14, 21], warranty: LIFETIME, contentEditDays: 14, payments: [50, 50], linkIncluded: true },
      { id: 'hugo-flow-plus', label: 'Hugo Flow+', aliases: ['Hugo Flow+'], hint: 'Web 4 trang + 1 chức năng + trang quản trị',
        price: { vnd: 4990000, usd: 749 }, priceFrom: true, durationDays: [21, 35], warranty: LIFETIME, contentEditDays: 30, payments: [50, 50], linkIncluded: true },
    ],
  },
  {
    id: 'edu',
    label: 'Người học',
    options: [
      { id: 'hugo-edu-plus', label: 'Hugo Edu+', aliases: ['Hugo Edu+'], hint: 'Trang Bio miễn phí 365 ngày',
        price: { vnd: 0, usd: 0 }, durationDays: [1, 3], warrantyDays: 365, payments: null, free: true },
    ],
  },
  {
    id: 'addon',
    label: 'Gói lẻ',
    options: [
      { id: 'domain-setup', label: 'Gói Liên kết', aliases: ['Gói kết nối'], hint: 'Kết nối tên miền, hosting bằng tài khoản khách (Hugo One)',
        price: { vnd: 350000, usd: 49 }, durationDays: [1, 2], warrantyDays: 30, payments: [100], appliesTo: ['hugo-one'] },
      { id: 'seo', label: 'Gói SEO', aliases: [], hint: 'SEO làm một lần: từ khoá, Search Console, Google Maps',
        price: { vnd: { 'hugo-one': 990000, default: 1790000 }, usd: { 'hugo-one': 379, default: 669 } }, durationDays: [2, 3], warrantyDays: 30, payments: [100] },
      { id: 'flow-care-plan', label: 'Gói Duy trì Flow+', aliases: ['Bảo trì hàng tháng'], hint: 'Sao lưu, theo dõi, vá bảo mật hằng tháng',
        price: { vnd: 490000, usd: 29 }, recurring: true, warranty: 'subscription', payments: null, appliesTo: ['hugo-flow-plus'] },
      { id: 'support', label: 'Hỗ trợ lẻ', aliases: ['Hỗ trợ riêng', 'Nâng cấp website có sẵn'], hint: 'Việc nhỏ dưới 3 giờ, báo giá trước',
        price: { vnd: 300000, usd: 45 }, priceFrom: true, durationDays: [1, 3], warrantyDays: 7, payments: [100] },
    ],
  },
];

/** Đơn giá lẻ phát sinh trong lúc làm — không phải gói, không mở dự án riêng. */
export const PROJECT_UNIT_PRICES = [
  { id: 'extra-page', label: 'Thêm một trang (Story, Flow+)', price: { vnd: 390000, usd: 59 } },
  { id: 'extra-section', label: 'Thêm một phần vào trang Hugo One', price: { vnd: 150000, usd: 25 } },
  { id: 'revision', label: 'Sửa thiết kế từ lần thứ ba', price: { vnd: 200000, usd: 29 } },
];

const ALL_OPTIONS = PROJECT_PACKAGE_GROUPS.flatMap((g) => g.options.map((o) => ({ ...o, group: g.id })));

/** Danh sách phẳng để kiểm tra nhanh ở máy chủ. */
export const PROJECT_PACKAGE_IDS = ALL_OPTIONS.map((o) => o.id);

/** Đổi id / tên cũ / tên hiển thị về id chuẩn. Trả '' nếu không nhận ra. */
export function normalizePackageId(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const found = ALL_OPTIONS.find((o) => o.id === v || o.label === v || o.aliases?.includes(v));
  return found ? found.id : '';
}

export function isValidProjectPackage(value) {
  return Boolean(normalizePackageId(value));
}

/** Thông tin của một gói (nhận cả tên cũ); gói lạ trả null để nơi gọi tự ẩn. */
export function getPackageFacts(idOrLabel) {
  const id = normalizePackageId(idOrLabel);
  return ALL_OPTIONS.find((o) => o.id === id) || null;
}

/**
 * Thị trường của dự án — admin chọn ngay lúc tạo. Quyết định loại tiền của mọi
 * khoản trong sổ chi phí và ngôn ngữ hợp đồng. Chọn một lần, không đổi giữa
 * chừng: đổi tiền giữa dự án là cách nhanh nhất làm lệch sổ.
 */
export const MARKETS = {
  domestic: { id: 'domestic', label: 'Trong nước', currency: 'vnd', locale: 'vi' },
  international: { id: 'international', label: 'Quốc tế', currency: 'usd', locale: 'en' },
};
export const marketOf = (id) => MARKETS[id] || MARKETS.domestic;

/** Giá niêm yết của một gói / gói lẻ / đơn giá, theo thị trường và gói chính của dự án. */
export function listPrice(idOrLabel, mainPackageId = '', market = 'domestic') {
  const facts = getPackageFacts(idOrLabel) || PROJECT_UNIT_PRICES.find((u) => u.id === idOrLabel);
  if (!facts) return 0;
  const byCurrency = facts.price?.[marketOf(market).currency];
  if (typeof byCurrency === 'number') return byCurrency;
  return byCurrency?.[normalizePackageId(mainPackageId)] ?? byCurrency?.default ?? 0;
}

/** Cửa sổ bàn giao dự kiến, tính từ ngày mở dự án. Trả về một KHOẢNG, không phải một ngày. */
export function estimateDelivery(packageId, startedAt) {
  const facts = getPackageFacts(packageId);
  if (!facts?.durationDays || !startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const [min, max] = facts.durationDays;
  const from = new Date(start);
  from.setDate(from.getDate() + min);
  const to = new Date(start);
  to.setDate(to.getDate() + max);
  return { from, to };
}

/**
 * Hạn bảo hành tính từ lúc bàn giao. Gói chính bảo hành TRỌN ĐỜI → trả null
 * (dùng `isLifetimeWarranty` để hiện chữ "Trọn đời" thay cho một ngày).
 */
export function warrantyUntil(packageId, completedAt) {
  const facts = getPackageFacts(packageId);
  if (!facts?.warrantyDays || !completedAt) return null;
  const end = new Date(completedAt);
  if (Number.isNaN(end.getTime())) return null;
  end.setDate(end.getDate() + facts.warrantyDays);
  return end;
}

export const isLifetimeWarranty = (packageId) => getPackageFacts(packageId)?.warranty === LIFETIME;

/**
 * In số tiền theo loại tiền của dự án: "1.290.000₫" hoặc "$219". Chỉ dùng lúc
 * in — tính toán luôn trên số (VNĐ nguyên, USD có thể lẻ xu).
 */
export function formatMoney(n, currency = 'vnd') {
  const v = Number(n) || 0;
  if (currency === 'usd') return `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `${v < 0 ? '−' : ''}${Math.abs(Math.round(v)).toLocaleString('vi-VN')}₫`;
}
export const formatVnd = (n) => formatMoney(n, 'vnd');
