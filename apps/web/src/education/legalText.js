// Văn bản pháp lý của Education Hugo bằng ba ngôn ngữ (vi/en/zh) — giao diện ngôn ngữ nào hiện bản đó.
// Ba bản phải cùng nội dung; bản tiếng Anh là bản gốc. Mọi khẳng định ở đây phải khớp với hệ thống thật:
// sửa luồng dữ liệu (thêm nhà cung cấp, đổi thời hạn lưu, thêm loại dữ liệu) thì sửa văn bản này.
// Đổi nội dung đáng kể → cập nhật UPDATED và báo người học (push/hộp thông báo).
export const UPDATED = { en: "2 November 2026", vi: "02/11/2026", zh: "2026年11月2日" };
export const UPDATED_LABEL = { en: "Last updated", vi: "Cập nhật lần cuối", zh: "最后更新" };
export const CONTACT = "contact@hugowishpax.studio";

const EN = {
  terms: {
    title: "Terms of Use",
    lead: "These Terms govern your use of Education Hugo, the free learning service operated by Hugo Studio at education.hugowishpax.studio. By creating an account or continuing to use the service, you accept them in full. If you do not, please refrain from using Education Hugo.",
    sections: [
      {
        h: "1. Who we are",
        p: [
          "Education Hugo is a non-profit educational service of Hugo Studio. It shares a single account system, JOY wallet and public identity (Persona) with www.hugowishpax.studio; where these Terms are silent, the Hugo Studio Terms of Service apply.",
          `Questions about these Terms may be addressed to ${CONTACT}.`,
        ],
      },
      {
        h: "2. Eligibility",
        p: [
          "You must be at least 14 years of age to hold an account. Learners aged 14 to 17 may use Education Hugo only with the knowledge and consent of a parent or legal guardian, who assumes responsibility for their use of the service.",
          "You may hold only one account, and you must not create an account on behalf of another person or impersonate anyone.",
        ],
      },
      {
        h: "3. Your account",
        p: [
          "You sign in with Google or with a passkey (Face ID, fingerprint or a device PIN). You are responsible for safeguarding the devices and credentials that give access to your account and for all activity that occurs under it. Notify us without delay if you suspect unauthorised access.",
          "Courses are free of charge. Accounts nonetheless follow Hugo Studio's maintenance rules: a new account receives a trial period, which may be extended with JOY earned through learning, and verified students receive a year of access. An account that lapses may be restricted until it is renewed; your learning progress is not discarded merely because access has lapsed.",
        ],
      },
      {
        h: "4. JOY, XP and streaks",
        p: [
          "JOY, XP, streaks, milestones and league positions are in-service motivational features. They carry no monetary value, cannot be redeemed for cash and confer no proprietary right. Their rules are computed exclusively by our servers, and we may recalibrate them to preserve fairness.",
          "Any attempt to obtain JOY, XP or progress by automation, scripted submissions, exploitation of defects or collusion is prohibited. We may reverse illegitimately obtained balances and suspend the accounts concerned.",
        ],
      },
      {
        h: "5. The item shop",
        p: [
          "You may exchange JOY for items in the Store. Each item takes effect as soon as the purchase succeeds: a badge is worn on your member card and public profile; Double XP doubles league XP for the stated number of hours, and further purchases add to the remaining time; a Streak Shield automatically thaws a day you missed at 8 a.m. the following morning, up to five shields at a time. Prices, stock and descriptions are shown before you confirm.",
          "Items are personal and cannot be transferred, resold or exchanged for money. A completed purchase is final; if an item cannot be applied for a technical reason, the purchase is cancelled and the JOY is returned automatically. We may adjust prices, withdraw items or change stock at any time without affecting items you already hold.",
        ],
      },
      {
        h: "6. Course content and intellectual property",
        p: [
          "Lessons, quizzes, illustrations, mascots, source code samples and the curriculum itself are the work of Hugo Studio and are protected by copyright. Real photographs used in lessons are reproduced under the Creative Commons licence credited beneath each one, and the SQLite engine that runs the SQL exercises is in the public domain. You may use them for your personal learning. You may not scrape, republish, sell or systematically reproduce them without written permission.",
          "Code you write while following a lesson belongs to you. Third-party assets are used under their own licences, which are credited where they appear (for example the pixel-art character style by DiceBear under CC0, and the “Spiro Streak” flame animation under CC BY 4.0).",
        ],
      },
      {
        h: "7. Community, friends and your content",
        p: [
          "You may publish text and links in the Community, set a nickname and a short introduction, choose a character, and connect with other learners through mutually accepted friend requests. You remain the owner of what you post, and you grant Hugo Studio a non-exclusive, royalty-free licence to host, display and moderate it for the purpose of operating the service.",
          "Everything you post must comply with the Community Guidelines, which form part of these Terms. We do not store uploaded images or videos: link previews are rendered in your browser directly from the original source, and we bear no responsibility for content hosted elsewhere.",
        ],
      },
      {
        h: "8. Moderation and enforcement",
        p: [
          "Posts are screened automatically for abusive language and periodically reviewed. Content that breaches these Terms may be hidden; hidden content remains visible to its author with a notice and may be restored on review. Reports submitted by learners are examined by people, not acted upon automatically.",
          "Serious or repeated breaches may lead to the removal of content, the reset of a nickname or character, the loss of illegitimate JOY or XP, or the suspension or termination of the account. Where practicable, we will tell you what action was taken and why.",
        ],
      },
      {
        h: "9. Availability and changes",
        p: [
          "Education Hugo runs on free-tier infrastructure and is provided on an “as is” and “as available” basis. We strive for continuity but do not guarantee uninterrupted or error-free operation, and features may degrade gracefully when free quotas are exhausted.",
          "We may modify, add or withdraw features and amend these Terms. Material changes will be announced in the service before they take effect; continued use thereafter constitutes acceptance.",
        ],
      },
      {
        h: "10. Liability",
        p: [
          "To the fullest extent permitted by law, Hugo Studio shall not be liable for indirect or consequential loss arising from your use of, or inability to use, the service. Nothing in these Terms excludes liability that cannot lawfully be excluded, nor limits any statutory right you hold as a consumer.",
        ],
      },
      {
        h: "11. Governing law",
        p: [
          "These Terms are governed by the laws of the Socialist Republic of Vietnam. We will first seek to resolve any dispute amicably; failing that, it shall be submitted to the competent court of Vietnam.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    lead: "This Policy explains what personal data Education Hugo processes, why, with whom it is shared and how you may exercise control over it. We collect only what the service genuinely needs, we never sell personal data, and we display no advertising.",
    sections: [
      {
        h: "1. Controller",
        p: [
          `Hugo Studio is the controller of the personal data described here. Requests concerning your data may be sent to ${CONTACT}. We process personal data in accordance with applicable Vietnamese law on personal data protection, including Decree No. 13/2023/ND-CP and any legislation that succeeds it.`,
        ],
      },
      {
        h: "2. Data we process",
        list: [
          "Account data — your email address and display name from Google sign-in; for passkeys, a public key and device label (the biometric itself never leaves your device).",
          "Public identity (Persona) — nickname, pixel-art character, short introduction and friend code. These are visible to other signed-in learners; your real name, email and photograph are never shown on leagues, profiles or in the Community.",
          "Learning data — completed steps and lessons, quiz answers and scores, streak calendar, XP, daily goals and personal settings. SQL exercises run entirely inside your browser; what you type there is kept only on your device as a draft and is never sent to us.",
          "Store data — items you have bought, the badge you wear, remaining Streak Shields and Double XP time, together with the JOY transactions that paid for them.",
          "Feedback — your ratings and comments in the Education Hugo survey, and the reports and support requests you send; you can review all of them under Profile › Feedback history.",
          "Social data — friends, pending friend requests, Community posts, replies and likes, and reports you submit or that concern you.",
          "Device and notification data — push subscriptions with the device language, notifications delivered to your inbox, and technical security records such as IP address and user agent, used to detect abuse.",
          "Performance metrics — anonymous page-speed and error measurements that contain no identifier of you.",
        ],
      },
      {
        h: "3. Why we process it",
        list: [
          "To provide the service you requested: authentication, lessons, progress, streaks, leagues and friends (performance of our agreement with you).",
          "To keep the service safe: rate limiting, abuse detection, moderation and the handling of reports (legitimate interest and legal obligation).",
          "To send study reminders, streak alerts, friend requests and account notices — only where you have enabled notifications, and always adjustable in Profile (consent).",
          "To send a limited number of emails: a welcome message, account and security notices, streak milestones, friend requests and, once a month between the 1st and the 7th, a trilingual letter inviting voluntary feedback and support for Education Hugo. Every non-essential email can be switched off with the email setting in Profile; security and account notices remain (consent and legitimate interest).",
        ],
        p: ["We do not use your data for advertising, we do not build marketing profiles, and we do not make decisions producing legal effects about you by automated means alone."],
      },
      {
        h: "4. Service providers",
        p: ["We rely on a small number of processors, each bound to handle data only on our instructions:"],
        list: [
          "MongoDB Atlas (database), Render (application server), Vercel (web hosting) and Cloudflare (network delivery and protection).",
          "Google, solely for sign-in when you choose it.",
          "Resend (with an SMTP relay as fallback), which delivers our emails; it receives your email address and the message content only.",
          "Browser push services operated by Apple, Google or Mozilla, which relay notifications to your device.",
          "Telegram, which delivers internal alerts to our administrators; a report alert contains the reported learner's nickname and friend code, never an email address.",
        ],
      },
      {
        h: "5. Third-party content in the Community",
        p: [
          "Link previews are built in your browser from the address itself. When a post contains an image link, the image is loaded directly from the server that hosts it; YouTube is contacted only when you press play, through its privacy-enhanced domain. Those third parties may therefore receive your IP address under their own policies. Hugo stores only the text and the address, never a copy of the media.",
        ],
      },
      {
        h: "6. Retention",
        list: [
          "Account, Persona and learning data are kept for as long as your account exists.",
          "Inbox notifications are deleted automatically after 90 days; security records after 180 days; anonymous performance metrics after 30 days.",
          "Hidden Community content and reports are retained while they remain relevant to moderation, then deleted.",
          "Survey answers and feedback history are kept for as long as your account exists, so that you can always consult them.",
          "When you delete your account, your personal data is erased or irreversibly anonymised, save for what the law obliges us to retain.",
        ],
      },
      {
        h: "7. Your rights",
        p: [
          `You may access, correct or delete your personal data, request a copy of it in a portable format, withdraw consent to notifications, and object to or restrict certain processing. Most controls live in Profile; account deletion is available in your Hugo Studio account settings, and any other request may be sent to ${CONTACT}. We will respond within the time limits set by law and may first verify your identity.`,
        ],
      },
      {
        h: "8. Learners under 18",
        p: [
          "Education Hugo is intended for people aged 14 and over. For learners under 18 we collect no more data than the service requires, show no advertising and never disclose real identities publicly. A parent or guardian may contact us to review or delete a minor's data.",
        ],
      },
      {
        h: "9. Storage on your device",
        p: [
          "We use a strictly necessary session cookie to keep you signed in, and the browser's local storage for conveniences such as your language, sound preference, your place in a lesson and guest progress. We use no advertising or cross-site tracking cookies, so no cookie consent banner is required for them.",
        ],
      },
      {
        h: "10. Security and transfers",
        p: [
          "Data travels encrypted over HTTPS and is stored with access controls and audit logging. Because our providers operate internationally, data may be processed outside Vietnam; we rely only on providers that offer appropriate safeguards. No system is invulnerable, and should a breach affect you we will notify you and the competent authority as the law requires.",
        ],
      },
      {
        h: "11. Changes",
        p: ["We will announce material changes to this Policy within the service before they take effect. The date at the top shows the latest revision."],
      },
    ],
  },

  guidelines: {
    title: "Community Guidelines",
    lead: "Education Hugo is a place to learn, to ask without fear of ridicule and to help one another. These Guidelines apply to nicknames, characters, introductions, Community posts, replies and every interaction between learners. They form part of the Terms of Use.",
    sections: [
      {
        h: "Be kind and constructive",
        list: [
          "Critique code, never the person who wrote it. Beginners are welcome, and every question deserves a courteous answer.",
          "Harassment, bullying, threats, hate speech and discrimination on any ground are prohibited.",
        ],
      },
      {
        h: "Keep it safe and appropriate",
        list: [
          "No sexual content, graphic violence, content encouraging self-harm, or anything unsuitable for a community that includes learners aged 14 and over.",
          "Do not post anyone's personal information — real names, addresses, telephone numbers, email addresses or photographs — without their explicit consent, and never your own sensitive data.",
          "Nicknames, characters and introductions must not be offensive, misleading or impersonate another person or organisation.",
        ],
      },
      {
        h: "Be honest",
        list: [
          "Do not cheat on quizzes, automate submissions or exploit defects to inflate JOY, XP or streaks, and do not trade store items for money.",
          "Share work you created or are entitled to share; credit the sources you rely on. Do not post pirated material or links to malware or phishing.",
          "No spam, advertising, referral schemes or repeated identical posts.",
        ],
      },
      {
        h: "Reporting and enforcement",
        p: [
          "If something breaches these Guidelines, use “Report user” on the learner's profile or contact us. Reports are confidential: the person reported is not told who reported them. Every report is reviewed by people.",
          "Depending on severity and recurrence, we may hide content, reset a nickname or character, revoke illegitimate rewards, or suspend or close an account. Knowingly false reports are themselves a breach.",
        ],
      },
    ],
  },
};

const VI = {
  terms: {
    title: "Điều khoản sử dụng",
    lead: "Điều khoản này điều chỉnh việc bạn sử dụng Education Hugo — dịch vụ học tập miễn phí do Hugo Studio vận hành tại education.hugowishpax.studio. Khi tạo tài khoản hoặc tiếp tục sử dụng dịch vụ, bạn chấp nhận toàn bộ Điều khoản. Nếu không đồng ý, vui lòng không sử dụng Education Hugo.",
    sections: [
      { h: "1. Chúng tôi là ai", p: [
        "Education Hugo là dịch vụ giáo dục phi lợi nhuận của Hugo Studio. Dịch vụ dùng chung hệ thống tài khoản, ví JOY và danh tính công khai (Persona) với www.hugowishpax.studio; điều gì Điều khoản này không nói tới thì áp dụng Điều khoản dịch vụ của Hugo Studio.",
        `Mọi câu hỏi về Điều khoản xin gửi tới ${CONTACT}.`,
      ] },
      { h: "2. Điều kiện sử dụng", p: [
        "Bạn phải từ đủ 14 tuổi để có tài khoản. Người học từ 14 đến 17 tuổi chỉ được dùng Education Hugo khi cha mẹ hoặc người giám hộ hợp pháp biết và đồng ý; người đó chịu trách nhiệm về việc sử dụng dịch vụ của người học.",
        "Mỗi người chỉ được có một tài khoản, không tạo tài khoản thay người khác và không mạo danh bất kỳ ai.",
      ] },
      { h: "3. Tài khoản của bạn", p: [
        "Bạn đăng nhập bằng Google hoặc bằng khoá truy cập (Face ID, vân tay hoặc mã PIN của thiết bị). Bạn có trách nhiệm giữ an toàn thiết bị và thông tin đăng nhập, và chịu trách nhiệm cho mọi hoạt động dưới tài khoản của mình. Hãy báo ngay cho chúng tôi nếu nghi ngờ có truy cập trái phép.",
        "Các khoá học miễn phí. Tuy vậy tài khoản vẫn theo quy định duy trì của Hugo Studio: tài khoản mới có thời gian dùng thử, có thể gia hạn bằng JOY kiếm được từ việc học, và người học đã xác minh học sinh – sinh viên được một năm sử dụng. Tài khoản hết hạn có thể bị giới hạn cho tới khi gia hạn; tiến độ học không bị xoá chỉ vì hết hạn.",
      ] },
      { h: "4. JOY, XP và chuỗi lửa", p: [
        "JOY, XP, chuỗi lửa, mốc thưởng và thứ hạng thi đua là tính năng tạo động lực trong dịch vụ. Chúng không có giá trị tiền tệ, không quy đổi được thành tiền mặt và không tạo ra quyền sở hữu nào. Quy tắc của chúng do máy chủ của chúng tôi tính toán, và có thể được điều chỉnh để giữ công bằng.",
        "Mọi hành vi kiếm JOY, XP hoặc tiến độ bằng tự động hoá, nộp bài bằng script, khai thác lỗi hay thông đồng đều bị cấm. Chúng tôi có thể thu hồi số dư có được trái phép và tạm khoá các tài khoản liên quan.",
      ] },
      { h: "5. Cửa hàng vật phẩm", p: [
        "Bạn có thể đổi JOY lấy vật phẩm trong Cửa hàng. Mỗi vật phẩm có tác dụng ngay khi mua thành công: huy hiệu được đeo lên thẻ thành viên và hồ sơ công khai; Nhân đôi XP nhân đôi XP thi đua trong số giờ ghi trên vật phẩm, mua thêm thì cộng dồn vào thời gian còn lại; Khiên lửa tự phá băng ngày bạn lỡ học vào 8 giờ sáng hôm sau, giữ tối đa năm khiên. Giá, số lượng còn lại và mô tả được hiển thị trước khi bạn xác nhận.",
        "Vật phẩm thuộc về cá nhân bạn, không chuyển nhượng, bán lại hay đổi thành tiền. Giao dịch đã hoàn tất là cuối cùng; nếu vì lý do kỹ thuật mà vật phẩm không áp dụng được, giao dịch bị huỷ và JOY được hoàn tự động. Chúng tôi có thể đổi giá, ngừng bán hoặc thay đổi số lượng bất cứ lúc nào mà không ảnh hưởng tới vật phẩm bạn đang có.",
      ] },
      { h: "6. Nội dung khoá học và sở hữu trí tuệ", p: [
        "Bài học, trắc nghiệm, hình minh hoạ, nhân vật, mã nguồn mẫu và bản thân giáo trình là tác phẩm của Hugo Studio và được bảo hộ quyền tác giả. Ảnh thực tế trong bài được dùng theo giấy phép Creative Commons ghi công ngay dưới mỗi ảnh, và công cụ SQLite chạy bài tập SQL thuộc phạm vi công cộng. Bạn được dùng nội dung để tự học; không được cào, đăng lại, bán hoặc sao chép có hệ thống khi chưa có văn bản cho phép.",
        "Mã bạn viết khi làm theo bài học thuộc về bạn. Tài nguyên của bên thứ ba được dùng theo giấy phép riêng và được ghi công tại nơi xuất hiện (ví dụ phong cách nhân vật pixel của DiceBear theo CC0, hoạt cảnh lửa “Spiro Streak” theo CC BY 4.0).",
      ] },
      { h: "7. Cộng đồng, bạn bè và nội dung của bạn", p: [
        "Bạn có thể đăng chữ và liên kết trong Cộng đồng, đặt biệt danh và lời giới thiệu ngắn, chọn nhân vật, và kết nối với người học khác qua lời mời kết bạn được hai bên chấp nhận. Bạn vẫn là chủ sở hữu nội dung mình đăng, và cấp cho Hugo Studio quyền không độc quyền, miễn phí để lưu trữ, hiển thị và kiểm duyệt nội dung đó nhằm vận hành dịch vụ.",
        "Mọi nội dung phải tuân theo Quy tắc cộng đồng — một phần của Điều khoản này. Chúng tôi không lưu ảnh hay video tải lên: bản xem trước liên kết được dựng trong trình duyệt của bạn trực tiếp từ nguồn gốc, và chúng tôi không chịu trách nhiệm về nội dung lưu ở nơi khác.",
      ] },
      { h: "8. Kiểm duyệt và xử lý vi phạm", p: [
        "Bài đăng được lọc tự động ngôn từ thô tục và được rà soát định kỳ. Nội dung vi phạm có thể bị ẩn; nội dung bị ẩn vẫn hiện với tác giả kèm thông báo và có thể được khôi phục sau khi xem xét. Báo cáo của người học do con người xem xét, không xử lý tự động.",
        "Vi phạm nghiêm trọng hoặc lặp lại có thể dẫn tới gỡ nội dung, đặt lại biệt danh hoặc nhân vật, thu hồi JOY/XP có được trái phép, hoặc tạm khoá hay chấm dứt tài khoản. Khi có thể, chúng tôi sẽ cho bạn biết đã xử lý gì và vì sao.",
      ] },
      { h: "9. Tính sẵn sàng và thay đổi", p: [
        "Education Hugo chạy trên hạ tầng gói miễn phí và được cung cấp “nguyên trạng” và “trong phạm vi sẵn có”. Chúng tôi cố gắng duy trì liên tục nhưng không bảo đảm dịch vụ không gián đoạn hay không lỗi, và một số tính năng có thể tạm giảm khi hết hạn mức miễn phí.",
        "Chúng tôi có thể sửa, thêm hoặc ngừng tính năng và sửa đổi Điều khoản. Thay đổi quan trọng sẽ được thông báo trong dịch vụ trước khi có hiệu lực; tiếp tục sử dụng sau đó nghĩa là bạn chấp nhận.",
      ] },
      { h: "10. Trách nhiệm", p: [
        "Trong phạm vi tối đa pháp luật cho phép, Hugo Studio không chịu trách nhiệm về thiệt hại gián tiếp hay hệ quả phát sinh từ việc bạn sử dụng hoặc không thể sử dụng dịch vụ. Không điều gì trong Điều khoản này loại trừ trách nhiệm mà pháp luật không cho loại trừ, hay hạn chế quyền luật định của bạn với tư cách người tiêu dùng.",
      ] },
      { h: "11. Luật áp dụng", p: [
        "Điều khoản này được điều chỉnh bởi pháp luật nước Cộng hoà Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp trước hết được giải quyết bằng thương lượng; nếu không thành, tranh chấp được đưa ra toà án có thẩm quyền tại Việt Nam.",
      ] },
    ],
  },
  privacy: {
    title: "Chính sách quyền riêng tư",
    lead: "Chính sách này giải thích Education Hugo xử lý dữ liệu cá nhân nào, vì sao, chia sẻ với ai và bạn kiểm soát chúng thế nào. Chúng tôi chỉ thu thập những gì dịch vụ thật sự cần, không bao giờ bán dữ liệu cá nhân và không hiển thị quảng cáo.",
    sections: [
      { h: "1. Bên kiểm soát dữ liệu", p: [
        `Hugo Studio là bên kiểm soát dữ liệu cá nhân được mô tả ở đây. Yêu cầu liên quan tới dữ liệu của bạn xin gửi tới ${CONTACT}. Chúng tôi xử lý dữ liệu cá nhân theo pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, gồm Nghị định 13/2023/NĐ-CP và văn bản thay thế (nếu có).`,
      ] },
      { h: "2. Dữ liệu chúng tôi xử lý", list: [
        "Dữ liệu tài khoản — email và tên hiển thị từ đăng nhập Google; với khoá truy cập: khoá công khai và tên thiết bị (dữ liệu sinh trắc học không bao giờ rời khỏi thiết bị của bạn).",
        "Danh tính công khai (Persona) — biệt danh, nhân vật pixel, lời giới thiệu ngắn và mã bạn. Người học đã đăng nhập khác thấy được những thông tin này; tên thật, email và ảnh của bạn không bao giờ hiện trên bảng thi đua, hồ sơ hay Cộng đồng.",
        "Dữ liệu học tập — step và bài đã học, câu trả lời và điểm trắc nghiệm, lịch chuỗi lửa, XP, mục tiêu ngày và cài đặt cá nhân. Bài tập SQL chạy hoàn toàn trong trình duyệt; những gì bạn gõ ở đó chỉ lưu nháp trên thiết bị của bạn và không bao giờ gửi về chúng tôi.",
        "Dữ liệu Cửa hàng — vật phẩm đã mua, huy hiệu đang đeo, số Khiên lửa và thời gian Nhân đôi XP còn lại, cùng các giao dịch JOY đã thanh toán.",
        "Phản hồi — điểm và góp ý của bạn trong khảo sát Education Hugo, các báo cáo và yêu cầu hỗ trợ bạn gửi; bạn xem lại được tất cả ở Hồ sơ › Lịch sử phản hồi.",
        "Dữ liệu xã hội — bạn bè, lời mời kết bạn đang chờ, bài đăng, trả lời và lượt thích trong Cộng đồng, các báo cáo bạn gửi hoặc liên quan tới bạn.",
        "Dữ liệu thiết bị và thông báo — đăng ký nhận thông báo đẩy kèm ngôn ngữ thiết bị, thông báo trong hộp thư, và bản ghi bảo mật kỹ thuật như địa chỉ IP và user agent dùng để phát hiện lạm dụng.",
        "Số đo hiệu năng — số đo tốc độ trang và lỗi ẩn danh, không chứa định danh nào của bạn.",
      ] },
      { h: "3. Vì sao chúng tôi xử lý", list: [
        "Để cung cấp dịch vụ bạn yêu cầu: đăng nhập, bài học, tiến độ, chuỗi lửa, thi đua, bạn bè và Cửa hàng (thực hiện thoả thuận với bạn).",
        "Để giữ an toàn cho dịch vụ: giới hạn tần suất, phát hiện lạm dụng, kiểm duyệt và xử lý báo cáo (lợi ích chính đáng và nghĩa vụ pháp lý).",
        "Để gửi nhắc học, cảnh báo chuỗi lửa, lời mời kết bạn và thông báo tài khoản — chỉ khi bạn bật thông báo, và luôn chỉnh được trong Hồ sơ (sự đồng ý).",
        "Để gửi một số ít email: thư chào mừng, thông báo tài khoản và bảo mật, mốc chuỗi lửa, lời mời kết bạn, và mỗi tháng một lần trong khoảng ngày 01–07, một lá thư ba ngôn ngữ mời bạn tự nguyện góp ý và ủng hộ Education Hugo. Mọi email không thiết yếu đều tắt được bằng công tắc email trong Hồ sơ; thông báo bảo mật và tài khoản vẫn được gửi (sự đồng ý và lợi ích chính đáng).",
      ], p: ["Chúng tôi không dùng dữ liệu của bạn cho quảng cáo, không lập hồ sơ tiếp thị và không đưa ra quyết định có hệ quả pháp lý đối với bạn chỉ bằng phương tiện tự động."] },
      { h: "4. Nhà cung cấp dịch vụ", p: ["Chúng tôi dùng một số ít bên xử lý, mỗi bên chỉ được xử lý dữ liệu theo chỉ dẫn của chúng tôi:"], list: [
        "MongoDB Atlas (cơ sở dữ liệu), Render (máy chủ ứng dụng), Vercel (lưu trữ web) và Cloudflare (phân phối và bảo vệ mạng).",
        "Google, chỉ cho việc đăng nhập khi bạn chọn.",
        "Resend (kèm máy chủ SMTP dự phòng) để gửi email; bên này chỉ nhận địa chỉ email của bạn và nội dung thư.",
        "Dịch vụ thông báo đẩy của trình duyệt do Apple, Google hoặc Mozilla vận hành, chuyển thông báo tới thiết bị của bạn.",
        "Telegram, chuyển cảnh báo nội bộ tới quản trị viên; cảnh báo báo cáo chỉ chứa biệt danh và mã bạn của người bị báo cáo, không bao giờ có email.",
      ] },
      { h: "5. Nội dung bên thứ ba trong Cộng đồng", p: [
        "Bản xem trước liên kết được dựng trong trình duyệt của bạn từ chính địa chỉ đó. Khi bài đăng có liên kết ảnh, ảnh được tải trực tiếp từ máy chủ lưu nó; YouTube chỉ được gọi khi bạn bấm phát, qua tên miền tăng cường quyền riêng tư. Vì vậy các bên thứ ba này có thể nhận địa chỉ IP của bạn theo chính sách riêng của họ. Hugo chỉ lưu chữ và địa chỉ, không bao giờ lưu bản sao nội dung đa phương tiện.",
      ] },
      { h: "6. Thời hạn lưu trữ", list: [
        "Dữ liệu tài khoản, Persona và học tập được lưu chừng nào tài khoản còn tồn tại.",
        "Thông báo trong hộp thư tự xoá sau 90 ngày; bản ghi bảo mật sau 180 ngày; số đo hiệu năng ẩn danh sau 30 ngày.",
        "Nội dung Cộng đồng bị ẩn và báo cáo được giữ khi còn cần cho kiểm duyệt, sau đó bị xoá.",
        "Câu trả lời khảo sát và lịch sử phản hồi được giữ chừng nào tài khoản còn tồn tại, để bạn luôn xem lại được.",
        "Khi bạn xoá tài khoản, dữ liệu cá nhân được xoá hoặc ẩn danh không thể khôi phục, trừ phần pháp luật buộc chúng tôi lưu giữ.",
      ] },
      { h: "7. Quyền của bạn", p: [
        `Bạn có quyền truy cập, chỉnh sửa hoặc xoá dữ liệu cá nhân, yêu cầu bản sao ở định dạng có thể chuyển, rút lại sự đồng ý nhận thông báo, và phản đối hoặc hạn chế một số hoạt động xử lý. Phần lớn công cụ nằm trong Hồ sơ; xoá tài khoản ở phần cài đặt tài khoản Hugo Studio, và mọi yêu cầu khác xin gửi tới ${CONTACT}. Chúng tôi trả lời trong thời hạn luật định và có thể xác minh danh tính của bạn trước.`,
      ] },
      { h: "8. Người học dưới 18 tuổi", p: [
        "Education Hugo dành cho người từ 14 tuổi. Với người học dưới 18 tuổi, chúng tôi không thu thập nhiều hơn mức dịch vụ cần, không hiển thị quảng cáo và không bao giờ công khai danh tính thật. Cha mẹ hoặc người giám hộ có thể liên hệ để xem lại hoặc xoá dữ liệu của trẻ.",
      ] },
      { h: "9. Lưu trữ trên thiết bị của bạn", p: [
        "Chúng tôi dùng một cookie phiên thật sự cần thiết để giữ bạn đăng nhập, và bộ nhớ cục bộ của trình duyệt cho những tiện ích như ngôn ngữ, âm thanh, vị trí đang học, khoá học đang chọn, nháp bài tập SQL và tiến độ khi học thử. Chúng tôi không dùng cookie quảng cáo hay theo dõi xuyên trang, nên không cần hộp thoại xin đồng ý cookie cho chúng.",
      ] },
      { h: "10. Bảo mật và chuyển dữ liệu", p: [
        "Dữ liệu được mã hoá khi truyền qua HTTPS và được lưu với kiểm soát truy cập và nhật ký kiểm tra. Vì các nhà cung cấp hoạt động quốc tế, dữ liệu có thể được xử lý ngoài Việt Nam; chúng tôi chỉ dùng nhà cung cấp có biện pháp bảo vệ phù hợp. Không hệ thống nào bất khả xâm phạm; nếu sự cố ảnh hưởng tới bạn, chúng tôi sẽ thông báo cho bạn và cơ quan có thẩm quyền theo quy định.",
      ] },
      { h: "11. Thay đổi", p: ["Thay đổi quan trọng của Chính sách sẽ được thông báo trong dịch vụ trước khi có hiệu lực. Ngày ở đầu trang là lần sửa gần nhất."] },
    ],
  },
  guidelines: {
    title: "Quy tắc cộng đồng",
    lead: "Education Hugo là nơi để học, để hỏi mà không sợ bị chê cười và để giúp nhau. Quy tắc này áp dụng cho biệt danh, nhân vật, lời giới thiệu, bài đăng, trả lời trong Cộng đồng và mọi tương tác giữa người học. Quy tắc là một phần của Điều khoản sử dụng.",
    sections: [
      { h: "Tử tế và mang tính xây dựng", list: [
        "Góp ý về đoạn mã, đừng nhắm vào người viết nó. Người mới luôn được chào đón, và câu hỏi nào cũng xứng đáng nhận câu trả lời lịch sự.",
        "Cấm quấy rối, bắt nạt, đe doạ, phát ngôn thù ghét và phân biệt đối xử dưới mọi hình thức.",
      ] },
      { h: "An toàn và phù hợp", list: [
        "Không nội dung tình dục, bạo lực ghê rợn, nội dung khuyến khích tự gây hại, hay bất cứ gì không phù hợp với một cộng đồng có người học từ 14 tuổi.",
        "Không đăng thông tin cá nhân của người khác — tên thật, địa chỉ, số điện thoại, email hay ảnh — khi chưa có sự đồng ý rõ ràng của họ, và không bao giờ đăng dữ liệu nhạy cảm của chính bạn.",
        "Biệt danh, nhân vật và lời giới thiệu không được xúc phạm, gây hiểu lầm hay mạo danh người hoặc tổ chức khác.",
      ] },
      { h: "Trung thực", list: [
        "Không gian lận trắc nghiệm, tự động nộp bài hay khai thác lỗi để thổi phồng JOY, XP hoặc chuỗi lửa, và không mua bán vật phẩm Cửa hàng bằng tiền.",
        "Chỉ chia sẻ thứ bạn tự làm hoặc được phép chia sẻ; ghi nguồn bạn tham khảo. Không đăng nội dung vi phạm bản quyền hay liên kết tới mã độc, lừa đảo.",
        "Không spam, quảng cáo, chương trình giới thiệu hay đăng lặp lại cùng một nội dung.",
      ] },
      { h: "Báo cáo và xử lý", p: [
        "Nếu thấy điều gì vi phạm Quy tắc, hãy dùng “Báo cáo người dùng” trên hồ sơ người học hoặc liên hệ chúng tôi. Báo cáo được giữ kín: người bị báo cáo không biết ai đã báo cáo. Mọi báo cáo đều do con người xem xét.",
        "Tuỳ mức độ và tần suất, chúng tôi có thể ẩn nội dung, đặt lại biệt danh hoặc nhân vật, thu hồi phần thưởng trái phép, hoặc tạm khoá hay đóng tài khoản. Cố ý báo cáo sai cũng là vi phạm.",
      ] },
    ],
  },
};

const ZH = {
  terms: {
    title: "使用条款",
    lead: "本条款适用于你使用 Education Hugo——由 Hugo Studio 在 education.hugowishpax.studio 运营的免费学习服务。创建账户或继续使用本服务，即表示你完全接受本条款。如不同意，请勿使用 Education Hugo。",
    sections: [
      { h: "1. 我们是谁", p: [
        "Education Hugo 是 Hugo Studio 的非营利教育服务，与 www.hugowishpax.studio 共用账户系统、JOY 钱包和公开身份（Persona）；本条款未涉及的事项，适用 Hugo Studio 服务条款。",
        `有关本条款的问题，请发送至 ${CONTACT}。`,
      ] },
      { h: "2. 使用资格", p: [
        "你必须年满 14 周岁才能拥有账户。14 至 17 岁的学员须在父母或法定监护人知情并同意的情况下使用 Education Hugo，并由其对学员的使用行为负责。",
        "每人只能拥有一个账户，不得替他人创建账户，也不得冒充任何人。",
      ] },
      { h: "3. 你的账户", p: [
        "你可以使用 Google 或通行密钥（Face ID、指纹或设备 PIN）登录。你有责任保护能访问账户的设备和凭据，并对账户下的所有活动负责。如怀疑有未经授权的访问，请立即通知我们。",
        "课程免费。但账户仍遵循 Hugo Studio 的维护规则：新账户有试用期，可用学习获得的 JOY 延长；通过学生认证的学员可获得一年使用期。账户过期后可能受到限制，直至续期；学习进度不会仅因过期而被删除。",
      ] },
      { h: "4. JOY、XP 与连胜", p: [
        "JOY、XP、连胜、里程碑和排行名次是服务内的激励功能，不具有货币价值，不能兑换现金，也不产生任何所有权。其规则仅由我们的服务器计算，我们可为维护公平而调整。",
        "禁止通过自动化、脚本提交、利用漏洞或串通等方式获取 JOY、XP 或进度。我们可收回不正当获得的余额并暂停相关账户。",
      ] },
      { h: "5. 道具商店", p: [
        "你可以在商店用 JOY 兑换道具。道具在购买成功后立即生效：徽章会佩戴在会员卡和公开主页上；双倍 XP 在标明的小时数内使排行 XP 翻倍，再次购买会累加剩余时间；火焰护盾会在你漏学后的次日早上 8 点自动为那一天破冰，最多同时持有五个。确认前会显示价格、库存和说明。",
        "道具归你个人所有，不得转让、转售或兑换成金钱。已完成的购买为最终交易；若因技术原因道具无法生效，购买将被取消并自动退还 JOY。我们可随时调整价格、下架道具或更改库存，但不影响你已拥有的道具。",
      ] },
      { h: "6. 课程内容与知识产权", p: [
        "课程、测验、插图、角色、示例源代码及课程体系本身均为 Hugo Studio 的作品，受著作权保护。课程中的实景照片依据每张照片下方注明的知识共享许可使用，运行 SQL 练习的 SQLite 引擎属于公有领域。你可将内容用于个人学习；未经书面许可，不得抓取、转载、出售或系统性复制。",
        "你在跟随课程时编写的代码归你所有。第三方素材按其各自许可使用，并在出现处注明（例如 DiceBear 的像素角色风格采用 CC0，“Spiro Streak”火焰动画采用 CC BY 4.0）。",
      ] },
      { h: "7. 社区、好友与你的内容", p: [
        "你可以在社区发布文字和链接，设置昵称和简短介绍，选择角色，并通过双方同意的好友请求与其他学员建立联系。你仍是所发布内容的所有者，并授予 Hugo Studio 非独占、免版税的许可，用于为运营服务而托管、展示和审核这些内容。",
        "所有发布内容须遵守社区准则（本条款的组成部分）。我们不存储上传的图片或视频：链接预览由你的浏览器直接从原始来源生成，我们不对托管在其他地方的内容负责。",
      ] },
      { h: "8. 审核与处理", p: [
        "帖子会自动过滤不当用语并定期审查。违反本条款的内容可能被隐藏；被隐藏的内容仍会附带通知向作者显示，经复核后可恢复。学员提交的举报由人工审核，不会自动处理。",
        "严重或屡次违规可能导致删除内容、重置昵称或角色、收回不正当获得的 JOY 或 XP，或暂停、终止账户。在可行时，我们会告知你所采取的措施及原因。",
      ] },
      { h: "9. 可用性与变更", p: [
        "Education Hugo 运行在免费层基础设施上，按“现状”和“现有”提供。我们力求服务连续，但不保证不中断或无错误；免费额度用尽时，部分功能可能暂时降级。",
        "我们可以修改、新增或撤回功能并修订本条款。重大变更会在生效前于服务内公告；此后继续使用即表示接受。",
      ] },
      { h: "10. 责任", p: [
        "在法律允许的最大范围内，Hugo Studio 不对因你使用或无法使用本服务而产生的间接或后果性损失负责。本条款不排除依法不得排除的责任，也不限制你作为消费者享有的法定权利。",
      ] },
      { h: "11. 适用法律", p: [
        "本条款受越南社会主义共和国法律管辖。任何争议应首先友好协商解决；协商不成的，提交越南有管辖权的法院处理。",
      ] },
    ],
  },
  privacy: {
    title: "隐私政策",
    lead: "本政策说明 Education Hugo 处理哪些个人数据、为何处理、与谁共享，以及你如何控制这些数据。我们只收集服务真正需要的数据，从不出售个人数据，也不展示广告。",
    sections: [
      { h: "1. 数据控制者", p: [
        `Hugo Studio 是本文所述个人数据的控制者。有关你数据的请求请发送至 ${CONTACT}。我们依据越南有关个人数据保护的法律处理个人数据，包括第 13/2023/NĐ-CP 号法令及其后续法规。`,
      ] },
      { h: "2. 我们处理的数据", list: [
        "账户数据——来自 Google 登录的电子邮箱和显示名称；使用通行密钥时，为公钥和设备名称（生物特征本身从不离开你的设备）。",
        "公开身份（Persona）——昵称、像素角色、简短介绍和好友码。其他已登录学员可以看到这些信息；你的真实姓名、邮箱和照片绝不会出现在排行、主页或社区中。",
        "学习数据——已完成的 step 和课程、测验答案与分数、连胜日历、XP、每日目标和个人设置。SQL 练习完全在你的浏览器中运行；你在其中输入的内容仅作为草稿保存在你的设备上，绝不会发送给我们。",
        "商店数据——你购买的道具、佩戴的徽章、剩余的火焰护盾和双倍 XP 时间，以及相应的 JOY 交易记录。",
        "反馈——你在 Education Hugo 问卷中的评分和意见，以及你提交的举报和支持请求；你可在“个人资料 › 反馈记录”中查看全部内容。",
        "社交数据——好友、待处理的好友请求、社区帖子、回复和点赞，以及你提交或与你有关的举报。",
        "设备与通知数据——附带设备语言的推送订阅、收件箱中的通知，以及用于发现滥用的技术安全记录，如 IP 地址和用户代理。",
        "性能指标——不含任何个人标识的匿名页面速度和错误数据。",
      ] },
      { h: "3. 处理目的", list: [
        "提供你所请求的服务：登录、课程、进度、连胜、排行、好友和商店（履行与你的约定）。",
        "保障服务安全：频率限制、滥用检测、内容审核和举报处理（正当利益和法定义务）。",
        "发送学习提醒、连胜提醒、好友请求和账户通知——仅在你开启通知时发送，并可随时在个人资料中调整（同意）。",
        "发送少量电子邮件：欢迎信、账户与安全通知、连胜里程碑、好友请求，以及每月 1 日至 7 日之间一封三语信件，邀请你自愿提供反馈并支持 Education Hugo。所有非必要邮件都可通过个人资料中的邮件开关关闭；安全和账户通知仍会发送（同意和正当利益）。",
      ], p: ["我们不将你的数据用于广告，不建立营销画像，也不会仅凭自动化手段作出对你产生法律效果的决定。"] },
      { h: "4. 服务提供方", p: ["我们依赖少数处理方，每一方都只能按照我们的指示处理数据："], list: [
        "MongoDB Atlas（数据库）、Render（应用服务器）、Vercel（网页托管）和 Cloudflare（网络分发与防护）。",
        "Google，仅在你选择时用于登录。",
        "Resend（以 SMTP 中继作为备用）负责发送邮件，只接收你的邮箱地址和邮件内容。",
        "由 Apple、Google 或 Mozilla 运营的浏览器推送服务，将通知转发到你的设备。",
        "Telegram，向我们的管理员发送内部提醒；举报提醒只包含被举报学员的昵称和好友码，绝不包含邮箱。",
      ] },
      { h: "5. 社区中的第三方内容", p: [
        "链接预览由你的浏览器根据链接地址本身生成。帖子包含图片链接时，图片直接从其托管服务器加载；只有在你点击播放时才会通过隐私增强域名连接 YouTube。因此这些第三方可能依据其自身政策获得你的 IP 地址。Hugo 只保存文字和地址，从不保存媒体副本。",
      ] },
      { h: "6. 保存期限", list: [
        "账户、Persona 和学习数据在账户存在期间一直保存。",
        "收件箱通知在 90 天后自动删除；安全记录在 180 天后删除；匿名性能指标在 30 天后删除。",
        "被隐藏的社区内容和举报在仍与审核相关时保留，之后删除。",
        "问卷答案和反馈记录在账户存在期间一直保存，方便你随时查看。",
        "你删除账户后，个人数据将被删除或不可逆地匿名化，法律要求我们保留的除外。",
      ] },
      { h: "7. 你的权利", p: [
        `你可以访问、更正或删除个人数据，索取可携带格式的副本，撤回对通知的同意，并反对或限制某些处理。大部分控制项位于个人资料中；账户删除位于 Hugo Studio 账户设置中，其他请求可发送至 ${CONTACT}。我们将在法定期限内答复，并可能先核实你的身份。`,
      ] },
      { h: "8. 未满 18 岁的学员", p: [
        "Education Hugo 面向 14 岁及以上人群。对于未满 18 岁的学员，我们不收集超出服务所需的数据，不展示广告，也绝不公开其真实身份。父母或监护人可联系我们查看或删除未成年人的数据。",
      ] },
      { h: "9. 存储在你设备上的数据", p: [
        "我们使用一个严格必要的会话 Cookie 来保持你的登录状态，并使用浏览器本地存储保存语言、声音偏好、学习位置、所选课程、SQL 练习草稿和访客进度等便利信息。我们不使用广告或跨站跟踪 Cookie，因此无需为此弹出 Cookie 同意提示。",
      ] },
      { h: "10. 安全与跨境传输", p: [
        "数据通过 HTTPS 加密传输，并在访问控制和审计日志下存储。由于服务提供方在国际范围内运营，数据可能在越南境外处理；我们只选用具备适当保护措施的提供方。没有任何系统坚不可摧；如发生影响你的数据泄露，我们将依法通知你和主管机关。",
      ] },
      { h: "11. 变更", p: ["本政策的重大变更将在生效前于服务内公告。页首日期为最近一次修订日期。"] },
    ],
  },
  guidelines: {
    title: "社区准则",
    lead: "Education Hugo 是一个学习、提问不怕被嘲笑、互相帮助的地方。本准则适用于昵称、角色、简介、社区帖子、回复以及学员之间的一切互动，是使用条款的组成部分。",
    sections: [
      { h: "友善且具建设性", list: [
        "评论代码，而不是写代码的人。欢迎初学者，每个问题都值得礼貌的回答。",
        "禁止骚扰、欺凌、威胁、仇恨言论和任何形式的歧视。",
      ] },
      { h: "安全且得体", list: [
        "不得发布色情内容、血腥暴力、鼓励自我伤害的内容，或任何不适合包含 14 岁以上学员的社区的内容。",
        "未经本人明确同意，不得发布他人的个人信息——真实姓名、地址、电话、邮箱或照片——也绝不要发布你自己的敏感数据。",
        "昵称、角色和简介不得具有冒犯性、误导性，或冒充其他个人或组织。",
      ] },
      { h: "诚实守信", list: [
        "不得在测验中作弊、自动提交或利用漏洞刷 JOY、XP 或连胜，也不得用金钱交易商店道具。",
        "只分享你自己创作或有权分享的作品，并注明参考来源。不得发布盗版内容或指向恶意软件、钓鱼网站的链接。",
        "禁止垃圾信息、广告、推荐计划或重复发布相同内容。",
      ] },
      { h: "举报与处理", p: [
        "如发现违反本准则的内容，请在该学员主页使用“举报用户”或联系我们。举报保密：被举报者不会知道是谁举报的。每份举报都由人工审核。",
        "视严重程度和频率，我们可能隐藏内容、重置昵称或角色、收回不正当奖励，或暂停、关闭账户。故意虚假举报本身也属违规。",
      ] },
    ],
  },
};

/** Văn bản theo ngôn ngữ giao diện (mặc định tiếng Anh nếu thiếu). */
export const LEGAL_BY_LANG = { en: EN, vi: VI, zh: ZH };
export const legalFor = (lang) => LEGAL_BY_LANG[lang] || EN;
