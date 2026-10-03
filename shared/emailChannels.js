/**
 * @file shared/emailChannels.js
 * Centralized email channel registry for Hugo Studio ecosystem.
 *
 * Provides single source of truth for:
 * - contact@hugowishpax.studio (Dự án, hợp đồng, báo giá, pháp lý)
 * - support@hugowishpax.studio (Hỗ trợ kỹ thuật, tài khoản, lỗi PWA/web, ví JOY)
 * - education@hugowishpax.studio (Hugo Learning, Coder Academy, xác thực HSSV, chứng nhận)
 * - adv@hugowishpax.studio (Quảng cáo, tài trợ Today feed, media kit, đối tác thương hiệu)
 */

export const EMAIL_CHANNELS = {
  CONTACT: {
    id: "contact",
    address: "contact@hugowishpax.studio",
    icon: "mail",
    badge: "Business & Legal",
    label: {
      vi: "Dự án & Hợp tác",
      en: "Projects & Business",
      zh: "项目与商务合作",
    },
    description: {
      vi: "Báo giá phần mềm, tư vấn kiến trúc web, hợp đồng kinh tế và pháp lý.",
      en: "Software quotes, web architecture consulting, business contracts, and legal.",
      zh: "软件报价、Web架构咨询、商务合同与法律事务。",
    },
    defaultSubject: {
      vi: "[Dự án] Yêu cầu tư vấn & báo giá giải pháp",
      en: "[Project] Inquiry for Consultation & Quote",
      zh: "[项目] 咨询与方案报价需求",
    },
  },

  SUPPORT: {
    id: "support",
    address: "support@hugowishpax.studio",
    icon: "support_agent",
    badge: "24/7 Member Care",
    label: {
      vi: "Hỗ trợ Kỹ thuật & Thành viên",
      en: "Technical & Member Support",
      zh: "技术与会员支持",
    },
    description: {
      vi: "Xử lý sự cố tài khoản, ví JOY, lỗi giao diện / PWA, khiếu nại và kháng nghị bảo mật.",
      en: "Account troubleshooting, JOY wallet disputes, UI/PWA bugs, and security appeals.",
      zh: "账户异常处理、JOY钱包争议、界面/PWA报错以及安全申诉。",
    },
    defaultSubject: {
      vi: "[Hỗ trợ] Yêu cầu hỗ trợ kỹ thuật / Tài khoản",
      en: "[Support] Technical & Account Assistance Request",
      zh: "[支持] 技术支持与账户问题求助",
    },
  },

  EDUCATION: {
    id: "education",
    address: "education@hugowishpax.studio",
    icon: "school",
    badge: "Hugo Academy",
    label: {
      vi: "Học tập & Đào tạo",
      en: "Education & Mentorship",
      zh: "学习与教学培训",
    },
    description: {
      vi: "Giáo trình Hugo Learning, duyệt quyền email HSSV, cấp chứng chỉ và cố vấn lập trình.",
      en: "Hugo Learning curriculum, student email verifications, certificates, and code mentoring.",
      zh: "Hugo Learning课程、学生邮箱认证、结业证书与代码辅导。",
    },
    defaultSubject: {
      vi: "[Học tập] Thắc mắc giáo trình / Xác minh quyền HSSV",
      en: "[Education] Curriculum Inquiry / Student Verification",
      zh: "[学习] 课程疑问与学生身份认证",
    },
  },

  ADV: {
    id: "adv",
    address: "adv@hugowishpax.studio",
    icon: "campaign",
    badge: "Media & Sponsor",
    label: {
      vi: "Quảng cáo & Tài trợ",
      en: "Advertising & Media",
      zh: "广告与媒体赞助",
    },
    description: {
      vi: "Media kit, đặt banner / bài viết tài trợ trên Today feed, hợp tác thương hiệu và báo chí.",
      en: "Media kits, sponsored posts on Today feed, brand partnerships, and press.",
      zh: "媒体刊例、Today专栏赞助投放、品牌联名与媒体公关。",
    },
    defaultSubject: {
      vi: "[Quảng cáo] Đề xuất hợp tác truyền thông / Tài trợ nội dung",
      en: "[Ad & Media] Sponsorship Proposal / Media Kit Request",
      zh: "[广告] 媒体公关合作与赞助方案洽谈",
    },
  },
};

/**
 * Lấy kênh theo ID hoặc key.
 * @param {string} keyOrId - 'contact' | 'support' | 'education' | 'adv' (case-insensitive)
 * @returns {typeof EMAIL_CHANNELS.CONTACT}
 */
export function getEmailChannel(keyOrId = "contact") {
  const normalized = String(keyOrId || "contact").trim().toUpperCase();
  if (EMAIL_CHANNELS[normalized]) return EMAIL_CHANNELS[normalized];

  const lower = normalized.toLowerCase();
  const matched = Object.values(EMAIL_CHANNELS).find((ch) => ch.id === lower);
  return matched || EMAIL_CHANNELS.CONTACT;
}

/**
 * Tạo liên kết mailto hoàn chỉnh với tiêu đề và nội dung được mã hoá chuẩn URL.
 * @param {string} channelKeyOrId
 * @param {Object} [options]
 * @param {string} [options.subject]
 * @param {string} [options.body]
 * @param {string} [options.lang='vi']
 * @returns {string}
 */
export function createMailtoUrl(channelKeyOrId, { subject, body, lang = "vi" } = {}) {
  const channel = getEmailChannel(channelKeyOrId);
  const resolvedSubject = subject || channel.defaultSubject[lang] || channel.defaultSubject.vi;
  
  const params = new URLSearchParams();
  if (resolvedSubject) params.set("subject", resolvedSubject);
  if (body) params.set("body", body);

  const query = params.toString();
  return `mailto:${channel.address}${query ? `?${query}` : ""}`;
}

/**
 * Danh sách toàn bộ 4 địa chỉ email chính thức
 */
export const ALL_EMAIL_ADDRESSES = Object.freeze(
  Object.values(EMAIL_CHANNELS).map((ch) => ch.address)
);
