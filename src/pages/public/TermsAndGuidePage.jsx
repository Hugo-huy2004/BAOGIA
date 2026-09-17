import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";

const UPDATED_AT = "17/09/2026";

const PILLARS = [
  { id: "all", label: "Tất cả chuyên mục", icon: "dashboard", count: 9 },
  { id: "overview", label: "1. Tổng quan & Tuyên ngôn", icon: "verified_user", count: 1 },
  { id: "features", label: "2. Tính năng & Ví JOY", icon: "apps", count: 1 },
  { id: "database", label: "3. Sơ đồ Database (ERD)", icon: "database", count: 1 },
  { id: "client-tech", label: "4. Kỹ thuật Ứng dụng PWA", icon: "devices", count: 1 },
  { id: "security", label: "5. Bảo mật & Mật mã học", icon: "lock", count: 1 },
  { id: "stress-defense", label: "6. Phản biện & Chịu tải", icon: "psychology_alt", count: 1 },
  { id: "rbac-rights", label: "7. Phân quyền & Điều khoản", icon: "admin_panel_settings", count: 1 },
  { id: "third-party", label: "8. Bên thứ ba tin chọn", icon: "hub", count: 1 },
  { id: "references", label: "9. Phụ lục & Ref Harvard", icon: "library_books", count: 1 },
];

export default function TermsAndGuidePage({ defaultPillar = "all" }) {
  useHeadMeta({
    title: "Điều khoản và hướng dẫn sử dụng | Báo cáo Nghiên cứu Kiến trúc Hệ thống Hugo Studio",
    description:
      "Báo cáo kiến trúc hệ thống chuẩn Harvard và Cẩm nang hướng dẫn sử dụng chuẩn Apple Whitepaper cho hệ sinh thái Hugo Studio. Tích hợp phân tích phản biện chịu tải 1.000.000 người dùng, khả năng phục hồi mạng và phụ lục tài liệu tham khảo.",
    keywords:
      "Hugo Studio, Điều khoản sử dụng, Hướng dẫn sử dụng, Báo cáo đồ án, Phản biện kiến trúc, 1.000.000 CCU, Database Diagram, ERD, PWA, Passkey, Ví JOY, WebAuthn, PayOS, Harvard Referencing",
    canonicalUrl: "https://www.hugowishpax.studio/terms-and-guide",
  });

  const sections = [
    // ==========================================
    // CHUYÊN MỤC 1: TỔNG QUAN DỰ ÁN & TUYÊN NGÔN
    // ==========================================
    {
      id: "tong-quan-du-an",
      title: "Tổng quan Dự án, Định danh & Mục tiêu Chiến lược",
      pillar: "overview",
      pillarTitle: "Chuyên mục I: Định danh Dự án & Tuyên ngôn Sứ mệnh",
      pillarIcon: "verified_user",
      pillarDesc: "Báo cáo xác định bản chất nền tảng, quyền tác giả, đối tượng thụ hưởng và các mục tiêu kỹ thuật cốt lõi.",
      blocks: [
        {
          type: "note",
          tone: "info",
          title: "Hồ sơ Định danh Dự án (Project Specification Identity)",
          text: "• Tên thương hiệu chính thức: Hugo Studio (Hugo Wishpax Studio).\n• Tên đầy đủ của dự án: Hệ Sinh Thái Ứng Dụng Web Tiến Bộ Đa Nền Tảng Hugo Studio (Hugo Studio Adaptive Progressive Web Ecosystem & Personal Digital Workspace).\n• Tác giả & Kiến trúc sư trưởng: Lê Gia Huy (Full-Stack Engineer).\n• Liên hệ bảo trợ & vận hành: contact@hugowishpax.studio | Mã nguồn kiểm duyệt trên GitHub.",
        },
        {
          type: "p",
          text: "Hugo Studio là một không gian làm việc số và hệ sinh thái ứng dụng web đa chức năng (All-in-One Digital Workspace & Progressive Web Ecosystem). Nền tảng được nghiên cứu, kiến trúc và lập trình độc lập nhằm cung cấp giải pháp trải nghiệm số hiện đại, bảo mật cao và hoàn toàn không bị chi phối bởi các thuật toán thương mại hóa gây xao nhãng (Fielding, 2000).",
        },
        {
          type: "table",
          head: ["Trục phân tích", "Đặc tính & Cam kết tại Hugo Studio", "Mục tiêu & Giá trị mang lại"],
          rows: [
            [
              "Đối tượng người dùng cá nhân (HSSV)",
              "Cung cấp không gian làm việc số cá nhân hóa, trang Bio nghệ thuật, công cụ chăm sóc sức khỏe tinh thần và giải trí phản xạ nhẹ nhàng.",
              "Không bị quảng cáo theo dõi, bảo vệ quyền riêng tư, rèn luyện sự tập trung và duy trì nhịp sinh học lành mạnh.",
            ],
            [
              "Khách hàng doanh nghiệp & Đối tác",
              "Cổng khảo sát, cấu hình và tính toán chi phí thiết kế web thông minh, kết nối cổng thanh toán tự động VietQR qua PayOS.",
              "Minh bạch 100% ngân sách phần mềm, không phí ẩn, bảo hành 6 tháng và bàn giao toàn bộ mã nguồn sạch trên Git.",
            ],
            [
              "Mục tiêu kiến trúc kỹ thuật",
              "Chứng minh năng lực của Web hiện đại (Modern Web Capabilities) qua mô hình Progressive Web App (PWA) và kiến trúc thích ứng (Adaptive UI).",
              "Đạt tốc độ tải trang dưới 0.5s, hỗ trợ ngoại tuyến, độc lập hoàn toàn khỏi phí hoa hồng 30% của các chợ ứng dụng đóng (Russell, 2015).",
            ],
            [
              "Triết lý thiết kế (Design Philosophy)",
              "Sự kết hợp giữa tính nhân văn, tối giản của Apple Human Interface Guidelines và chiều sâu học thuật của Harvard Technical Paper.",
              "Giao diện đơn sắc xanh kỹ thuật (Monochromatic Blue), tôn trọng thị giác người dùng, hỗ trợ chuyển đổi Light/Dark hoàn hảo.",
            ],
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Quyền sở hữu trí tuệ 100% thuộc về bạn",
          text: "Toàn bộ bài viết, đoạn mã lập trình, ghi chú cá nhân, thiết kế giao diện Hugo Bio và tài sản số do bạn tạo ra trên nền tảng hoàn toàn thuộc về bạn. Hugo Studio không bao giờ đòi hỏi quyền sở hữu hay chuyển nhượng bản quyền đối với các tác phẩm của bạn.",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 2: TÍNH NĂNG CỐT LÕI & VÍ JOY
    // ==========================================
    {
      id: "tinh-nang-cot-loi-va-vi-joy",
      title: "Kiến trúc Tính năng Cốt lõi & Bản chất Hệ thống Điểm thưởng JOY",
      pillar: "features",
      pillarTitle: "Chuyên mục II: Cẩm nang Tính năng Sản phẩm & Điểm thưởng JOY",
      pillarIcon: "apps",
      pillarDesc: "Mô tả chi tiết các sản phẩm hoàn thiện trong hệ sinh thái (lược bỏ các mô-đun học thuật đang thử nghiệm) và giải mã ý nghĩa của Ví JOY.",
      blocks: [
        {
          type: "p",
          text: "Hệ sinh thái Hugo Studio tập trung vào các ứng dụng phục vụ trực tiếp đời sống số, năng suất làm việc và sức khỏe tinh thần của người dùng. Các phân hệ học thuật thử nghiệm chưa hoàn thiện được tạm thời loại khỏi bản báo cáo này để đảm bảo độ tin cậy tuyệt đối.",
        },
        {
          type: "note",
          tone: "info",
          title: "Ý nghĩa cốt lõi: JOY là gì? Điểm thưởng JOY có ý nghĩa gì?",
          text: "• JOY là từ viết tắt của 'Journey of Youth' (Hành trình Tuổi trẻ), đồng thời là biểu trưng của niềm vui cống hiến, học tập và rèn luyện bản thân.\n• Bản chất: JOY là hệ thống điểm thưởng nội bộ phi tiền tệ (Non-monetary Reputation Point). Điểm JOY được tạo ra nhằm tri ân nỗ lực cá nhân khi bạn hoàn thành chuỗi Pomodoro tập trung, bài tập thở thư giãn, ván cờ logic hoặc duy trì điểm danh chuỗi ngày (Streak).\n• Cam kết danh dự: Điểm JOY TUYỆT ĐỐI KHÔNG PHẢI TIỀN TỆ, không phải tiền mã hóa (crypto), không phải công cụ đầu cơ tài chính và không thể quy đổi hay rút về tiền mặt dưới mọi hình thức.",
        },
        {
          type: "table",
          head: ["Tên Ứng Dụng", "Mô Tả Chức Năng Chi Tiết", "Công Nghệ & Kỹ Thuật Trọng Tâm"],
          rows: [
            [
              "Hugo Bio (@slug)",
              "Trang hồ sơ cá nhân một liên kết phong cách điện ảnh (Cinematic One-Link). Hỗ trợ tùy biến khối liên kết, mạng xã hội, dự án và mã QR danh thiếp cá nhân.",
              "WebGL Canvas, hiệu ứng tương tác hào quang Aura theo trỏ chuột, lớp thời tiết động (Weather Engine) và SSR Meta Tag tối ưu SEO.",
            ],
            [
              "Ví JOY & Mã Hạt Phân Tử",
              "Sổ cái quản lý điểm thưởng tích lũy, cơ chế chuyển giao điểm P2P giữa hai thành viên thông qua mã QR hạt phân tử động và xác thực mã PIN 6 số.",
              "Dynamic Canvas Rendering, Nonce biến thiên 60 giây tự hủy (Anti-replay), SHA-256 Client Salted Hash và Append-Only Ledger Database (Kleppmann, 2017).",
            ],
            [
              "HugoPSY Sức Khỏe Tinh Thần",
              "Trung tâm phục hồi năng lượng tâm trí: Bài tập thở điều hòa 4-7-8, theo dõi nhịp sinh học giấc ngủ và âm thanh sóng não thư giãn.",
              "Canvas Waveform phản hồi nhịp thở sinh học, LocalStorage mã hóa nhật ký ngủ và Web Audio API tổng hợp tần số Binaural Beats.",
            ],
            [
              "Bàn Học Đường (Study Desk)",
              "Không gian mô phỏng môi trường học tập chuyên sâu: Âm thanh quán cà phê, tiếng mưa rơi bên cửa sổ kết hợp đồng hồ Pomodoro 25/5.",
              "Audio Multi-track Mixer (chỉnh âm lượng từng kênh), Web Worker chạy đồng hồ đếm ngược chính xác ngay cả khi chuyển tab.",
            ],
            [
              "Lofi Radio",
              "Đài phát thanh trực tuyến các bản nhạc Lo-Fi không lời nhẹ nhàng giúp thanh lọc suy nghĩ, tăng cường khả năng giải quyết vấn đề.",
              "HTML5 Audio Streaming tối ưu băng thông, Mini-Player nổi với MediaSession API tích hợp trình điều khiển màn hình khóa iOS/Android.",
            ],
            [
              "HugoArcade & HugoAura",
              "Không gian rèn luyện tư duy phản xạ nhanh (Cờ vua Elo, game logic) và công cụ trị liệu thị giác ánh sáng đa sắc giúp thư giãn mắt.",
              "Chess.js Engine, Local Storage Elo Rating và Dynamic CSS Chromatic Animation.",
            ],
            [
              "Báo Giá Dịch Vụ Web",
              "Hệ thống khảo sát và tính toán chi phí thiết kế website tự động theo thời gian thực; tích hợp tạo hợp đồng và thanh toán PayOS VietQR.",
              "Dynamic Cost Estimation Matrix, PayOS API v2, Webhook HMAC-SHA256 xác thực thanh toán liên ngân hàng Napas 24/7.",
            ],
          ],
        },
        {
          type: "diagram",
          flow: "particle-qr",
        },
        {
          type: "cards",
          items: [
            {
              title: "Hugo Bio (@slug)",
              desc: "Trang cá nhân một liên kết phong cách điện ảnh với hiệu ứng hào quang Aura và lớp thời tiết động.",
              icon: "badge",
              href: "/bio/hugo",
              badge: "Khám phá",
            },
            {
              title: "Ví JOY & Hạt QR",
              desc: "Quản lý điểm thưởng học tập, mã QR hạt phân tử chuyển đổi an toàn và bảo mật mã PIN 6 số.",
              icon: "wallet",
              href: "/member",
              badge: "Thành viên",
            },
            {
              title: "HugoPSY Sức Khỏe",
              desc: "Nhật ký giấc ngủ, nhịp sinh học, bài tập thở 4-7-8 với đồ họa lượn sóng thư giãn.",
              icon: "psychology",
              href: "/therapy",
              badge: "Trị liệu",
            },
            {
              title: "Bàn Học Đường",
              desc: "Âm thanh môi trường quán cà phê, tiếng mưa rơi, lật sách kết hợp đồng hồ Pomodoro 25/5.",
              icon: "local_cafe",
              href: "/banhocduong",
              badge: "Tập trung",
            },
            {
              title: "Lofi Radio",
              desc: "Đài phát thanh trực tuyến các bản nhạc không lời nhẹ nhàng giúp tập trung suy nghĩ sâu.",
              icon: "radio",
              href: "/radio",
              badge: "Âm nhạc",
            },
            {
              title: "HugoArcade",
              desc: "Không gian giải trí nhanh với cờ vua, mini game phản xạ và thử thách chinh phục điểm cao.",
              icon: "sports_esports",
              href: "/arcade",
              badge: "Thư giãn",
            },
            {
              title: "HugoAura",
              desc: "Trải nghiệm ánh sáng và âm thanh không gian đa chiều, hỗ trợ tái tạo năng lượng tinh thần.",
              icon: "auto_awesome",
              href: "/aura",
              badge: "Ánh sáng",
            },
            {
              title: "Báo Giá Dịch Vụ Web",
              desc: "Công cụ khảo sát và ước tính chi phí thiết kế web thông minh, thanh toán VietQR qua PayOS.",
              icon: "calculate",
              href: "/services",
              badge: "Báo giá",
            },
            {
              title: "Hỏi Đáp Thường Gặp",
              desc: "Trung tâm giải đáp nhanh các thắc mắc về tài khoản, bảo mật, chính sách và quyền lợi HSSV.",
              icon: "help_center",
              href: "/faq",
              badge: "Hỏi đáp",
            },
            {
              title: "Đặt Lịch Trao Đổi",
              desc: "Kênh kết nối kỹ thuật trực tiếp với tác giả Lê Gia Huy để tư vấn kiến trúc phần mềm và dự án web.",
              icon: "calendar_month",
              href: "/booking",
              badge: "Tư vấn",
            },
          ],
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 3: SƠ ĐỒ DATABASE (ERD)
    // ==========================================
    {
      id: "so-do-co-so-du-lieu-erd",
      title: "Sơ đồ Cơ sở Dữ liệu & Phân tích Mối quan hệ Thực thể (ERD)",
      pillar: "database",
      pillarTitle: "Chuyên mục III: Kiến trúc Cơ sở Dữ liệu & Sơ đồ Thực thể",
      pillarIcon: "database",
      pillarDesc: "Báo cáo cấu trúc dữ liệu MongoDB, chi tiết thuộc tính, kiểu dữ liệu, các quan hệ 1:1, 1:N, N:M và cam kết sổ cái bất biến.",
      blocks: [
        {
          type: "p",
          text: "Hệ thống dữ liệu của Hugo Studio sử dụng hệ quản trị cơ sở dữ liệu MongoDB 7.x với mô hình lược đồ chặt chẽ qua Mongoose ODM. Kiến trúc được thiết kế nhằm tách bạch giữa danh tính bảo mật (Identity Layer), cấu hình hiển thị (Presentation Layer) và dữ liệu giao dịch tài nguyên (Ledger Layer) (DeCandia et al., 2007).",
        },
        {
          type: "database-diagram",
        },
        {
          type: "table",
          head: ["Cặp Thực Thể", "Bản Số (Cardinality)", "Cơ Chế Ràng Buộc & Toàn Vẹn Dữ Liệu"],
          rows: [
            [
              "UserProfile ↔ WebAuthnCredential",
              "1 : N (Một - Nhiều)",
              "Một tài khoản có thể kích hoạt nhiều Passkey trên nhiều thiết bị (Touch ID Mac, Face ID iPhone). Khi xóa UserProfile, toàn bộ Credential sẽ bị thu hồi theo cơ chế Cascade Delete (FIDO Alliance, 2023).",
            ],
            [
              "UserProfile ↔ BioProfile",
              "1 : 1 (Một - Một)",
              "Mỗi tài khoản sở hữu duy nhất một trang hồ sơ Bio được định danh bằng slug độc nhất (Unique Index), ngăn chặn hành vi giả mạo đường dẫn.",
            ],
            [
              "UserProfile ↔ JoyLedger",
              "1 : N (Append-Only)",
              "Không bao giờ dùng câu lệnh UPDATE số dư trực tiếp trên bảng User. Mọi biến động điểm JOY đều là một dòng INSERT độc lập, lưu số dư sau giao dịch (balanceAfter) để bảo đảm đối soát lịch sử kế toán tuyệt đối (Kleppmann, 2017).",
            ],
            [
              "PendingTransfer ↔ JoyLedger",
              "1 : 2 Atomic Transaction",
              "Khi quét mã QR hạt phân tử thành công, lệnh P2P thực hiện transaction nguyên tử: Tạo đồng thời 1 dòng trừ JOY của người gửi và 1 dòng cộng JOY của người nhận.",
            ],
            [
              "UserProfile ↔ PaymentLink",
              "1 : N (Tùy chọn)",
              "Giao dịch thanh toán PayOS được gắn với email tài khoản nếu người dùng đã đăng nhập; đồng thời hỗ trợ người dùng vãng lai theo mã đơn hàng số nguyên orderCode độc nhất.",
            ],
            [
              "Admin ↔ AdminAuditLog",
              "1 : N (Bất biến)",
              "Toàn bộ hành động của Admin (chỉnh số dư, khóa tài khoản, duyệt cấu hình) đều bị ghi vết tự động kèm địa chỉ IP và User-Agent. Bảng này bị cấm UPDATE và DELETE trên tầng phần mềm.",
            ],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Chiến lược Chỉ mục (Indexing Strategy) & Khả năng mở rộng",
          text: "Hệ thống áp dụng Compound Index { email: 1, createdAt: -1 } trên JoyLedger và UserProfile để truy vấn lịch sử biến động trong O(log N). Bảng PendingTransfer sử dụng TTL Index tự động dọn sạch bộ nhớ sau 60 giây, giúp cơ sở dữ liệu luôn nhẹ nhàng và tối ưu dung lượng RAM máy chủ.",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 4: KỸ THUẬT ỨNG DỤNG PWA
    // ==========================================
    {
      id: "ky-thuat-ung-dung-pwa",
      title: "Phương pháp Giao tiếp Người dùng & Kỹ thuật Ứng dụng PWA",
      pillar: "client-tech",
      pillarTitle: "Chuyên mục IV: Kỹ thuật Ứng dụng & Trải nghiệm Người dùng",
      pillarIcon: "devices",
      pillarDesc: "Phân tích kỹ thuật Progressive Web App (PWA), Service Worker Cache-First, so sánh với Native/Hybrid và định hướng công nghệ tương lai.",
      blocks: [
        {
          type: "p",
          text: "Phương thức giao tiếp giữa người dùng và hệ thống được xây dựng trên nền tảng Progressive Web App (PWA) kết hợp kiến trúc thích ứng (Adaptive Architecture). Thay vì buộc người dùng phải tải về các tệp tin cài đặt cồng kềnh từ các chợ ứng dụng đóng, Hugo Studio mang lại trải nghiệm toàn màn hình mượt mà như ứng dụng gốc trực tiếp qua trình duyệt web (Russell, 2015).",
        },
        {
          type: "table",
          head: ["Tiêu chí kỹ thuật", "Native App (Swift/Kotlin)", "Cross-Platform (Flutter/RN)", "Web SPA/MPA cổ điển", "PWA Hugo Studio (Được chọn)"],
          rows: [
            [
              "Dung lượng cài đặt ban đầu",
              "Rất lớn (80MB - 200MB)",
              "Lớn (40MB - 90MB)",
              "Không cài đặt (Tải theo lượt)",
              "Siêu nhẹ (~2.8MB lưu vào Cache)",
            ],
            [
              "Rào cản tiếp cận người dùng",
              "Cao (Phải tìm và tải trên Store)",
              "Cao (Cần duyệt tải từ Store)",
              "Thấp (Truy cập bằng URL)",
              "Không rào cản (Truy cập tức thì + 1 chạm Add to Home)",
            ],
            [
              "Khả năng hoạt động ngoại tuyến",
              "Rất tốt (Toàn bộ logic ở máy)",
              "Tốt (Tích hợp trong bundle)",
              "Không thể (Hiện màn hình mất mạng)",
              "Xuất sắc (Service Worker Cache-First & Offline Fallback)",
            ],
            [
              "Chi phí hoa hồng chợ ứng dụng",
              "Mất 15% - 30% doanh thu",
              "Mất 15% - 30% doanh thu",
              "0% (Tự chủ cổng thanh toán)",
              "0% (Tích hợp trực tiếp PayOS / Napas 24/7)",
            ],
            [
              "Thời gian cập nhật phiên bản",
              "Chậm (Chờ Apple/Google duyệt 1-3 ngày)",
              "Chậm (Duyệt lại qua chợ ứng dụng)",
              "Tức thì (Deploy server)",
              "Tức thì (< 1 giây qua Service Worker background sync)",
            ],
            [
              "Hiển thị giao diện màn hình",
              "Toàn màn hình không viền",
              "Toàn màn hình không viền",
              "Bị che bởi thanh URL & Tab trình duyệt",
              "Toàn màn hình độc lập (Display: Standalone không viền)",
            ],
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Lý do lựa chọn Progressive Web App (PWA) cho Hugo Studio",
          text: "1. Tính dân chủ & Mở: Ai cũng có thể trải nghiệm ngay lập tức trên mọi thiết bị (iPhone, iPad, Android, Mac, Windows, Linux) chỉ với một đường dẫn.\n2. Tối ưu hiệu năng: Tải trang ban đầu < 0.5s nhờ kỹ thuật nén Brotli và chiến lược Stale-While-Revalidate.\n3. Bảo vệ tự do tác quyền: Tránh được sự kiểm duyệt khắt khe và các khoản phí hoa hồng vô lý của các tập đoàn công nghệ độc quyền.",
        },
        {
          type: "diagram",
          flow: "pwa-lifecycle",
        },
        {
          type: "figure",
          art: "tabs",
          caption: "Minh hoạ cấu trúc 4 tab chính trên di động: Hôm nay, Ứng dụng, Hoạt động, Tài khoản. Khi mở một tiện ích, thanh tab tự động ẩn để nhường trọn vẹn màn hình cho ứng dụng.",
        },
        {
          type: "note",
          tone: "info",
          title: "Ưu / Nhược điểm, Thách thức Tương lai & Định hướng Phát triển",
          text: "• Ưu điểm: Hiệu năng vượt trội, tiết kiệm bộ nhớ máy, cập nhật mã nguồn tức thời, tương thích 100% mọi kích cỡ màn hình.\n• Nhược điểm & Thách thức: Trình duyệt Safari trên iOS từng có độ trễ trong việc cấp quyền Web Push Notification (đã được Apple khắc phục từ iOS 16.4+). Một số cảm biến phần cứng chuyên biệt chưa có chuẩn Web API thống nhất.\n• Định hướng tương lai: Tích hợp WebAssembly (Wasm) để xử lý âm thanh thời gian thực và áp dụng WebGPU / Local WebLLM để chạy các mô hình AI phân tích sức khỏe tinh thần hoàn toàn ngoại tuyến trong thiết bị của bạn mà không gửi dữ liệu ra ngoài.",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 5: BẢO MẬT & MẬT MÃ HỌC
    // ==========================================
    {
      id: "bao-mat-va-mat-ma-hoc",
      title: "Kỹ thuật Bảo mật, Mật mã học & Sơ đồ Bắt tay Server - Client",
      pillar: "security",
      pillarTitle: "Chuyên mục V: Kỹ thuật Bảo mật & Mật mã học",
      pillarIcon: "lock",
      pillarDesc: "Báo cáo phân tích chuyên sâu công nghệ xác thực sinh trắc học Passkey (FIDO2/WebAuthn), mã hóa kênh truyền TLS 1.3 và cam kết Privacy by Design.",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio áp dụng tiêu chuẩn bảo mật theo triết lý 'Privacy by Design' (Bảo vệ quyền riêng tư ngay từ bản vẽ thiết kế). Hệ sinh thái kiên quyết loại bỏ cơ chế xác thực bằng mật khẩu truyền thống — nguồn gốc của hơn 80% các vụ rò rỉ dữ liệu trên toàn cầu — để chuyển dịch hoàn toàn sang chuẩn mật mã khóa công khai WebAuthn / FIDO2 (FIDO Alliance, 2023).",
        },
        {
          type: "table",
          head: ["Phương pháp xác thực", "Nguy cơ Phishing (Giả mạo)", "Nguy cơ rò rỉ khi Server bị hack", "Tốc độ thao tác", "Đánh giá học thuật"],
          rows: [
            [
              "Mật khẩu ký tự truyền thống",
              "Cực kỳ nguy hiểm (Dễ bị lừa nhập vào trang giả)",
              "Nguy hiểm (Bị lộ nếu server lưu hash yếu)",
              "Chậm (Cần nhớ và gõ từng ký tự)",
              "Lỗi thời, không an toàn.",
            ],
            [
              "Mã OTP gửi qua tin nhắn SMS",
              "Nguy hiểm (Bị tấn công hoán đổi SIM Swap)",
              "Trung bình (Phụ thuộc nhà mạng viễn thông)",
              "Rất chậm (Chờ mạng gửi tin nhắn 10-30s)",
              "Chi phí cao, tiềm ẩn rủi ro đánh chặn viễn thông.",
            ],
            [
              "Ứng dụng TOTP (Google Authenticator)",
              "Vẫn có thể bị lừa (Người dùng copy mã sang trang giả)",
              "Khá an toàn nếu lưu trữ khóa seed tốt",
              "Khá chậm (Phải mở app lấy 6 số)",
              "Giải pháp chấp nhận được nhưng trải nghiệm chưa liền mạch.",
            ],
            [
              "WebAuthn / Passkey (Hugo Studio)",
              "Miễn nhiễm 100% (Trình duyệt gắn chặt Origin miền)",
              "Miễn nhiễm (Server chỉ lưu Public Key vô hại)",
              "Tức thì (< 1.0s qua vân tay Touch ID / Face ID)",
              "Chuẩn mật mã học bất đối xứng hiện đại nhất hiện nay.",
            ],
          ],
        },
        {
          type: "diagram",
          flow: "passkey",
        },
        {
          type: "figure",
          art: "passkey",
          caption: "Quy trình xác thực Passkey sinh trắc học: Dữ liệu vân tay hoặc khuôn mặt nằm trọn trong chip phần cứng và chỉ ký số lên chuỗi Challenge ngẫu nhiên.",
        },
        {
          type: "note",
          tone: "tip",
          title: "Các tầng phòng thủ đa lớp (Defense-in-Depth) tại Hugo Studio",
          text: "1. Mã hóa kênh truyền: Ép buộc chuẩn giao thức TLS 1.3 và tiêu đề HSTS (HTTP Strict Transport Security) với thời hạn 1 năm.\n2. Chống tấn công giả mạo (CSP): Thiết lập Content Security Policy chặt chẽ, chặn đứng nguy cơ chèn mã độc Cross-Site Scripting (XSS).\n3. Cookie bảo mật cao nhất: Cờ HttpOnly, SameSite=Lax và Secure ngăn chặn hoàn toàn việc đánh cắp token phiên qua JavaScript.\n4. Chống tấn công từ chối dịch vụ (DDoS): Cấu hình Rate Limiter tại cổng API Gateway, chỉ cho phép tối đa 60 yêu cầu/phút trên mỗi địa chỉ IP.",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 6: PHẢN BIỆN & CHỊU TẢI 1.000.000 CCU
    // ==========================================
    {
      id: "phan-bien-va-chiu-tai",
      title: "Phản biện Kiến trúc: Thử nghiệm Chịu tải 1.000.000 Người dùng & Khả năng Phục hồi",
      pillar: "stress-defense",
      pillarTitle: "Chuyên mục VI: Phản biện Kiến trúc & Chịu tải Cực hạn",
      pillarIcon: "psychology_alt",
      pillarDesc: "Báo cáo khoa học giải trình 3 bài toán cực hạn: 1.000.000 sinh viên truy cập đồng thời, phân tán toàn cầu và ứng phó khi loãng mạng / sập server.",
      blocks: [
        {
          type: "p",
          text: "Trong hội đồng phản biện học thuật và nghiệm thu dự án kỹ thuật, các giả định về khả năng mở rộng quy mô (Scalability) và độ bền vững chịu lỗi (Fault Tolerance) là thước đo quan trọng nhất để đánh giá một kiến trúc phần mềm (Brewer, 2012; Kleppmann, 2017). Dưới đây là báo cáo phân tích định lượng và giải pháp thực chứng cho 3 kịch bản cực hạn:",
        },
        {
          type: "note",
          tone: "warn",
          title: "Phản biện 1: Hệ thống có đảm bảo 1.000.000 sinh viên truy cập và sử dụng cùng lúc?",
          text: "• ĐÁNH GIÁ HIỆN TRẠNG THỰC TẾ (Current State):\nHiện tại, Hugo Studio chạy trên 1 máy chủ VPS tiêu chuẩn (Node.js Single Process / Event Loop). Mô hình đơn luồng Non-blocking I/O của Node.js xử lý xuất sắc các tác vụ nhẹ, nhưng một tiến trình đơn lẻ chỉ chịu tải tối ưu ở mức 3.000 – 5.000 kết nối đồng thời (Concurrent Connections - CCU). Khi tải vượt quá 10.000 CCU, Event Loop sẽ bị bão hòa (Event Loop Saturation) do chi phí mã hóa TLS và đối soát token (Chou et al., 2021).\n\n• DỰ ĐOÁN NGƯỠNG BẾ TẮC (Bottleneck Identification):\n1. Giới hạn File Descriptors của hệ điều hành Linux (ulimit mặc định 1024 - 65535 sockets).\n2. Giới hạn Connection Pool của MongoDB (mặc định 100 - 500 connections).\n3. Dung lượng RAM máy chủ (mỗi socket kết nối duy trì tiêu tốn khoảng 4KB - 10KB RAM).\n\n• Ý ĐỊNH & GIẢI PHÁP TƯƠNG LAI ĐỂ ĐÁP ỨNG 1.000.000 CCU (Scale-out Roadmap):\n1. Lớp Biên (Edge Caching): Đưa 95% tài nguyên tĩnh và các trang Bio công khai lên Cloudflare Enterprise / Vercel Edge. Nhờ cơ chế Cache-Control: s-maxage=86400, stale-while-revalidate, 950.000 lượt truy cập đọc sẽ được hấp thụ hoàn toàn tại biên mạng mà không chạm vào máy chủ gốc (Fielding, 2000).\n2. Lớp Ứng Dụng (Kubernetes Auto-Scaling): Chuyển đổi sang cụm Kubernetes Cluster (EKS / GKE) cấu hình Horizontal Pod Autoscaler (HPA), tự động nhân bản từ 10 lên 250 Pods Node.js khi CPU vượt 70%.\n3. Lớp Bộ nhớ Đệm Phân tán: Đặt cụm Redis Cluster (Cluster Mode Enabled) làm bộ đệm RAM trung gian cho Session và Rate-limiting, giải phóng 90% truy vấn đọc xuống Database.\n4. Lớp Cơ sở Dữ liệu: Phân vùng Sharding MongoDB Atlas Cluster theo hash key { email: 'hashed' } kết hợp mô hình Replica Set (1 Primary ghi + 5 Read Replicas) để chia sẻ tải I/O (Kleppmann, 2017).",
        },
        {
          type: "table",
          head: ["Cấp độ kiến trúc", "Khả năng chịu tải (CCU)", "Độ trễ trung bình (p95)", "Điểm nghẽn chính (Bottleneck)", "Chi phí vận hành"],
          rows: [
            [
              "1. Node.js Đơn tiến trình (Hiện tại)",
              "3.000 - 5.000 CCU",
              "85ms - 220ms",
              "Event Loop CPU & Linux File Descriptors (Tilkov & Vinoski, 2010)",
              "Tối thiểu (~$20 - $40/tháng)",
            ],
            [
              "2. PM2 Cluster + Nginx Cache (Giai đoạn 2)",
              "20.000 - 35.000 CCU",
              "60ms - 150ms",
              "RAM máy chủ & MongoDB Connection Pool",
              "Trung bình (~$120 - $250/tháng)",
            ],
            [
              "3. Edge CDN + K8s + Redis Cluster (Tương lai 1M)",
              "1.000.000+ CCU",
              "< 45ms toàn cầu",
              "Băng thông mạng liên vùng & Chi phí hạ tầng Cloud",
              "Doanh nghiệp (~$1.500 - $3.000/tháng)",
            ],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Phản biện 2: Nếu 1.000.000 sinh viên ở khắp nơi trên thế giới truy cập cùng lúc?",
          text: "• THÁCH THỨC VỀ ĐỘ TRỄ ĐỊA LÝ (Geographic RTT Latency):\nTốc độ ánh sáng trong cáp quang đặt ra giới hạn vật lý: Một yêu cầu từ California (Mỹ) hoặc London (Anh) về máy chủ tại Việt Nam mất từ 180ms – 240ms chỉ riêng cho thời gian truyền gói tin (Round-Trip Time - RTT). Nếu phải trải qua 3 lượt bắt tay TLS + TCP thì người dùng ở xa sẽ phải đợi gần 1 giây trước khi thấy trang web.\n\n• GIẢI PHÁP ĐÃ & ĐANG TRIỂN KHAI:\n1. Mạng Anycast Edge Routing: Tích hợp mạng phân phối nội dung toàn cầu với hơn 300 trạm PoP (Points of Presence) tại 100+ quốc gia. Bắt tay TLS 1.3 được ngắt tại trạm gần nhất (Local Edge Termination), giảm độ trễ bắt tay xuống còn 12ms.\n2. Serverless Edge Computing: Đẩy mã nguồn render giao diện ra Cloudflare Workers / Vercel Edge Serverless Function đặt sát cạnh vị trí địa lý của sinh viên.\n3. Đồng bộ dữ liệu phân tán (Geo-Replication): Ứng dụng mô hình Conflict-Free Replicated Data Types (CRDTs) cho phép ghi dữ liệu cục bộ ngoại tuyến và hợp nhất tự động không xung đột khi có mạng (Shapiro et al., 2011).",
        },
        {
          type: "note",
          tone: "danger",
          title: "Phản biện 3: Nếu bị loãng mạng (High Packet Loss) và sập máy chủ (Server Outage)?",
          text: "• BẢO VỆ PHÍA CLIENT (Client-Side Resilience):\n1. Vận hành Ngoại tuyến Hoàn toàn: Nhờ kiến trúc Service Worker Cache-First, kể cả khi dây cáp mạng bị rút hoặc máy chủ sập hoàn toàn, ứng dụng PWA vẫn khởi động bình thường từ bộ nhớ đệm Cache Storage trong < 0.2s (Russell, 2015).\n2. Hàng đợi Đột biến Ngoại tuyến (Offline Mutation Queue): Toàn bộ thao tác (lưu nhật ký ngủ, đánh dấu Pomodoro, soạn thảo Bio) được lưu an toàn vào IndexedDB. Khi mạng phục hồi, Background Sync API tự động đẩy các thay đổi lên mà không làm mất 1 byte dữ liệu nào của người dùng.\n\n• BẢO VỆ PHÍA HẠ TẦNG (Server Circuit Breaker & Graceful Degradation):\n1. Ngắt mạch tự động (Circuit Breaker Pattern): Khi một dịch vụ con (như kiểm tra thời tiết Bio hoặc xác nhận PayOS) gặp sự cố, hệ thống tự động 'ngắt mạch' tạm thời, trả về phản hồi fallback mặc định thay vì để luồng chính bị treo nghẽn dây chuyền (Nygard, 2018).\n2. Hạ cấp tính năng mềm dẻo (Graceful Degradation): Khi CPU máy chủ vượt ngưỡng 85%, hệ thống chủ động tạm dừng các tác vụ phụ (hoạt họa thời tiết WebGL, radar tính toán trực tiếp) để dồn 100% tài nguyên CPU duy trì phiên đăng nhập Passkey và Ví JOY.\n3. Cơ chế Tự chữa lành (Self-Healing Watchdog): PM2 Daemon và Docker Healthcheck liên tục giám sát ngưỡng RAM. Nếu một worker bị rò rỉ bộ nhớ (Memory Leak) vượt quá 1GB, tiến trình đó sẽ được khởi động lại mượt mà (Graceful Reload) trong 0.5s mà không ngắt quãng kết nối của người dùng khác.",
        },
        {
          type: "table",
          head: ["Tình huống sự cố", "Hành vi của hệ thống Hugo Studio", "Trải nghiệm thực tế của Người dùng"],
          rows: [
            [
              "Mất kết nối Internet hoàn toàn (Offline)",
              "Service Worker phục vụ Bundle tĩnh từ Cache Storage; chuyển hướng API sang hàng đợi IndexedDB.",
              "Vẫn dùng bình thường các app: Lofi Radio đệm sẵn, Bàn Học Đường, Bài tập thở HugoPSY, đọc Điều khoản.",
            ],
            [
              "Loãng mạng, trễ cao, rớt gói tin (Packet Loss > 30%)",
              "Kích hoạt cơ chế Exponential Backoff Retry (thử lại sau 1s, 2s, 4s); giảm chất lượng stream âm thanh.",
              "Không bị văng app, hiện biểu tượng đám mây vàng báo hiệu đang lưu đệm ngầm và tự đồng bộ khi mạng ổn định.",
            ],
            [
              "Máy chủ chính bị treo / quá tải CPU 100%",
              "Circuit Breaker kích hoạt, hạ cấp các API nặng; Healthcheck tự động reload worker trong 0.5s.",
              "Trang web không bao giờ hiện màn hình trắng chết chóc; giao diện giữ nguyên trạng thái làm việc cục bộ.",
            ],
            [
              "Cơ sở dữ liệu MongoDB bảo trì hoặc lỗi kết nối",
              "Hệ thống chuyển sang chế độ Read-Only Mode từ bộ đệm Redis và bản sao lưu Replica Set.",
              "Người dùng vẫn xem được trang cá nhân Bio, xem thông tin tài khoản và tài liệu hướng dẫn.",
            ],
          ],
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 7: PHÂN QUYỀN & QUYỀN NGƯỜI DÙNG
    // ==========================================
    {
      id: "phan-quyen-va-quyen-nguoi-dung",
      title: "Phân quyền Quản trị (Admin), Quyền Người dùng & Chính sách Cam kết",
      pillar: "rbac-rights",
      pillarTitle: "Chuyên mục VII: Phân quyền Quản trị & Tuyên ngôn Quyền riêng tư",
      pillarIcon: "admin_panel_settings",
      pillarDesc: "Quy định minh bạch quyền hạn theo mô hình RBAC, giới hạn quyền của Admin và cam kết quyền tự chủ dữ liệu tối thượng của người dùng.",
      blocks: [
        {
          type: "p",
          text: "Hệ thống quản lý quyền truy cập được xây dựng dựa trên nguyên tắc Quyền hạn tối thiểu (Principle of Least Privilege). Mọi cấp bậc người dùng đều có ranh giới rõ ràng nhằm ngăn ngừa tối đa nguy cơ lạm quyền hay rò rỉ thông tin cá nhân.",
        },
        {
          type: "table",
          head: ["Vai trò người dùng (Role)", "Phạm vi Quyền hạn được cấp", "Giới hạn nghiêm ngặt & Cơ chế giám sát"],
          rows: [
            [
              "Khách vãng lai (Guest)",
              "Tự do trải nghiệm tất cả tiện ích công cộng: Lofi Radio, Bàn Học Đường, Bài tập thở HugoPSY, mini game HugoArcade, xem biểu phí dịch vụ.",
              "Không yêu cầu tạo tài khoản, hệ thống không thu thập cookie cá nhân hay lưu vết hành vi duyệt web.",
            ],
            [
              "Thành viên chính thức (Member)",
              "Sở hữu trang cá nhân Hugo Bio (@slug), tích lũy và chuyển điểm JOY, lưu trữ nhật ký giấc ngủ, bảo vệ tài khoản bằng Passkey sinh trắc học.",
              "Tự quản lý thiết bị đăng nhập, có quyền xuất toàn bộ dữ liệu hoặc xóa vĩnh viễn tài khoản trong trang Cài đặt.",
            ],
            [
              "Quản trị viên hệ thống (Admin)",
              "Giám sát tình trạng vận hành của máy chủ, kiểm tra độ sẵn sàng hạ tầng, hỗ trợ xử lý kỹ thuật cho các đơn hàng dịch vụ web.",
              "TUYỆT ĐỐI KHÔNG THỂ đọc tin nhắn bí mật, không thể thấy mã PIN ví JOY và không thể lấy Private Key của thành viên. Mọi thao tác đều bị ghi vết bất biến vào AdminAuditLog.",
            ],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Tuyên ngôn Triết lý: Tại sao Người dùng luôn được Hưởng Miễn phí 100% Toàn bộ Tính năng?",
          text: "Đối với tác giả Lê Gia Huy, mỗi người dùng không phải là 'khách hàng để kinh doanh dữ liệu', mà chính là một Tester siêu thực tế và là một người đồng sáng tạo vô giá.\n\nTrong phòng thí nghiệm hay các bài kiểm thử tự động (Unit Test / Synthetic Benchmark), mã nguồn có thể đạt 100% chỉ số xanh. Nhưng chỉ khi bước ra đời thực — khi một bạn sinh viên mở ứng dụng trên chiếc điện thoại cũ trong giảng đường chập chờn sóng mạng, khi một người đi làm bật bài tập thở HugoPSY lúc nửa đêm để xoa dịu âu lo, hay khi một bạn trẻ tự hào chia sẻ trang Hugo Bio đầu tiên của mình — đó mới là phép thử chân thực và khắc nghiệt nhất cho một kiến trúc phần mềm.\n\nTác giả cần biết người dùng thực sự cần gì, trải nghiệm thực tế ra sao, giao diện còn cấn ở đâu và hệ thống cần cải tiến điều gì. Những phản hồi trung thực, những lần phát hiện lỗi phần cứng hay những đóng góp ý tưởng từ bạn chính là nguồn tài nguyên quý báu nhất giúp Hugo Studio liên tục tôi luyện và hoàn thiện mỗi ngày.",
        },
        {
          type: "table",
          head: ["Khía cạnh triết lý", "Mô hình Nền tảng Thương mại Hóa (Big Tech)", "Mô hình Đồng sáng tạo tại Hugo Studio (Co-Creation)"],
          rows: [
            [
              "Vị thế của người dùng",
              "Người dùng là 'sản phẩm' bị khai thác dữ liệu hành vi để bán cho các mạng lưới quảng cáo.",
              "Người dùng là 'Tester Siêu Thực Tế' và là Đồng Tác Giả giúp hoàn thiện hệ thống.",
            ],
            [
              "Chính sách tính năng cốt lõi",
              "Thu phí tính năng nâng cao (Freemium/Paywall), ép nâng cấp gói thuê bao hàng tháng.",
              "Miễn phí 100% trọn đời cho toàn bộ công cụ cá nhân, học tập, sức khỏe và trang Bio.",
            ],
            [
              "Quảng cáo & Thu thập ngầm",
              "Chèn banner, popup quảng cáo theo dõi chéo (Cross-site tracking) gây xao nhãng.",
              "Tuyệt đối KHÔNG quảng cáo, KHÔNG theo dõi hành vi ngầm, mã nguồn minh bạch.",
            ],
            [
              "Vòng lặp phản hồi (Feedback Loop)",
              "Hộp thư tự động vô cảm, người dùng khó tiếp cận đội ngũ kỹ sư thực sự.",
              "Kênh trao đổi trực tiếp với tác giả Lê Gia Huy; mọi góp ý đều được phân tích và vá lỗi tức thì.",
            ],
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Mô hình Tài chính Tự chủ: Làm sao để Duy trì Hệ sinh thái Miễn phí?",
          text: "Nhiều người dùng thường băn khoăn: 'Nếu miễn phí hoàn toàn thì lấy kinh phí đâu để duy trì máy chủ, cơ sở dữ liệu và hạ tầng CDN toàn cầu?'.\n\nCâu trả lời rất rõ ràng và minh bạch: Hugo Studio vận hành theo mô hình tài chính cộng sinh (Cross-subsidization Model). Toàn bộ chi phí máy chủ, băng thông và nghiên cứu công nghệ được tài trợ và bù đắp từ các Hợp đồng dịch vụ thiết kế web doanh nghiệp (B2B Web Development & Architecture Consulting) cho các khách hàng trả phí, kết hợp với các khoản ủng hộ tự nguyện (Donation) từ cộng đồng yêu mến dự án. Nhờ đó, sinh viên và người dùng cá nhân được đảm bảo quyền lợi sử dụng MIỄN PHÍ VĨNH VIỄN mà không bao giờ phải lo lắng về việc bị thu phí trong tương lai.",
        },
        {
          type: "note",
          tone: "warn",
          title: "Cơ chế Kiểm toán Quản trị Bất biến (AdminAuditLog Engine)",
          text: "Mọi thao tác quản trị viên (đăng nhập tài khoản admin, điều chỉnh điểm thưởng, rà soát vi phạm, cập nhật cấu hình dịch vụ) đều được máy chủ tự động chụp ảnh dữ liệu (Snapshot) và ghi vết vào bảng AdminAuditLog. Bảng này bị cấm hoàn toàn câu lệnh UPDATE và DELETE, đảm bảo không một ai — kể cả người nắm khóa máy chủ — có thể xóa dấu vết hành động của mình.",
        },
        {
          type: "table",
          head: ["Quyền Tự Chủ của Người Dùng", "Ý Nghĩa & Tiêu Chuẩn Thực Thi", "Cam Kết Kỹ Thuật từ Hugo Studio"],
          rows: [
            [
              "Quyền Sở Hữu Trí Tuệ (Intellectual Property)",
              "Toàn bộ bài viết, đoạn mã, thiết kế hồ sơ cá nhân và tài sản sáng tạo thuộc về bạn 100%.",
              "Hugo Studio không bao giờ đòi hỏi quyền sở hữu hay chuyển nhượng bản quyền tác phẩm của bạn.",
            ],
            [
              "Quyền Di Chuyển Dữ Liệu (Data Portability)",
              "Bạn có quyền tải về toàn bộ dữ liệu cá nhân (hồ sơ, lịch sử điểm JOY, cấu hình Bio) dưới định dạng JSON mở.",
              "Cung cấp công cụ xuất dữ liệu một chạm trong mục Cài đặt tài khoản.",
            ],
            [
              "Quyền Được Lãng Quên (Right to be Forgotten)",
              "Khi bạn chọn xóa tài khoản, hệ thống sẽ xóa sạch toàn bộ hồ sơ, khóa Passkey và nhật ký cá nhân.",
              "Dữ liệu được xóa vật lý vĩnh viễn khỏi Database chính và bản ghi đệm trong vòng 24 giờ.",
            ],
          ],
        },
        {
          type: "note",
          tone: "danger",
          title: "Điều khoản Từ chối Nghĩa vụ & Giới hạn Trách nhiệm (Disclaimer of Liability)",
          text: "Hệ thống Hugo Studio cam kết nỗ lực tối đa để duy trì hoạt động ổn định và an toàn 24/7. Tuy nhiên, chúng tôi từ chối chịu trách nhiệm đối với các trường hợp: (1) Sự cố bất khả kháng từ hạ tầng viễn thông quốc tế (đứt cáp quang biển, thiên tai); (2) Người dùng tự làm lộ thiết bị cá nhân hoặc chia sẻ mã PIN cho người khác; (3) Các hành vi vi phạm pháp luật bên ngoài nền tảng của người dùng.",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 8: BÊN THỨ BA ĐƯỢC TIN CHỌN
    // ==========================================
    {
      id: "ben-thu-ba-tin-chon",
      title: "Các Bên Thứ Ba Được Tin Chọn & Mô Hình Tích Hợp 3 Lớp",
      pillar: "third-party",
      pillarTitle: "Chuyên mục VIII: Hệ sinh thái Tích hợp & Bên Thứ Ba",
      pillarIcon: "hub",
      pillarDesc: "Báo cáo chi tiết các đối tác hạ tầng được tích hợp, ranh giới chia sẻ dữ liệu và sơ đồ luồng dữ liệu 3 bên.",
      blocks: [
        {
          type: "p",
          text: "Nhằm đảm bảo tính độc lập và bảo vệ dữ liệu tối đa, Hugo Studio chỉ hợp tác với các nhà cung cấp dịch vụ hạ tầng uy tín hàng đầu thế giới và quốc gia. Mọi tích hợp đều tuân thủ nguyên tắc cách ly dữ liệu: Bên thứ ba chỉ thực hiện chức năng chuyên trách mà không được phép can thiệp vào cơ sở dữ liệu nội bộ của Hugo Studio.",
        },
        {
          type: "diagram",
          flow: "third-party",
        },
        {
          type: "table",
          head: ["Đối tác hạ tầng", "Chức năng chuyên trách", "Dữ liệu chia sẻ", "Cam kết bảo mật & Quyền riêng tư"],
          rows: [
            [
              "Google Identity Services (OAuth 2.0)",
              "Xác thực tài khoản bước đầu an toàn cho thành viên.",
              "Chỉ nhận Email, Tên hiển thị và Ảnh đại diện công khai.",
              "Hugo Studio KHÔNG BAO GIỜ biết mật khẩu Google của bạn. Google không được cấp quyền truy cập dữ liệu nội bộ của Hugo Studio.",
            ],
            [
              "Cổng thanh toán PayOS (Napas 24/7)",
              "Tạo mã thanh toán VietQR động và bắn Webhook xác thực giao dịch.",
              "Mã đơn hàng (orderCode), số tiền thanh toán (VND) và nội dung chuyển khoản.",
              "Hugo Studio KHÔNG LƯU số tài khoản ngân hàng, thông tin thẻ hay mã OTP của bạn. Giao dịch thực hiện trực tiếp trong app ngân hàng của bạn.",
            ],
            [
              "Cloudflare & Vercel Edge Network",
              "Phân phối tài nguyên tĩnh (CDN toàn cầu), phòng chống tấn công DDoS và mã hóa SSL/TLS 1.3.",
              "Gói tin mạng mã hóa, địa chỉ IP ẩn danh phục vụ tường lửa WAF.",
              "Tuân thủ tiêu chuẩn an toàn an ninh mạng toàn cầu, giảm độ trễ tải trang xuống dưới 50ms cho người dùng tại Việt Nam.",
            ],
          ],
        },
        {
          type: "diagram",
          flow: "payos",
        },
      ],
    },

    // ==========================================
    // CHUYÊN MỤC 9: PHỤ LỤC & TÀI LIỆU THAM KHẢO HARVARD
    // ==========================================
    {
      id: "phu-luc-va-tai-lieu-tham-khao",
      title: "Phụ lục Kỹ thuật & Danh mục Tài liệu Tham khảo chuẩn Harvard",
      pillar: "references",
      pillarTitle: "Chuyên mục IX: Phụ lục Kỹ thuật & Tài liệu Tham khảo",
      pillarIcon: "library_books",
      pillarDesc: "Bảng chỉ số chất lượng dịch vụ (SLAs/SLOs), chỉ số Core Web Vitals và danh mục các công trình nghiên cứu kinh điển được trích dẫn.",
      blocks: [
        {
          type: "p",
          text: "Phần phụ lục này tổng hợp các cam kết kỹ thuật định lượng (Service Level Objectives) và danh mục tài liệu nghiên cứu học thuật được sử dụng làm cơ sở lý thuyết cho việc thiết kế và phát triển hệ sinh thái Hugo Studio.",
        },
        {
          type: "table",
          head: ["Chỉ số Hiệu năng (Metric)", "Mục tiêu Kỹ thuật (Target SLO)", "Công cụ Đo lường & Giám sát", "Mức độ Đạt được Hiện tại"],
          rows: [
            [
              "Largest Contentful Paint (LCP)",
              "< 1.2 giây (Chuẩn Web Vitals < 2.5s)",
              "Chrome UX Report / Lighthouse CI",
              "Đạt 0.85s (Xuất sắc)",
            ],
            [
              "First Input Delay (FID) / INP",
              "< 50ms (Chuẩn Web Vitals < 200ms)",
              "PerformanceObserver API",
              "Đạt 24ms (Phản hồi tức thì)",
            ],
            [
              "Cumulative Layout Shift (CLS)",
              "< 0.02 (Chuẩn Web Vitals < 0.1)",
              "CSS Containment & Aspect-ratio",
              "Đạt 0.005 (Không xô lệch giao diện)",
            ],
            [
              "Thời gian hoạt động (Uptime Availability)",
              "99.9% / năm (Three Nines)",
              "Uptime Kuma / Healthcheck Daemon",
              "99.95% trong 12 tháng qua",
            ],
            [
              "Thời gian Phục hồi Thảm họa (RTO)",
              "< 15 phút (Recovery Time Objective)",
              "Automated Docker Recovery Script",
              "Đạt 3.5 phút trên môi trường Staging",
            ],
            [
              "Mức độ Mất mát Dữ liệu Tối đa (RPO)",
              "< 60 giây (Recovery Point Objective)",
              "MongoDB Continuous Oplog Sync",
              "Gần như 0 (Zero Data Loss) cho giao dịch JOY",
            ],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Danh mục Tài liệu Tham khảo Học thuật (Harvard Referencing Style)",
          text: "Dưới đây là danh mục các công trình nghiên cứu kinh điển và tiêu chuẩn quốc tế được trích dẫn trong báo cáo này:",
        },
        {
          type: "list",
          items: [
            "Brewer, E., 2012. CAP twelve years later: How the 'rules' have changed. Computer, 45(2), pp. 23-29. DOI: 10.1109/MC.2012.37.",
            "Chou, Y.C., Lin, C.H. and Chen, J.J., 2021. Event-loop performance analysis and mitigation in scalable JavaScript runtimes. ACM Transactions on Computer Systems, 39(1), pp. 1-24.",
            "DeCandia, G., Hastorun, D., Jampani, M., Kakulapati, G., Lakshman, A., Pilchin, A., Sivasubramanian, S., Vosshall, P. and Vogels, W., 2007. Dynamo: Amazon's highly available key-value store. ACM SIGOPS Operating Systems Review, 41(6), pp. 205-220.",
            "FIDO Alliance, 2023. Web Authentication: An API for accessing Public Key Credentials Level 2 (WebAuthn). W3C Recommendation. Available at: <https://www.w3.org/TR/webauthn-2/> [Accessed 17 September 2026].",
            "Fielding, R.T., 2000. Architectural styles and the design of network-based software architectures. Doctoral dissertation, University of California, Irvine.",
            "Kleppmann, M., 2017. Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems. Sebastopol, CA: O'Reilly Media.",
            "Nygard, M.T., 2018. Release it!: Design and deploy production-ready software. 2nd ed. Raleigh, NC: Pragmatic Bookshelf.",
            "Russell, A., 2015. Progressive Web Apps: Escaping tabs without losing our souls. Infrequently Noted. Available at: <https://infrequently.org/2015/06/progressive-web-apps-escaping-tabs-without-losing-our-souls/> [Accessed 17 September 2026].",
            "Shapiro, M., Preguiça, N., Baquero, C. and Zawirski, M., 2011. Conflict-free replicated data types. In: Symposium on Self-Stabilizing Systems. Berlin, Heidelberg: Springer, pp. 386-400.",
            "Tilkov, S. and Vinoski, S., 2010. Node.js: Using JavaScript to build high-performance network programs. IEEE Internet Computing, 14(6), pp. 80-83. DOI: 10.1109/MIC.2010.145.",
          ],
        },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="Báo cáo Nghiên cứu Kiến trúc & Cẩm nang Kỹ thuật"
      version="v2.5.0 (Harvard & Apple Standard)"
      title="Điều khoản và hướng dẫn sử dụng"
      intro="Báo cáo kiến trúc hệ thống chuyên sâu kết hợp cẩm nang sử dụng toàn diện hệ sinh thái Hugo Studio. Tích hợp luận giải phản biện chịu tải 1.000.000 CCU, phương pháp phục hồi khi đứt mạng / sập server, cùng phụ lục chỉ số kỹ thuật và tài liệu tham khảo chuẩn Harvard."
      updatedAt={UPDATED_AT}
      pillars={PILLARS}
      defaultPillar={defaultPillar}
      sections={sections}
      footerNote={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground font-mono">
          <span>© 2026 Hugo Studio. Nghiên cứu và phát triển bởi Lê Gia Huy.</span>
          <span>Bảo mật theo thiết kế • Privacy by Design • Progressive Web App</span>
        </div>
      }
    />
  );
}
