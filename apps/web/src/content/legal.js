/**
 * Điều khoản sử dụng + Chính sách bảo mật — NGUỒN DUY NHẤT.
 * Trang công khai (/terms, /privacy-policy) và Cài đặt thành viên đọc cùng file này.
 *
 * Chỉ ghi điều code THẬT SỰ làm. Thêm bên thứ ba, thêm loại dữ liệu, đổi cách
 * xoá tài khoản → sửa ở đây cùng lúc (Nghị định 13/2023: thông báo trước khi xử lý).
 * Mỗi mục: { h: tiêu đề, p?: [đoạn], li?: [gạch đầu dòng] }.
 */

export const LEGAL_UPDATED = "2026-11-09";
const CONTACT = "contact@hugowishpax.studio";

const vi = {
  terms: {
    title: "Điều khoản sử dụng",
    intro: "Khi tạo tài khoản hoặc dùng Hugo Studio (hugowishpax.studio), bạn đồng ý với các điều khoản dưới đây.",
    sections: [
      { h: "1. Hugo Studio là gì", p: [
        "Hugo Studio do Hugo Wishpax sáng lập và vận hành theo hướng phi lợi nhuận. Gồm hai phần: các ứng dụng miễn phí cho thành viên (trang Bio, trò chơi, Today, ví điểm JOY…) và dịch vụ thiết kế website theo báo giá.",
      ] },
      { h: "2. Tài khoản và độ tuổi", li: [
        "Bạn phải từ đủ 14 tuổi. Từ 14 đến dưới 16 tuổi cần cha mẹ hoặc người giám hộ đồng ý.",
        "Ngày sinh khai một lần và không đổi được, nên hãy khai đúng.",
        "Tài khoản mới được dùng thử 7 ngày, sau đó gia hạn bằng JOY. Hết hạn thì tài khoản bị khoá, không bị xoá; gia hạn lại là mở.",
        "Bạn chịu trách nhiệm giữ an toàn tài khoản Google và passkey của mình.",
      ] },
      { h: "3. Điểm JOY", li: [
        "JOY là điểm thưởng trong ứng dụng, không phải tiền. JOY không mua được bằng tiền, không đổi ra tiền và không có giá trị tài sản.",
        "JOY dùng để gia hạn tài khoản và mở tính năng trong Hugo Studio. Có thể tặng cho thành viên khác.",
        "JOY có được do gian lận, lỗi hệ thống hoặc lạm dụng có thể bị thu hồi.",
      ] },
      { h: "4. Nội dung bạn đăng", li: [
        "Nội dung vẫn là của bạn. Bạn cho phép Hugo Studio lưu và hiển thị nó trong phạm vi tính năng bạn dùng.",
        "Cấm: vi phạm pháp luật Việt Nam, xâm phạm bản quyền, quấy rối, lừa đảo, nội dung khiêu dâm, thông tin cá nhân của người khác.",
        "Nội dung vi phạm có thể bị ẩn. Vi phạm lặp lại có thể bị khoá tài khoản.",
        `Báo vi phạm (kể cả bản quyền): ${CONTACT}.`,
      ] },
      { h: "5. Ủng hộ và dịch vụ trả phí", li: [
        "Ủng hộ là tự nguyện, không đổi lấy hàng hoá hay dịch vụ. Chuyển nhầm thì liên hệ để được xem xét.",
        "Dịch vụ thiết kế website tuân theo báo giá và hợp đồng ký riêng với từng khách hàng.",
      ] },
      { h: "6. Giới hạn trách nhiệm", p: [
        "Các ứng dụng miễn phí được cung cấp nguyên trạng. Chúng tôi cố gắng giữ dịch vụ ổn định nhưng không bảo đảm không gián đoạn, và có thể thay đổi hoặc ngừng một tính năng sau khi báo trước trong ứng dụng.",
      ] },
      { h: "7. Luật áp dụng và liên hệ", p: [
        `Điều khoản này theo pháp luật Việt Nam. Thắc mắc hay khiếu nại: ${CONTACT}. Khi điều khoản thay đổi, chúng tôi báo trong ứng dụng trước khi áp dụng.`,
      ] },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    intro: "Chính sách này cho biết Hugo Studio thu dữ liệu nào, để làm gì, chia sẻ với ai, và bạn có những quyền gì (theo Nghị định 13/2023/NĐ-CP).",
    sections: [
      { h: "1. Ai xử lý dữ liệu của bạn", p: [
        `Hugo Wishpax, người sáng lập và vận hành Hugo Studio, là bên kiểm soát và xử lý dữ liệu. Mọi yêu cầu về dữ liệu cá nhân gửi về ${CONTACT}.`,
      ] },
      { h: "2. Dữ liệu chúng tôi thu", li: [
        "Đăng nhập: email, tên và ảnh đại diện từ Google; khoá công khai passkey. Vân tay và khuôn mặt chỉ nằm trên máy bạn, chúng tôi không nhận được.",
        "Bắt buộc: ngày sinh, để kiểm tra độ tuổi.",
        "Tuỳ chọn, chỉ khi bạn tự khai: tên hiển thị, ảnh, liên kết, thành tích, số điện thoại, quốc gia, tỉnh/thành, địa chỉ, điểm ghim vị trí.",
        "Khi bạn dùng ứng dụng: lịch sử JOY, điểm trò chơi, ứng dụng đã mở, câu trả lời khảo sát, bài đăng Today, yêu cầu hỗ trợ.",
        "Kỹ thuật và an ninh: địa chỉ IP, vị trí ước lượng từ IP, loại thiết bị, ngôn ngữ máy, mã nhận thông báo đẩy. Vị trí GPS chỉ được đọc khi bạn cho phép.",
        "Khách hỏi dịch vụ hoặc ủng hộ: tên, email, số điện thoại, nội dung yêu cầu. Tên người ủng hộ chỉ hiện công khai khi bạn chọn.",
      ] },
      { h: "3. Dùng để làm gì", li: [
        "Đăng nhập, giữ tài khoản và các tính năng bạn dùng chạy được.",
        "Kiểm tra độ tuổi; chống gian lận (số điện thoại dùng để mỗi người chỉ nhận quà một lần).",
        "Phát hiện đăng nhập lạ và tấn công vào hệ thống.",
        "Gửi thông báo bạn đã bật (bảo mật, số dư, nhắc nhở). Không gửi email quảng cáo.",
        "Lọc nội dung vi phạm trên Today và gợi ý bài phù hợp với bạn.",
      ] },
      { h: "4. Những điều chúng tôi không làm", li: [
        "Không bán hay cho thuê dữ liệu.",
        "Không quảng cáo, không dùng cookie quảng cáo hay theo dõi chéo trang.",
        "Không thu tôn giáo, dân tộc, sức khoẻ hay dữ liệu sinh trắc học.",
      ] },
      { h: "5. Bên thứ ba xử lý dữ liệu", p: [
        "Chỉ dùng để vận hành dịch vụ, mỗi bên nhận phần dữ liệu tối thiểu cần thiết. Phần lớn máy chủ đặt ngoài Việt Nam (Mỹ, Singapore), nên dữ liệu được chuyển ra nước ngoài.",
      ], li: [
        "Google: đăng nhập; Gemini AI xử lý bài đăng Today, yêu cầu hỗ trợ và ảnh minh chứng bạn gửi.",
        "MongoDB Atlas (cơ sở dữ liệu), Render và Vercel (máy chủ), Cloudflare (mạng phân phối, chống tấn công).",
        "Cloudinary: lưu ảnh bạn tải lên.",
        "PayOS: xử lý chuyển khoản ủng hộ và thanh toán dịch vụ.",
        "Resend: gửi email giao dịch (mã đăng nhập, thông báo).",
        "Sentry: ghi lỗi kỹ thuật, không kèm thông tin định danh.",
        "ipinfo: tra quốc gia và nhà mạng từ IP. OpenStreetMap: đổi điểm ghim thành địa chỉ.",
        "Dịch vụ đẩy thông báo của Apple, Google, Mozilla.",
      ] },
      { h: "6. Lưu trữ và bảo mật", li: [
        "Toàn bộ kết nối dùng HTTPS. Địa chỉ chi tiết và toạ độ được mã hoá khi lưu.",
        "Dữ liệu được giữ tới khi bạn xoá tài khoản. Tài khoản hết hạn bị khoá, không bị xoá.",
        "Xoá tài khoản là xoá hết. Chỉ giữ lại một mã băm của email để chặn việc tạo lại tài khoản liên tục lấy lượt dùng thử.",
      ] },
      { h: "7. Quyền của bạn", li: [
        "Xem và sửa dữ liệu trong phần Cài đặt.",
        "Xoá tài khoản ngay trong ứng dụng: Cài đặt → Xoá tài khoản.",
        "Rút lại đồng ý bất cứ lúc nào: tắt thông báo, tắt quyền vị trí, hoặc xoá thông tin tuỳ chọn.",
        `Yêu cầu bản sao dữ liệu, phản đối xử lý hoặc khiếu nại: gửi về ${CONTACT}. Chúng tôi trả lời trong 72 giờ.`,
      ] },
      { h: "8. Trẻ vị thành niên", p: [
        "Không nhận người dưới 14 tuổi. Từ 14 đến dưới 16 tuổi cần cha mẹ hoặc người giám hộ đồng ý trước khi chúng tôi xử lý dữ liệu. Thông tin của người dưới 18 tuổi không hiển thị đầy đủ công khai.",
      ] },
      { h: "9. Cookie", p: [
        "Chỉ dùng cookie đăng nhập, cần để giữ phiên. Không có cookie quảng cáo hay phân tích.",
      ] },
      { h: "10. Thay đổi", p: [
        "Khi chính sách thay đổi, chúng tôi báo trong ứng dụng trước khi áp dụng.",
      ] },
    ],
  },
};

const en = {
  terms: {
    title: "Terms of Use",
    intro: "By creating an account or using Hugo Studio (hugowishpax.studio), you agree to these terms.",
    sections: [
      { h: "1. What Hugo Studio is", p: [
        "Hugo Studio is founded and run on a nonprofit basis by Hugo Wishpax. It has two parts: free member apps (Bio page, games, Today, JOY points…) and website design services on quotation.",
      ] },
      { h: "2. Accounts and age", li: [
        "You must be at least 14. If you are 14 or 15, a parent or guardian must consent.",
        "Your birth date is entered once and cannot be changed, so enter it correctly.",
        "New accounts get a 7-day trial, then are extended with JOY. An expired account is locked, not deleted; extending it unlocks it.",
        "You are responsible for keeping your Google account and passkeys secure.",
      ] },
      { h: "3. JOY points", li: [
        "JOY are in-app reward points, not money. JOY cannot be bought with money, cannot be cashed out and have no property value.",
        "JOY extend your account and unlock features inside Hugo Studio. They can be gifted to other members.",
        "JOY obtained through fraud, system errors or abuse may be revoked.",
      ] },
      { h: "4. Your content", li: [
        "Your content remains yours. You allow Hugo Studio to store and display it within the features you use.",
        "Not allowed: anything illegal under Vietnamese law, copyright infringement, harassment, scams, sexual content, other people's personal data.",
        "Violating content may be hidden. Repeated violations may lead to account suspension.",
        `Report violations (including copyright): ${CONTACT}.`,
      ] },
      { h: "5. Donations and paid services", li: [
        "Donations are voluntary and not in exchange for goods or services. If you transferred by mistake, contact us and we will review it.",
        "Website design services follow the quotation and contract signed separately with each client.",
      ] },
      { h: "6. Limitation of liability", p: [
        "Free apps are provided as is. We try to keep the service stable but do not guarantee it will be uninterrupted, and we may change or retire a feature after notice in the app.",
      ] },
      { h: "7. Governing law and contact", p: [
        `These terms are governed by Vietnamese law. Questions or complaints: ${CONTACT}. We announce changes in the app before they take effect.`,
      ] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This policy explains what data Hugo Studio collects, why, who it is shared with, and your rights (under Vietnam's Decree 13/2023/ND-CP).",
    sections: [
      { h: "1. Who processes your data", p: [
        `Hugo Wishpax, founder and operator of Hugo Studio, is the data controller and processor. Send any personal data request to ${CONTACT}.`,
      ] },
      { h: "2. Data we collect", li: [
        "Sign-in: email, name and avatar from Google; passkey public keys. Fingerprints and faces stay on your device; we never receive them.",
        "Required: birth date, to check your age.",
        "Optional, only if you provide it: display name, photo, links, achievements, phone number, country, province/city, address, map pin.",
        "When you use the apps: JOY history, game scores, apps opened, survey answers, Today posts, support requests.",
        "Technical and security: IP address, IP-based approximate location, device type, device language, push notification tokens. GPS location is read only with your permission.",
        "Service enquiries and donations: name, email, phone number, message. Donor names are shown publicly only if you choose.",
      ] },
      { h: "3. Why we use it", li: [
        "To sign you in and keep your account and features working.",
        "To check age and prevent fraud (a phone number limits rewards to one per person).",
        "To detect unusual sign-ins and attacks.",
        "To send notifications you turned on (security, balance, reminders). No marketing email.",
        "To filter violating content on Today and suggest relevant posts.",
      ] },
      { h: "4. What we do not do", li: [
        "We do not sell or rent data.",
        "No ads, no advertising cookies, no cross-site tracking.",
        "We do not collect religion, ethnicity, health or biometric data.",
      ] },
      { h: "5. Third-party processors", p: [
        "Used only to run the service; each receives the minimum data needed. Most servers are outside Vietnam (US, Singapore), so data is transferred abroad.",
      ], li: [
        "Google: sign-in; Gemini AI processes Today posts, support requests and proof images you submit.",
        "MongoDB Atlas (database), Render and Vercel (hosting), Cloudflare (CDN, attack protection).",
        "Cloudinary: stores images you upload.",
        "PayOS: processes donations and service payments.",
        "Resend: sends transactional email (sign-in codes, notices).",
        "Sentry: technical error logging without identifying information.",
        "ipinfo: country and network lookup from IP. OpenStreetMap: turns a map pin into an address.",
        "Push notification services of Apple, Google and Mozilla.",
      ] },
      { h: "6. Storage and security", li: [
        "All connections use HTTPS. Detailed addresses and coordinates are encrypted at rest.",
        "Data is kept until you delete your account. Expired accounts are locked, not deleted.",
        "Deleting your account deletes everything, except a hash of your email kept to stop repeated sign-ups for free trials.",
      ] },
      { h: "7. Your rights", li: [
        "View and edit your data in Settings.",
        "Delete your account in the app: Settings → Delete account.",
        "Withdraw consent any time: turn off notifications or location, or remove optional details.",
        `Request a copy of your data, object to processing or complain: ${CONTACT}. We reply within 72 hours.`,
      ] },
      { h: "8. Minors", p: [
        "We do not accept users under 14. For ages 14–15, a parent or guardian must consent before we process data. Information of users under 18 is never fully shown publicly.",
      ] },
      { h: "9. Cookies", p: [
        "Only sign-in cookies needed to keep your session. No advertising or analytics cookies.",
      ] },
      { h: "10. Changes", p: [
        "We announce changes to this policy in the app before they take effect.",
      ] },
    ],
  },
};

const zh = {
  terms: {
    title: "使用条款",
    intro: "创建账户或使用 Hugo Studio（hugowishpax.studio）即表示您同意以下条款。",
    sections: [
      { h: "1. Hugo Studio 是什么", p: [
        "Hugo Studio 由 Hugo Wishpax 创立并以非营利方式运营，包括两部分：免费的会员应用（Bio 页面、游戏、Today、JOY 积分等）以及按报价提供的网站设计服务。",
      ] },
      { h: "2. 账户与年龄", li: [
        "您必须年满 14 岁。14 至 15 岁需父母或监护人同意。",
        "出生日期只能填写一次且无法修改，请如实填写。",
        "新账户可试用 7 天，之后用 JOY 续期。账户到期会被锁定而不是删除，续期后即可解锁。",
        "您有责任保管好自己的 Google 账户和通行密钥。",
      ] },
      { h: "3. JOY 积分", li: [
        "JOY 是应用内奖励积分，不是货币。JOY 不能用钱购买，不能兑换成现金，也不具有财产价值。",
        "JOY 用于为账户续期和解锁 Hugo Studio 内的功能，可以赠送给其他会员。",
        "通过欺诈、系统错误或滥用获得的 JOY 可能被收回。",
      ] },
      { h: "4. 您发布的内容", li: [
        "内容仍归您所有。您允许 Hugo Studio 在您使用的功能范围内存储和展示这些内容。",
        "禁止：违反越南法律、侵犯版权、骚扰、诈骗、色情内容、他人的个人信息。",
        "违规内容可能被隐藏，屡次违规可能导致账户被封禁。",
        `举报违规（包括版权）：${CONTACT}。`,
      ] },
      { h: "5. 捐助与付费服务", li: [
        "捐助完全自愿，不换取任何商品或服务。如转账有误，请联系我们处理。",
        "网站设计服务以与每位客户单独签订的报价和合同为准。",
      ] },
      { h: "6. 责任限制", p: [
        "免费应用按现状提供。我们尽力保持服务稳定，但不保证不中断，并可能在应用内提前通知后更改或停止某项功能。",
      ] },
      { h: "7. 适用法律与联系方式", p: [
        `本条款适用越南法律。疑问或投诉：${CONTACT}。条款变更会在生效前于应用内通知。`,
      ] },
    ],
  },
  privacy: {
    title: "隐私政策",
    intro: "本政策说明 Hugo Studio 收集哪些数据、用途、与谁共享以及您的权利（依据越南第 13/2023/NĐ-CP 号法令）。",
    sections: [
      { h: "1. 谁处理您的数据", p: [
        `Hugo Studio 的创立者与运营者 Hugo Wishpax 是数据控制者和处理者。个人数据相关请求请发送至 ${CONTACT}。`,
      ] },
      { h: "2. 我们收集的数据", li: [
        "登录：来自 Google 的邮箱、姓名和头像；通行密钥的公钥。指纹和面部信息只保存在您的设备上，我们不会收到。",
        "必填：出生日期，用于核验年龄。",
        "选填，仅在您主动填写时：显示名称、照片、链接、成就、电话号码、国家、省/市、地址、地图定位点。",
        "使用应用时：JOY 记录、游戏分数、打开过的应用、问卷回答、Today 帖子、支持请求。",
        "技术与安全：IP 地址、基于 IP 的大致位置、设备类型、设备语言、推送通知令牌。仅在您允许时读取 GPS 位置。",
        "咨询服务或捐助：姓名、邮箱、电话、留言内容。捐助者姓名仅在您选择公开时显示。",
      ] },
      { h: "3. 用途", li: [
        "登录并保证账户和功能正常运行。",
        "核验年龄、防止欺诈（电话号码用于确保每人只领取一次奖励）。",
        "发现异常登录和攻击。",
        "发送您已开启的通知（安全、余额、提醒）。不发送营销邮件。",
        "过滤 Today 上的违规内容并推荐相关帖子。",
      ] },
      { h: "4. 我们不会做的事", li: [
        "不出售或出租数据。",
        "无广告，不使用广告 Cookie，不跨站追踪。",
        "不收集宗教、民族、健康或生物识别数据。",
      ] },
      { h: "5. 第三方处理方", p: [
        "仅用于运营服务，每一方只获得所需的最少数据。大部分服务器位于越南境外（美国、新加坡），因此数据会被传输至境外。",
      ], li: [
        "Google：登录；Gemini AI 处理 Today 帖子、支持请求以及您提交的证明图片。",
        "MongoDB Atlas（数据库）、Render 和 Vercel（服务器）、Cloudflare（内容分发、防攻击）。",
        "Cloudinary：存储您上传的图片。",
        "PayOS：处理捐助和服务付款。",
        "Resend：发送事务性邮件（登录验证码、通知）。",
        "Sentry：记录技术错误，不含身份信息。",
        "ipinfo：根据 IP 查询国家和网络运营商。OpenStreetMap：将地图定位点转换为地址。",
        "Apple、Google、Mozilla 的推送通知服务。",
      ] },
      { h: "6. 存储与安全", li: [
        "所有连接均使用 HTTPS。详细地址和坐标加密存储。",
        "数据保留至您删除账户为止。到期账户会被锁定而不会被删除。",
        "删除账户即删除全部数据，仅保留邮箱的哈希值，用于防止反复注册领取试用。",
      ] },
      { h: "7. 您的权利", li: [
        "在“设置”中查看和修改您的数据。",
        "在应用内删除账户：设置 → 删除账户。",
        "随时撤回同意：关闭通知或位置权限，或删除选填信息。",
        `索取数据副本、反对处理或投诉：${CONTACT}。我们会在 72 小时内回复。`,
      ] },
      { h: "8. 未成年人", p: [
        "不接受 14 岁以下用户。14 至 15 岁需在我们处理数据前取得父母或监护人同意。18 岁以下用户的信息不会完整公开显示。",
      ] },
      { h: "9. Cookie", p: [
        "仅使用维持登录所需的 Cookie，没有广告或分析类 Cookie。",
      ] },
      { h: "10. 变更", p: [
        "政策变更会在生效前于应用内通知。",
      ] },
    ],
  },
};

const DOCS = { vi, en, zh };

/** `kind`: "terms" | "privacy". Ngôn ngữ khác rơi về tiếng Việt. */
export function legalDoc(kind, lang = "vi") {
  const code = String(lang || "vi").slice(0, 2);
  return (DOCS[code] || vi)[kind];
}
