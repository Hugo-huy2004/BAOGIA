// Chiến dịch hợp tác — MỘT nguồn dữ liệu cho cả server (cộng quà, chống gian
// lận, đếm suất) lẫn trang partner.hugowishpax.studio (phim mở màn, lời mời,
// SEO). Trang hứa "6 tháng" mà server cộng 5 là nói dối người dùng, nên hai bên
// đọc chung bảng này thay vì mỗi bên tự ghi số.
//
// ── THÊM / ĐỔI / XOÁ CHIẾN DỊCH ─────────────────────────────────────────────
//   Thêm: chép một mục, đổi `slug` và nội dung. Trang /collab/<slug> và API
//         /api/partner-campaigns/<slug> tự có; trang tĩnh SEO sinh lúc build.
//   Đổi tên miền partner sang chiến dịch khác: sửa PARTNER_HOST_CAMPAIGN.
//   Tạm đóng: đặt `endsAt`. Xoá hẳn: xoá mục — lượt nhận cũ vẫn nằm trong
//         collection PartnerClaim để đối soát, chỉ là không nhận thêm được.

const DAY_MS = 24 * 60 * 60 * 1000;

export const PARTNER_HOST = "partner.hugowishpax.studio";
/** Chiến dịch hiện ở trang gốc của tên miền partner. */
export const PARTNER_HOST_CAMPAIGN = "hwagfu";

export const PARTNER_CAMPAIGNS = {
  hwagfu: {
    slug: "hwagfu",
    partnerName: "hwagfu.dev",
    partnerUrl: "https://hwagfu.dev",
    publicUrl: "https://partner.hugowishpax.studio/",
    // Nhân vật đối tác trong phim, vẽ theo logo hwagfu.dev: ô vuông bo góc màu
    // kem, "<" ">" cam ôm chữ "J" xanh than. `wordmark` = [phần chính, đuôi màu cam].
    mark: {
      kind: "tile-glyph",
      tile: "#f7efe4",
      accent: "#e0793a",
      glyph: "#1e2740",
      letter: "J",
      wordmark: ["hwagfu", ".dev"],
    },

    // ── Quà ───────────────────────────────────────────────────────────────
    // Duy trì tài khoản & trang Bio — cộng NỐI vào hạn hiện có, không ghi đè.
    bioDays: 180,
    // Thêm khi tài khoản đã xác minh giáo dục (email trường hoặc hồ sơ HSSV
    // được duyệt). Xác minh SAU khi nhận quà vẫn quay lại nhận phần này được.
    eduBonusDays: 365,
    joy: 1000,
    // Tổng số tài khoản được nhận. Phần thưởng giáo dục nhận sau không tốn suất.
    maxClaims: 250,
    // null = không hạn. Đặt ngày ISO để mở/đóng theo lịch.
    startsAt: null,
    endsAt: null,

    // ── Chống một người nhiều tài khoản ───────────────────────────────────
    // Số điện thoại và mã thiết bị trùng là chặn thẳng (xem partnerCampaignRoutes).
    // Hai ngưỡng dưới chỉ nới được, đừng tắt: trường học/ký túc xá dùng chung
    // mạng nên IP không thể là luật "một".
    antiAbuse: { maxPerIpPerDay: 3, maxPerLocation: 2 },

    // ── Nội dung trang ───────────────────────────────────────────────────
    copy: {
      vi: {
        metaTitle: "Thư mời nhận ưu đãi Collaborate · hwagfu.dev × Hugo Studio",
        metaDescription:
          "Thư mời tham gia nhận ưu đãi collaborate của hwagfu.dev và Hugo Studio: đăng ký bằng Google, nhận 6 tháng duy trì tài khoản & trang Bio (thêm 365 ngày nếu xác minh giáo dục), 1000 JOY và trải nghiệm miễn phí các dịch vụ. Số lượng có hạn.",
        keywords:
          "hwagfu.dev, Hugo Studio, ưu đãi collaborate, thư mời hợp tác, trang Bio miễn phí, ví JOY, Hugo Team, ưu đãi sinh viên",
        eyebrow: "Thư mời · Collaborate",
        headline: "hwagfu.dev × Hugo Studio",
        tagline: "to build · to learn · to grow",
        lede: "Hai studio bắt tay hợp tác — và bạn nằm trong những người đầu tiên được mời tham gia.",
        cta: "Khám phá ưu đãi",
      },
      en: {
        metaTitle: "Collaborate invitation · hwagfu.dev × Hugo Studio",
        metaDescription:
          "An invitation to the hwagfu.dev × Hugo Studio collaboration: sign up with Google to get 6 months of account & Bio page, +365 days with education verification, 1000 JOY and free access to the services. Limited spots.",
        keywords: "hwagfu.dev, Hugo Studio, collaboration offer, free bio page, JOY wallet, Hugo Team",
        eyebrow: "Invitation · Collaborate",
        headline: "hwagfu.dev × Hugo Studio",
        tagline: "to build · to learn · to grow",
        lede: "Two studios shake hands on a collaboration — and you are among the first invited to join.",
        cta: "Explore the offer",
      },
    },
  },
};

export const getPartnerCampaign = (slug) =>
  Object.prototype.hasOwnProperty.call(PARTNER_CAMPAIGNS, slug) ? PARTNER_CAMPAIGNS[slug] : null;

export const isPartnerCampaignOpen = (campaign, now = Date.now()) => {
  if (!campaign) return false;
  if (campaign.startsAt && now < new Date(campaign.startsAt).getTime()) return false;
  if (campaign.endsAt && now >= new Date(campaign.endsAt).getTime()) return false;
  return true;
};

/** Hạn mới sau khi cộng `days` ngày: nối vào hạn cũ nếu còn, tính từ bây giờ nếu đã qua. */
export const extendFrom = (current, days, now = Date.now()) => {
  const base = Math.max(now, current ? new Date(current).getTime() || 0 : 0);
  return new Date(base + days * DAY_MS);
};
