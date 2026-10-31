import Bio from '../models/Bio.js';

/**
 * Tập slug / tên miền riêng hợp lệ trong RAM: chặn O(1) các lượt dò /bio/:slug
 * bịa trước khi chạm MongoDB. Nạp một lần lúc nối DB, giữ đồng bộ ở nơi tạo /
 * đổi / xoá Bio. Render free chạy một tiến trình nên RAM là nguồn duy nhất.
 * ponytail: tách nhiều instance thì mỗi instance phải tự nạp lại định kỳ.
 */
let slugs = null;
let domains = null;
const clean = (domain) => String(domain).trim().toLowerCase();

export const slugIndex = {
  async init() {
    try {
      const bios = await Bio.find({}, 'slug customDomain').lean();
      slugs = new Set(bios.map((b) => b.slug).filter(Boolean));
      domains = new Set(bios.map((b) => b.customDomain && clean(b.customDomain)).filter(Boolean));
      console.log(`🛡️ Valid-slug set: ${slugs.size} slugs, ${domains.size} custom domains`);
    } catch (error) {
      console.error('[slugIndex] init:', error.message);
    }
  },
  addSlug(slug) { if (slug) slugs?.add(slug); },
  deleteSlug(slug) { if (slug) slugs?.delete(slug); },
  // Chưa nạp xong thì cho qua: thà tốn một truy vấn còn hơn 404 nhầm.
  hasSlug(slug) { return !slugs || slugs.has(slug); },
  addCustomDomain(domain) { if (domain) domains?.add(clean(domain)); },
  deleteCustomDomain(domain) { if (domain) domains?.delete(clean(domain)); },
  hasCustomDomain(domain) { return !domains || domains.has(clean(domain)); },
};

export default slugIndex;
