/**
 * Dữ liệu 2 bản văn bản quy chuẩn Hugo Studio phục vụ qua Node.js API:
 * 1. terms-manifest: Điều khoản dịch vụ & Tuyên ngôn hệ thống (Service Terms & System Manifest)
 * 2. database-policy: Quy ước cơ sở dữ liệu người dùng & Chính sách thành viên (User Database Conventions & Membership Policy)
 */

export const LEGAL_DOCUMENTS = {
  vi: {
    "terms-manifest": {
      id: "terms-manifest",
      title: "Điều khoản dịch vụ & Tuyên ngôn hệ thống",
      subtitle: "Bản hợp nhất số 01: Khung vận hành, cam kết chất lượng và quyền nghĩa vụ thành viên",
      updatedAt: "17/09/2026",
      intro: "Tuyên ngôn nguyên tắc hoạt động và điều khoản dịch vụ chính thức của hệ sinh thái Hugo Studio. Thiết lập mối quan hệ bình đẳng, minh bạch, cam kết không thu phí ẩn và bảo vệ môi trường trải nghiệm sáng tạo lành mạnh.",
      sections: [
        {
          id: "tuyen-ngon-van-hanh",
          title: "1. Tuyên ngôn vận hành & Cam kết không thu phí ẩn",
          blocks: [
            {
              type: "p",
              text: "Hugo Studio là không gian số tích hợp các tiện ích làm việc, sáng tạo cá nhân (Bio @slug), học tập và kết nối bạn bè được xây dựng dựa trên nguyên tắc minh bạch tuyệt đối và tôn trọng người dùng.",
            },
            {
              type: "note",
              tone: "verified",
              title: "Cam kết 3 Không tại Hugo Studio",
              text: "1. Không thu phí ẩn hoặc tự động trừ tiền âm thầm. 2. Không bán dữ liệu định danh người dùng cho bên quảng cáo thứ ba. 3. Không lưu mật khẩu, mã PIN ngân hàng hay mã OTP cá nhân.",
            },
            {
              type: "steps",
              items: [
                "Mọi tiện ích cốt lõi đều có thể trải nghiệm hoàn toàn miễn phí hoặc tích lũy điểm thưởng JOY qua nỗ lực học tập và check-in hàng ngày.",
                "Các gói dịch vụ phát triển trang web, hợp đồng thương mại hoặc mua sắm tiện ích bổ sung đều có báo giá rõ ràng, thanh toán một lần qua cổng Napas 24/7 (VietQR) có hóa đơn điện tử.",
                "Khi hệ thống điều chỉnh chính sách hoặc biểu giá, toàn bộ thông tin được niêm yết công khai trước ít nhất 14 ngày trên trang Điều khoản & Hướng dẫn sử dụng.",
              ],
            },
          ],
        },
        {
          id: "quyen-va-nghia-vu",
          title: "2. Quyền lợi và nghĩa vụ của thành viên",
          blocks: [
            {
              type: "p",
              text: "Mỗi thành viên khi khởi tạo tài khoản tại Hugo Studio đều được trao toàn quyền kiểm soát không gian cá nhân của mình, đồng thời cam kết tuân thủ các nghĩa vụ cộng đồng văn minh.",
            },
            {
              type: "table",
              head: ["Phương diện", "Quyền lợi thành viên", "Nghĩa vụ cam kết"],
              rows: [
                [
                  "Tài khoản & Bio",
                  "Sở hữu 01 đường dẫn duy nhất (hugowishpax.studio/bio/:slug), tự do trang trí hào quang Aura và nội dung.",
                  "Không giả mạo danh tính, không sử dụng từ ngữ xúc phạm hoặc hình ảnh vi phạm thuần phong mỹ tục.",
                ],
                [
                  "Điểm thưởng JOY",
                  "Tích lũy từ học tập, giải đố, rèn luyện thói quen và dùng để mở khóa tiện ích vĩnh viễn.",
                  "Không sử dụng bot, script tự động hoặc tạo nhiều tài khoản ảo để cày điểm thưởng.",
                ],
                [
                  "Bảo mật tài khoản",
                  "Được bảo vệ bằng chuẩn Passkey WebAuthn, mã hóa đầu cuối và kiểm toán truy cập.",
                  "Tự bảo quản mã PIN 6 số bí mật; không chia sẻ phiên đăng nhập cho người lạ.",
                ],
              ],
            },
          ],
        },
        {
          id: "dao-duc-va-hoa-binh",
          title: "3. Đạo đức cộng đồng, độ tuổi và tuyên bố hòa bình",
          blocks: [
            {
              type: "p",
              text: "Hệ sinh thái Hugo Studio kiên quyết duy trì một không gian học tập và làm việc an toàn, văn minh cho mọi thế hệ người dùng.",
            },
            {
              type: "note",
              tone: "danger",
              title: "Tuyên bố bảo vệ chủ quyền & Hòa bình quốc tế",
              text: "Nghiêm cấm tuyệt đối mọi hành vi lợi dụng nền tảng để phát tán thông tin xuyên tạc, kích động bạo lực hoặc xâm phạm chủ quyền lãnh thổ Việt Nam (bao gồm hai quần đảo Hoàng Sa và Trường Sa). Mọi vi phạm sẽ dẫn đến thu hồi tài khoản vĩnh viễn ngay lập tức.",
            },
            {
              type: "steps",
              items: [
                "Độ tuổi tham gia: Người dùng dưới 14 tuổi cần có sự đồng thuận của phụ huynh hoặc người giám hộ khi sử dụng các tính năng mạng xã hội.",
                "Chính sách bảo vệ học đường: Cam kết không quảng cáo cờ bạc, nội dung độc hại hay các chương trình tài chính không lành mạnh trong không gian sinh viên/học sinh.",
              ],
            },
          ],
        },
        {
          id: "giai-quyet-tranh-chap",
          title: "4. Cơ chế phản hồi, khiếu nại và giải quyết tranh chấp",
          blocks: [
            {
              type: "p",
              text: "Mọi thắc mắc, đề xuất hợp tác hoặc khiếu nại về tài khoản đều được tiếp nhận và xử lý qua các kênh chính thức của Hugo Studio trong vòng 24 - 48 giờ làm việc.",
            },
            {
              type: "steps",
              items: [
                "Kênh hỗ trợ chính: Gửi email trực tiếp đến contact@hugowishpax.studio hoặc sử dụng Trung tâm trợ giúp trong ứng dụng.",
                "Cơ chế giải quyết ôn hòa: Đôi bên ưu tiên đối thoại, kiểm tra nhật ký kỹ thuật (Audit Log) khách quan trước khi áp dụng bất kỳ chế tài nào.",
                "Quyền sao lưu dữ liệu: Trong trường hợp chấm dứt dịch vụ, thành viên luôn có quyền xuất dữ liệu cá nhân (Takeout) trong vòng 30 ngày.",
              ],
            },
          ],
        },
      ],
    },

    "database-policy": {
      id: "database-policy",
      title: "Quy ước cơ sở dữ liệu người dùng & Chính sách thành viên",
      subtitle: "Bản hợp nhất số 02: Kiến trúc bảo mật dữ liệu, sổ cái JOY bất biến và chính sách thành viên",
      updatedAt: "17/09/2026",
      intro: "Văn bản quy định chi tiết các nguyên tắc kiến trúc kỹ thuật về lưu trữ, bảo vệ cơ sở dữ liệu người dùng, cơ chế sổ cái điểm thưởng bất biến và chính sách quyền lợi phân hạng thành viên.",
      sections: [
        {
          id: "kien-truc-csdl-va-bao-mat",
          title: "1. Quy ước kiến trúc cơ sở dữ liệu & Bảo vệ dữ liệu cá nhân",
          blocks: [
            {
              type: "p",
              text: "Cơ sở dữ liệu người dùng tại Hugo Studio được xây dựng dựa trên nguyên tắc Zero-Trust, phân tầng bảo vệ nghiêm ngặt theo tiêu chuẩn GDPR và Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân.",
            },
            {
              type: "table",
              head: ["Thực thể dữ liệu", "Cơ chế bảo vệ kỹ thuật", "Cam kết toàn vẹn"],
              rows: [
                [
                  "Thông tin tài khoản (UserProfile)",
                  "Mã hóa TLS 1.3 trong truyền tải; phân tách trường nhạy cảm sang phân vùng bảo mật.",
                  "Không bao giờ chia sẻ hồ sơ thô cho các bên tiếp thị; chỉ phục vụ cá nhân hóa trải nghiệm.",
                ],
                [
                  "Khóa mật mã sinh trắc học (WebAuthnCredential)",
                  "Chỉ lưu trữ Public Key (chuẩn COSE) và bộ đếm chữ ký. Private Key nằm vĩnh viễn trong chip Secure Enclave / TPM của máy bạn.",
                  "Nếu máy chủ bị xâm nhập, kẻ tấn công cũng không thể trích xuất vân tay hay khóa riêng tư của người dùng.",
                ],
                [
                  "Dữ liệu thanh toán (PaymentLink)",
                  "Khởi tạo liên kết thanh toán VietQR động. Chỉ lưu trữ mã đơn hàng, số tiền đối soát và trạng thái Webhook HMAC.",
                  "Không bao giờ lưu số tài khoản ngân hàng, thông tin thẻ tín dụng hay mã CVV/OTP của khách hàng.",
                ],
                [
                  "Nhật ký kiểm toán (AdminAuditLog)",
                  "Chỉ cho phép ghi (Append-Only INSERT), cấm tuyệt đối mọi hành vi UPDATE hoặc DELETE.",
                  "Lưu vết minh bạch 100% các thao tác của Quản trị viên, chống lạm quyền và đảm bảo truy vết.",
                ],
              ],
            },
          ],
        },
        {
          id: "so-cai-joy-bat-bien",
          title: "2. Cơ chế Sổ cái điểm thưởng bất biến (Append-Only JOY Ledger)",
          blocks: [
            {
              type: "p",
              text: "Để loại trừ triệt để tình trạng tranh chấp dữ liệu (Race Condition) và đảm bảo tính chính xác tuyệt đối của tài sản số, hệ thống áp dụng nguyên tắc Sổ cái kế toán kép bất biến.",
            },
            {
              type: "steps",
              items: [
                "Tuyệt đối không UPDATE số dư trực tiếp trong bảng User. Số dư hiển thị được tổng hợp từ các dòng ghi sổ JoyLedger theo thời gian thực.",
                "Mọi giao dịch điểm thưởng đều sinh ra một dòng ghi vết bất biến, kèm nguồn phát sinh (check-in, bài học, pomodoro, chuyển điểm P2P) và dấu thời gian.",
                "Giao dịch chuyển điểm P2P quét mã hạt phân tử (Particle QR) thực thi qua MongoDB Transaction nguyên tử (Atomic 1:2), đảm bảo đồng thời trừ người gửi và cộng người nhận.",
                "Mã quét QR hạt phân tử tự hủy sau đúng 60 giây nhờ cơ chế MongoDB TTL Index, loại bỏ hoàn toàn rủi ro chụp lén hoặc gửi lặp.",
              ],
            },
            {
              type: "note",
              tone: "info",
              title: "Quy chế Tiện ích Mở trước JOYlater",
              text: "JOYlater cho phép thành viên mở trước tiện ích số khi chưa đủ điểm. Hạn mức mở trước căn cứ vào lịch sử nỗ lực học tập thực tế và được khấu trừ tự động dần khi nhận điểm mới, hoàn toàn không phát sinh lãi suất hay phí phạt tài chính thực tế.",
            },
          ],
        },
        {
          id: "chinh-sach-thanh-vien-va-hang-the",
          title: "3. Chính sách phân hạng thành viên & Đặc quyền VIP",
          blocks: [
            {
              type: "p",
              text: "Hệ thống ghi nhận và vinh danh sự đóng góp của thành viên thông qua bảng phân hạng minh bạch, dựa trên thành tích học tập và mức độ tương tác tích cực.",
            },
            {
              type: "table",
              head: ["Hạng thành viên", "Điều kiện đạt được", "Đặc quyền tiêu biểu"],
              rows: [
                [
                  "Standard Member",
                  "Mặc định khi đăng ký và xác thực tài khoản",
                  "Trang Bio @slug tiêu chuẩn, trải nghiệm toàn bộ tiện ích cơ bản, ví điểm thưởng JOY.",
                ],
                [
                  "Student Star",
                  "Xác minh thẻ học sinh / sinh viên thành công",
                  "Huy hiệu nơ sinh viên, giảm 30% phí mở khóa tài nguyên học tập, ưu đãi gói đồ án tốt nghiệp.",
                ],
                [
                  "VIP Premium",
                  "Đạt mốc điểm tích lũy hoặc cống hiến mã nguồn cộng đồng",
                  "Mở khóa toàn bộ kho theme hào quang độc bản, ưu tiên kết nối máy chủ tốc độ cao, hỗ trợ kỹ thuật 1-1.",
                ],
              ],
            },
          ],
        },
      ],
    },
  },

  en: {
    "terms-manifest": {
      id: "terms-manifest",
      title: "Service Terms & System Operational Manifest",
      subtitle: "Unified Edition 01: Governance framework, operational guarantees, and member responsibilities",
      updatedAt: "September 17, 2026",
      intro: "The official terms of service and system operating manifest of the Hugo Studio ecosystem. Establishes transparent user rights, zero hidden fees, and an ethical creative computing environment.",
      sections: [
        {
          id: "operational-manifest",
          title: "1. Operational Manifest & Zero Hidden Fee Guarantee",
          blocks: [
            {
              type: "p",
              text: "Hugo Studio is an integrated digital platform uniting personal portfolio publishing (Bio @slug), focused study utilities, and community interactions, engineered upon principles of absolute transparency.",
            },
            {
              type: "note",
              tone: "verified",
              title: "Hugo Studio Triple-Zero Guarantee",
              text: "1. Zero hidden fees or silent auto-billing. 2. Zero monetization or trading of user identity data to ad networks. 3. Zero storage of passwords, bank PINs, or SMS OTPs.",
            },
            {
              type: "steps",
              items: [
                "Core platform utilities remain fully accessible for free or unlockable via organic JOY points earned through study and daily discipline.",
                "Commercial engineering contracts and web development retain fixed itemized quotes, settled via State Bank of Vietnam Napas 24/7 VietQR rails with cryptographic invoices.",
                "Policy updates or fee schedule amendments are broadcast publicly at least 14 days in advance via official documentation.",
              ],
            },
          ],
        },
        {
          id: "rights-obligations",
          title: "2. Member Rights & Responsibilities",
          blocks: [
            {
              type: "p",
              text: "Every registered member retains autonomous ownership over their digital workspace while committing to civic community norms.",
            },
            {
              type: "table",
              head: ["Domain", "Member Rights", "Committed Obligations"],
              rows: [
                [
                  "Profile & Bio",
                  "Exclusive claim to one unique vanity URL (hugowishpax.studio/bio/:slug) with customizable Aura visual effects.",
                  "Prohibition of identity spoofing, defamation, or distribution of illicit graphic content.",
                ],
                [
                  "JOY Rewards",
                  "Accrued organically through lessons, pomodoro focus, and coding benchmarks to unlock tools permanently.",
                  "Zero tolerance for automated scripts, reverse engineering exploits, or multi-account point farming.",
                ],
                [
                  "Access Security",
                  "Guaranteed protection via W3C WebAuthn Passkeys and encrypted access audits.",
                  "Sole responsibility for safeguarding the personal 6-digit transaction PIN; never sharing sessions.",
                ],
              ],
            },
          ],
        },
        {
          id: "ethics-peace",
          title: "3. Community Ethics, Minor Protection & Peace Charter",
          blocks: [
            {
              type: "p",
              text: "Hugo Studio strictly enforces an educational, safe, and positive computing space for all age demographics.",
            },
            {
              type: "note",
              tone: "danger",
              title: "Sovereignty & International Peace Charter",
              text: "Any activity exploiting platform infrastructure to incite violence, disseminate propaganda, or undermine Vietnamese national sovereignty is strictly prohibited and subject to immediate permanent termination.",
            },
            {
              type: "steps",
              items: [
                "Age compliance: Users under 14 years of age require parental or guardian consent when interacting with social networking features.",
                "Student safety: All commercial gambling, predatory lending, and malicious schemes are strictly blocked across student workspaces.",
              ],
            },
          ],
        },
        {
          id: "dispute-resolution",
          title: "4. Feedback, Dispute Resolution & Data Takeout",
          blocks: [
            {
              type: "p",
              text: "All support inquiries, ethical reports, or account disputes are addressed by human engineers within 24 to 48 business hours.",
            },
            {
              type: "steps",
              items: [
                "Official contact channel: Direct communications sent to contact@hugowishpax.studio or through the In-App Help Desk.",
                "Collaborative resolution: Technical audit logs serve as objective truth before administrative remediations are enacted.",
                "Data Portability (Takeout): In the event of account closure, members retain the right to export all personal data files within 30 days.",
              ],
            },
          ],
        },
      ],
    },

    "database-policy": {
      id: "database-policy",
      title: "User Database Conventions & Membership Policy",
      subtitle: "Unified Edition 02: Zero-Trust architecture, append-only ledger, and tier benefits",
      updatedAt: "September 17, 2026",
      intro: "Technical specifications governing database schema integrity, cryptographic privacy protections, immutable rewards accounting, and membership tier benefits.",
      sections: [
        {
          id: "db-architecture-security",
          title: "1. Database Architecture & Privacy Protection Conventions",
          blocks: [
            {
              type: "p",
              text: "Hugo Studio user database conventions are architected under Zero-Trust protocols, harmonizing with GDPR standards and Vietnam Personal Data Protection Decree 13/2023/ND-CP.",
            },
            {
              type: "table",
              head: ["Database Entity", "Cryptographic Defense Mechanism", "Integrity Guarantee"],
              rows: [
                [
                  "UserProfile (Identity)",
                  "TLS 1.3 in-transit encryption; sensitive fields partitioned into secured schemas.",
                  "Raw personal telemetry is strictly never disclosed to third-party ad brokers.",
                ],
                [
                  "WebAuthnCredential (Passkey)",
                  "Stores only COSE Public Keys and monotonic signature counters. Private keys stay permanently inside your device's hardware chip.",
                  "Even under total database exfiltration, attackers cannot deduce user biometrics or private keys.",
                ],
                [
                  "PaymentLink (Invoices)",
                  "Dynamic VietQR generation with HMAC Webhook reconciliations.",
                  "Zero storage of debit cards, bank PINs, or OTPs. Settlements execute directly on banking rails.",
                ],
                [
                  "AdminAuditLog (Audit Trail)",
                  "Restricted to Append-Only INSERT operations. UPDATE and DELETE are hard-blocked at database engine layer.",
                  "Maintains 100% transparent history of administrative actions, preventing privilege abuse.",
                ],
              ],
            },
          ],
        },
        {
          id: "immutable-ledger",
          title: "2. Append-Only JOY Ledger & Concurrency Architecture",
          blocks: [
            {
              type: "p",
              text: "To eliminate race conditions and preserve financial-grade ledger accuracy, the system enforces a strict double-entry append-only accounting pipeline.",
            },
            {
              type: "steps",
              items: [
                "Balances are never modified via in-place UPDATE queries on User records; current balances are dynamically derived from immutable JoyLedger rows.",
                "Every credit and debit event creates a non-fungible audit row recording source, delta, and ISO timestamp.",
                "P2P transfers execute via MongoDB ACID Transactions, atomically debiting the sender and crediting the recipient simultaneously.",
                "Particle QR codes automatically purge from database memory after 60 seconds via MongoDB TTL Indexes, eliminating replay risks.",
              ],
            },
            {
              type: "note",
              tone: "info",
              title: "JOYlater Credit Conventions",
              text: "JOYlater allows active members to unlock digital learning resources prior to full point accumulation. Credit limits derive from documented learning effort and settle automatically against future earnings without monetary interest or penalties.",
            },
          ],
        },
        {
          id: "membership-tiers",
          title: "3. Membership Tiers & VIP Benefits",
          blocks: [
            {
              type: "p",
              text: "Member engagement and contributions are recognized through an objective tier ladder delivering tangible performance and custom design benefits.",
            },
            {
              type: "table",
              head: ["Membership Tier", "Qualification Criteria", "Core Privileges"],
              rows: [
                [
                  "Standard Member",
                  "Default upon account registration and verification",
                  "Standard @slug Bio page, full access to core study utilities, personal JOY wallet.",
                ],
                [
                  "Student Star",
                  "Verified student ID card or educational accreditation",
                  "Student profile badge, 30% discount on computational resources, graduation project sponsorship.",
                ],
                [
                  "VIP Premium",
                  "Accumulated platform contribution or open-source merit",
                  "Unrestricted access to all cinematic Aura themes, prioritized edge server routing, dedicated 1-on-1 support.",
                ],
              ],
            },
          ],
        },
      ],
    },
  },
};
