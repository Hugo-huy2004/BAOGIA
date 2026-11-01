// Văn bản pháp lý của Education Hugo — MỘT bản tiếng Anh (trình độ C2) hiển thị cho cả vi/en/zh,
// theo yêu cầu của chủ dự án (01/11/2026). Mọi khẳng định ở đây phải khớp với hệ thống thật:
// sửa luồng dữ liệu (thêm nhà cung cấp, đổi thời hạn lưu, thêm loại dữ liệu) thì sửa văn bản này.
// Đổi nội dung đáng kể → cập nhật UPDATED và báo người học (push/hộp thông báo).
export const UPDATED = "1 November 2026";
export const CONTACT = "contact@hugowishpax.studio";

export const LEGAL = {
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
        h: "5. Course content and intellectual property",
        p: [
          "Lessons, quizzes, illustrations, mascots, source code samples and the curriculum itself are the work of Hugo Studio and are protected by copyright. You may use them for your personal learning. You may not scrape, republish, sell or systematically reproduce them without written permission.",
          "Code you write while following a lesson belongs to you. Third-party assets are used under their own licences, which are credited where they appear (for example the pixel-art character style by DiceBear under CC0, and the “Spiro Streak” flame animation under CC BY 4.0).",
        ],
      },
      {
        h: "6. Community, friends and your content",
        p: [
          "You may publish text and links in the Community, set a nickname and a short introduction, choose a character, and connect with other learners through mutually accepted friend requests. You remain the owner of what you post, and you grant Hugo Studio a non-exclusive, royalty-free licence to host, display and moderate it for the purpose of operating the service.",
          "Everything you post must comply with the Community Guidelines, which form part of these Terms. We do not store uploaded images or videos: link previews are rendered in your browser directly from the original source, and we bear no responsibility for content hosted elsewhere.",
        ],
      },
      {
        h: "7. Moderation and enforcement",
        p: [
          "Posts are screened automatically for abusive language and periodically reviewed. Content that breaches these Terms may be hidden; hidden content remains visible to its author with a notice and may be restored on review. Reports submitted by learners are examined by people, not acted upon automatically.",
          "Serious or repeated breaches may lead to the removal of content, the reset of a nickname or character, the loss of illegitimate JOY or XP, or the suspension or termination of the account. Where practicable, we will tell you what action was taken and why.",
        ],
      },
      {
        h: "8. Availability and changes",
        p: [
          "Education Hugo runs on free-tier infrastructure and is provided on an “as is” and “as available” basis. We strive for continuity but do not guarantee uninterrupted or error-free operation, and features may degrade gracefully when free quotas are exhausted.",
          "We may modify, add or withdraw features and amend these Terms. Material changes will be announced in the service before they take effect; continued use thereafter constitutes acceptance.",
        ],
      },
      {
        h: "9. Liability",
        p: [
          "To the fullest extent permitted by law, Hugo Studio shall not be liable for indirect or consequential loss arising from your use of, or inability to use, the service. Nothing in these Terms excludes liability that cannot lawfully be excluded, nor limits any statutory right you hold as a consumer.",
        ],
      },
      {
        h: "10. Governing law",
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
          "Learning data — completed steps and lessons, quiz answers and scores, streak calendar, XP, daily goals and personal settings.",
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
        ],
        p: ["We do not use your data for advertising, we do not build marketing profiles, and we do not make decisions producing legal effects about you by automated means alone."],
      },
      {
        h: "4. Service providers",
        p: ["We rely on a small number of processors, each bound to handle data only on our instructions:"],
        list: [
          "MongoDB Atlas (database), Render (application server), Vercel (web hosting) and Cloudflare (network delivery and protection).",
          "Google, solely for sign-in when you choose it.",
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
          "Do not cheat on quizzes, automate submissions or exploit defects to inflate JOY, XP or streaks.",
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
