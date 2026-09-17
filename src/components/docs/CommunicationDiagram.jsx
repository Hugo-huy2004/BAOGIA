import { useState } from "react";

/**
 * Sơ đồ giao tiếp kiến trúc (Communication Sequence & Protocol Diagrams)
 * Chuẩn phong cách Apple Developer Technical Whitepaper & Harvard Engineering Report:
 * - Trình bày luồng bắt tay giữa các bên (Client <-> Service Worker <-> Server <-> Third-Party)
 * - Tông màu đơn sắc xanh kỹ thuật (Monochromatic Blue), tương thích chuẩn light/dark
 * - Minh hoạ luồng gói tin, chữ ký mật mã, thời gian phản hồi và cam kết an toàn
 */

const DIAGRAMS = {
  passkey: {
    badge: "FIDO2 / WebAuthn Protocol",
    title: "Sơ đồ giao tiếp: Xác thực sinh trắc học Passkey không mật khẩu",
    desc: "Mô tả luồng bắt tay mật mã học bất đối xứng. Dữ liệu vân tay/Face ID luôn nằm lại trong chip phần cứng (Secure Enclave / TPM) và không bao giờ rời khỏi máy bạn.",
    nodes: [
      { id: "client", label: "Trình duyệt của bạn", sub: "PWA Client", icon: "devices" },
      { id: "hardware", label: "Chip bảo mật thiết bị", sub: "Secure Enclave / TPM", icon: "fingerprint", highlight: true },
      { id: "server", label: "Máy chủ Hugo Studio", sub: "API Auth Server", icon: "dns" },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        action: "1. Yêu cầu đăng nhập",
        detail: "Gửi định danh tài khoản Google / email (hoàn toàn không gửi mật khẩu).",
      },
      {
        from: "server",
        to: "client",
        action: "2. Gửi chuỗi Challenge ngẫu nhiên",
        detail: "Server sinh chuỗi Cryptographic Nonce 32 bytes dùng một lần để chống tấn công phát lại (Replay Attack).",
      },
      {
        from: "client",
        to: "hardware",
        action: "3. Yêu cầu quét sinh trắc học",
        detail: "Gọi navigator.credentials.get(). Thiết bị kích hoạt phần cứng yêu cầu bạn chạm Touch ID hoặc nhìn Face ID.",
      },
      {
        from: "hardware",
        to: "client",
        action: "4. Ký điện tử bằng Private Key",
        detail: "Chip xác nhận đúng chủ máy và dùng Khóa bí mật (nằm vĩnh viễn trong chip) để ký số lên Challenge.",
      },
      {
        from: "client",
        to: "server",
        action: "5. Gửi chữ ký mật mã (Signature)",
        detail: "Chỉ gửi chữ ký số và metadata xác thực, KHÔNG gửi dữ liệu sinh trắc học hay Private Key.",
      },
      {
        from: "server",
        to: "client",
        action: "6. Xác minh Public Key & Cấp phiên",
        detail: "Server dùng Public Key đã đăng ký trước đó để đối soát chữ ký. Đăng nhập thành công tức thì trong < 1.0s!",
      },
    ],
    securityNote: "Cam kết: Máy chủ chỉ lưu Public Key vô hại; nếu máy chủ bị rò rỉ dữ liệu thì hacker cũng không thể suy ngược ra vân tay hay Private Key của bạn.",
  },

  "pwa-lifecycle": {
    badge: "Service Worker Cache-First Protocol",
    title: "Sơ đồ giao tiếp: Cơ chế lưu đệm ngoại tuyến (Offline PWA Lifecycle)",
    desc: "Mô tả luồng tương tác giữa Trình duyệt, Service Worker Cache Engine và Mạng máy chủ. Đảm bảo ứng dụng khởi chạy tức thì < 0.5s kể cả khi mất kết nối mạng.",
    nodes: [
      { id: "ui", label: "Giao diện người dùng", sub: "DOM / React App", icon: "touch_app" },
      { id: "sw", label: "Service Worker Engine", sub: "Background Proxy", icon: "cloud_sync", highlight: true },
      { id: "network", label: "Mạng máy chủ Edge", sub: "Cloudflare / Node Server", icon: "public" },
    ],
    steps: [
      {
        from: "ui",
        to: "sw",
        action: "1. Yêu cầu tài nguyên tĩnh (fetch)",
        detail: "Khi người dùng mở trang hoặc chuyển route, trình duyệt gửi fetch event đến Service Worker trung gian.",
      },
      {
        from: "sw",
        to: "ui",
        action: "2. Phục vụ tức thì từ Cache Storage",
        detail: "Chiến lược Cache-First: Service Worker kiểm tra bộ nhớ đệm và trả về Bundle JS/CSS/Fonts trong < 50ms.",
      },
      {
        from: "sw",
        to: "network",
        action: "3. Thăm dò phiên bản mới ngầm (Stale-While-Revalidate)",
        detail: "Service Worker đồng thời gửi yêu cầu nhẹ lên máy chủ để kiểm tra ETag và hash tệp phiên bản mới.",
      },
      {
        from: "network",
        to: "sw",
        action: "4. Tải bản cập nhật nền",
        detail: "Nếu phát hiện mã nguồn mới đã build, Service Worker âm thầm tải về và lưu sẵn vào bộ nhớ đệm mới.",
      },
      {
        from: "sw",
        to: "ui",
        action: "5. Thông báo cập nhật mượt mà",
        detail: "Kích hoạt sự kiện postMessage báo giao diện: 'Đã sẵn sàng phiên bản mới'. Người dùng chạm một chạm để làm mới.",
      },
    ],
    securityNote: "Cam kết: Toàn bộ Service Worker chỉ hoạt động qua kết nối mã hóa HTTPS bắt buộc, chống giả mạo mã nguồn trung gian (Man-in-the-Middle).",
  },

  payos: {
    badge: "Napas 24/7 / PayOS Webhook Protocol",
    title: "Sơ đồ giao tiếp: Thanh toán VietQR & Kích hoạt hợp đồng tự động",
    desc: "Quy trình thanh toán chính xác đến từng đồng thông qua cổng thanh toán quốc gia Napas 24/7, xác nhận tức thời qua Webhook có chữ ký số HMAC-SHA256.",
    nodes: [
      { id: "client", label: "Khách hàng", sub: "App Ngân hàng", icon: "person" },
      { id: "payos", label: "Cổng thanh toán PayOS", sub: "Napas 24/7 Gateway", icon: "qr_code_scanner", highlight: true },
      { id: "server", label: "Máy chủ Hugo Studio", sub: "Order Management", icon: "dns" },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        action: "1. Khảo sát & Chọn cấu hình dịch vụ",
        detail: "Khách hàng chọn gói web trên trang /services và nhấn khởi tạo hợp đồng dịch vụ.",
      },
      {
        from: "server",
        to: "payos",
        action: "2. Tạo liên kết thanh toán VietQR",
        detail: "Server gọi API PayOS với mã đơn hàng duy nhất (orderCode), số tiền chính xác và nội dung chuyển khoản chuẩn hóa.",
      },
      {
        from: "payos",
        to: "client",
        action: "3. Hiển thị mã VietQR động",
        detail: "Khách hàng mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank...), quét mã QR để thanh toán tức thì.",
      },
      {
        from: "client",
        to: "payos",
        action: "4. Chuyển tiền liên ngân hàng",
        detail: "Hệ thống liên ngân hàng Napas xử lý giao dịch trong 1-2 giây và gửi biên lai xác nhận giao dịch.",
      },
      {
        from: "payos",
        to: "server",
        action: "5. Bắn Webhook xác nhận (HMAC-SHA256)",
        detail: "PayOS gửi gói tin Webhook kèm chữ ký số HMAC xác thực giao dịch thành công về endpoint máy chủ.",
      },
      {
        from: "server",
        to: "client",
        action: "6. Kích hoạt dự án & Gửi hóa đơn điện tử",
        detail: "Hệ thống tự động chuyển trạng thái đơn hàng sang 'Đã thanh toán', tạo kênh trao đổi và gửi email xác nhận trong 3 giây.",
      },
    ],
    securityNote: "Cam kết: Không thu phí ẩn. Giao dịch trực tiếp từ tài khoản ngân hàng của bạn, Hugo Studio không chạm vào thông tin thẻ tín dụng hay mã OTP.",
  },

  "particle-qr": {
    badge: "Particle Connect P2P Protocol",
    title: "Sơ đồ giao tiếp: Trao đổi điểm JOY qua mã hạt phân tử QR",
    desc: "Cơ chế giao dịch điểm thưởng an toàn giữa hai người dùng với mã QR động chuyển động hạt phân tử, chữ ký HMAC và xác thực mã PIN cá nhân.",
    nodes: [
      { id: "receiver", label: "Người nhận JOY", sub: "Tạo mã QR", icon: "qr_code_2" },
      { id: "sender", label: "Người gửi JOY", sub: "Quét mã & Nhập PIN", icon: "smartphone", highlight: true },
      { id: "server", label: "Máy chủ xác thực", sub: "JOY Ledger & Anti-Fraud", icon: "dns" },
    ],
    steps: [
      {
        from: "receiver",
        to: "server",
        action: "1. Yêu cầu tạo mã nhận điểm",
        detail: "Người nhận nhấn 'Nhận JOY'. Server sinh một chuỗi mật mã Token chứa ID tài khoản + Nonce ngẫu nhiên + Timestamp.",
      },
      {
        from: "server",
        to: "receiver",
        action: "2. Render mã hạt phân tử (60s)",
        detail: "Mã QR được hiển thị với hiệu ứng các hạt phân tử sáng chuyển động, kèm đồng hồ đếm ngược đúng 60 giây.",
      },
      {
        from: "sender",
        to: "receiver",
        action: "3. Mở camera quét mã trực tiếp",
        detail: "Người gửi mở camera trong ứng dụng PWA, hướng vào mã QR của bạn bè để nhận diện tức thì.",
      },
      {
        from: "sender",
        to: "sender",
        action: "4. Nhập số lượng & Mã PIN 6 số",
        detail: "Nhập số lượng JOY cần gửi và nhập mã PIN 6 số bí mật để ký lệnh chuyển điểm trên thiết bị cá nhân.",
      },
      {
        from: "sender",
        to: "server",
        action: "5. Gửi lệnh chuyển điểm kèm chữ ký HMAC",
        detail: "Gửi gói tin chuyển điểm kèm chữ ký HMAC và mã PIN đã băm (SHA-256 + Salt cục bộ).",
      },
      {
        from: "server",
        to: "sender",
        action: "6. Ghi sổ kép đối soát (Atomic Ledger Insert)",
        detail: "Server kiểm tra hạn mức ngày, sinh đồng thời 2 dòng JoyLedger (trừ người gửi, cộng người nhận) và đồng bộ số dư trong 1 giây.",
      },
    ],
    securityNote: "Cam kết: Mã QR hạt phân tử tự động vô hiệu sau 60 giây để ngăn chặn chụp lén hoặc gửi lặp giao dịch.",
  },

  "third-party": {
    badge: "Three-Tier Integration Architecture",
    title: "Sơ đồ giao tiếp: Kiến trúc tích hợp 3 bên (Client ↔ Server ↔ Third-Party)",
    desc: "Mô hình phân tách lớp độc lập giữa Người dùng, Máy chủ ứng dụng Hugo Studio và các Dịch vụ chuyên trách bên thứ ba (Google OAuth & PayOS Napas).",
    nodes: [
      { id: "client", label: "Trình duyệt Người dùng", sub: "Client Layer", icon: "person" },
      { id: "hugo", label: "Máy chủ Hugo Studio", sub: "Application Backend", icon: "dns", highlight: true },
      { id: "third", label: "Bên thứ ba được tin chọn", sub: "Google IdP / PayOS Napas", icon: "verified_user" },
    ],
    steps: [
      {
        from: "client",
        to: "hugo",
        action: "1. Khởi tạo yêu cầu dịch vụ",
        detail: "Người dùng yêu cầu đăng nhập bằng Google hoặc khởi tạo đơn hàng dịch vụ web.",
      },
      {
        from: "hugo",
        to: "third",
        action: "2. Chuyển tiếp tới Nhà cung cấp xác thực / Cổng thanh toán",
        detail: "Hugo Server ký số gói tin yêu cầu và chuyển tiếp an toàn qua kênh mã hóa TLS 1.3.",
      },
      {
        from: "third",
        to: "client",
        action: "3. Trực tiếp phục vụ người dùng tại trang đối tác",
        detail: "Người dùng xác thực Google Account hoặc quét mã VietQR trong app ngân hàng; đối tác kiểm tra độc lập.",
      },
      {
        from: "third",
        to: "hugo",
        action: "4. Phản hồi Server-to-Server qua Webhook có chữ ký số",
        detail: "Bên thứ ba gửi gói tin xác thực (ID Token / Payment Webhook) có chữ ký mật mã về endpoint bảo mật của Hugo.",
      },
      {
        from: "hugo",
        to: "client",
        action: "5. Hoàn tất chu trình & Cấp quyền phiên",
        detail: "Hugo Server đối soát chữ ký số, cập nhật cơ sở dữ liệu nội bộ và cấp quyền cho Client an toàn.",
      },
    ],
    securityNote: "Cam kết: Máy chủ Hugo Studio không bao giờ lưu trữ mật khẩu Google, mã PIN thẻ ngân hàng hay mã OTP của người dùng.",
  },

  "scale-1m": {
    badge: "1M CCU High-Throughput Pipeline",
    title: "Sơ đồ luồng xử lý chịu tải: 1.000.000 kết nối đồng thời (Scale-out Pipeline)",
    desc: "Mô hình kiến trúc 4 tầng phân tải cực hạn: Anycast CDN Edge hấp thụ 95% lưu lượng đọc tĩnh, Kubernetes Ingress phân phối 250 Pods Node.js, Redis Cluster và Sharded MongoDB xử lý giao dịch ghi.",
    nodes: [
      { id: "edge", label: "Anycast CDN Edge", sub: "Cloudflare 300+ PoPs (95% Hit)", icon: "public", highlight: true },
      { id: "k8s", label: "Kubernetes Cluster", sub: "250 Pods Auto-Scaled HPA", icon: "hub" },
      { id: "data", label: "Phân tầng Dữ liệu", sub: "Redis + Sharded MongoDB", icon: "database" },
    ],
    steps: [
      {
        from: "edge",
        to: "edge",
        action: "1. Tiếp nhận 1.000.000 yêu cầu tại Anycast IP gần nhất",
        detail: "Lượng truy cập 1.000.000 CCU chạm vào hơn 300 trạm PoP toàn cầu, phân tán lưu lượng theo địa lý.",
      },
      {
        from: "edge",
        to: "edge",
        action: "2. Hấp thụ 950.000 yêu cầu đọc (95% Cache Hit)",
        detail: "Toàn bộ tài nguyên PWA, hình ảnh Bio và nội dung tĩnh được trả về ngay từ RAM/NVMe của Edge trong < 25ms.",
      },
      {
        from: "edge",
        to: "k8s",
        action: "3. Chuyển tiếp 50.000 yêu cầu ghi động (Dynamic Ingestion)",
        detail: "Chỉ 5% lưu lượng phát sinh giao dịch (Passkey, Ví JOY, Báo giá) được nén HTTP/2 ghép luồng về K8s Ingress.",
      },
      {
        from: "k8s",
        to: "k8s",
        action: "4. K8s HPA tự động nhân bản 250 Pods Node.js",
        detail: "Thuật toán Least-Connections phân bổ tải đều; mỗi Pod chỉ chịu ~200 CCU, giữ Event Loop luôn dưới 40% CPU.",
      },
      {
        from: "k8s",
        to: "data",
        action: "5. Redis Cluster kiểm tra Session & Rate-Limit (< 2ms)",
        detail: "Cụm Redis RAM in-memory đối soát Nonce và khóa giao dịch tốc độ 100.000 QPS, giảm 90% tải truy vấn DB.",
      },
      {
        from: "data",
        to: "k8s",
        action: "6. MongoDB Sharding ghi sổ cái phi tập trung",
        detail: "Ghi nhận giao dịch JoyLedger vào phân vùng shard theo hash email; ghi bền vững với Write Concern: majority.",
      },
    ],
    securityNote: "Cam kết kiến trúc: Phân tách 4 lớp giúp triệt tiêu 95% tải ngay tại biên, đảm bảo thời gian phản hồi p95 luôn dưới 45ms kể cả khi chịu tải 1.000.000 CCU.",
  },

  "global-latency": {
    badge: "Global Edge & GeoDNS Anycast",
    title: "Sơ đồ luồng định tuyến toàn cầu: Triệt tiêu độ trễ địa lý (Geographic Latency)",
    desc: "Giải quyết bài toán rào cản tốc độ ánh sáng trong cáp quang. Ngắt kết nối TLS 1.3 tại trạm Edge biên địa phương và áp dụng mô hình dữ liệu CRDTs không xung đột.",
    nodes: [
      { id: "user", label: "Người dùng Toàn cầu", sub: "Mỹ / Châu Âu / Nhật / Úc", icon: "language" },
      { id: "pop", label: "Trạm Biên Anycast PoP", sub: "Local Edge (RTT 8-15ms)", icon: "cell_tower", highlight: true },
      { id: "origin", label: "Cụm Máy chủ Đa vùng", sub: "Multi-Region Replication", icon: "dns" },
    ],
    steps: [
      {
        from: "user",
        to: "pop",
        action: "1. Bắt tay TLS 1.3 tại trạm PoP biên gần nhất",
        detail: "Thay vì đợi 240ms truyền về máy chủ Việt Nam, quá trình TLS 1.3 Handshake ngắt ngay tại thành phố của người dùng chỉ mất 12ms.",
      },
      {
        from: "pop",
        to: "user",
        action: "2. Phục vụ ngay Bundle PWA & Bộ nhớ đệm",
        detail: "Mã nguồn JavaScript, CSS và Canvas Assets được nạp từ máy chủ biên, giao diện render tức thì trong < 0.3s.",
      },
      {
        from: "pop",
        to: "origin",
        action: "3. Vận chuyển gói tin qua mạng riêng ảo Tier-1 Backbone",
        detail: "Gói tin động di chuyển trên đường truyền cáp quang riêng tối ưu định tuyến (Argo Smart Routing) của Cloudflare/Vercel.",
      },
      {
        from: "origin",
        to: "origin",
        action: "4. Đồng bộ hóa dữ liệu không xung đột (CRDTs Engine)",
        detail: "Dữ liệu nhật ký ngủ và tiến trình Pomodoro ghi cục bộ được hợp nhất tự động bằng Conflict-Free Replicated Data Types.",
      },
      {
        from: "origin",
        to: "user",
        action: "5. Phản hồi hoàn tất giao dịch xuyên biên giới",
        detail: "Phản hồi kết quả được nén gzip/brotli gửi thẳng về người dùng, trải nghiệm mượt mà không phân biệt vị trí địa lý.",
      },
    ],
    securityNote: "Cam kết: Người dùng ở nước ngoài có trải nghiệm phản hồi nhanh tương đương 95% người dùng trong nước nhờ công nghệ Edge Computing.",
  },

  "circuit-breaker": {
    badge: "Circuit Breaker & Self-Healing",
    title: "Sơ đồ trạng thái ngắt mạch & Tự phục hồi khi sập mạng / lỗi máy chủ",
    desc: "Cơ chế bảo vệ đa tầng theo mô hình trạng thái Martin Fowler & Michael Nygard: Closed (Bình thường) -> Open (Ngắt mạch khi lỗi > 50%) -> Half-Open (Hồi phục). Kết hợp ngoại tuyến hoàn toàn tại Client.",
    nodes: [
      { id: "client", label: "Client Service Worker", sub: "IndexedDB Offline Queue", icon: "phonelink_ring" },
      { id: "circuit", label: "Circuit Breaker Engine", sub: "State Machine Sentinel", icon: "power_settings_new", highlight: true },
      { id: "services", label: "Cụm Micro-Services & DB", sub: "Self-Healing Watchdog", icon: "healing" },
    ],
    steps: [
      {
        from: "circuit",
        to: "circuit",
        action: "1. Trạng thái Closed (Bình thường: 100% lưu lượng)",
        detail: "Gateway theo dõi liên tục tỷ lệ lỗi (Error Rate). Mọi yêu cầu được chuyển tiếp thông suốt tới Backend.",
      },
      {
        from: "circuit",
        to: "circuit",
        action: "2. Chuyển sang Trạng thái Open (Ngắt mạch khi tỷ lệ lỗi > 50%)",
        detail: "Nếu dịch vụ phía sau chậm hoặc lỗi trong 10s, Circuit Breaker lập tức ngắt mạch, chặn đứng bão yêu cầu (Thundering Herd).",
      },
      {
        from: "circuit",
        to: "client",
        action: "3. Trả phản hồi Fallback mềm dẻo (Graceful Degradation)",
        detail: "Hệ thống trả về dữ liệu đệm dự phòng; tự tắt hiệu ứng phụ (thời tiết Bio) để giữ 100% tài nguyên cho phiên cốt lõi.",
      },
      {
        from: "client",
        to: "client",
        action: "4. Client tự động chuyển sang hàng đợi IndexedDB",
        detail: "Service Worker ghi nhận thao tác của người dùng vào IndexedDB cục bộ; người dùng tiếp tục làm việc bình thường.",
      },
      {
        from: "services",
        to: "services",
        action: "5. Hạ tầng tự chữa lành (Self-Healing in 0.5s)",
        detail: "PM2 Watchdog / Docker Healthcheck tự động reload các tiến trình bị rò rỉ RAM; giải phóng socket bị nghẽn.",
      },
      {
        from: "circuit",
        to: "client",
        action: "6. Trạng thái Half-Open & Tự động đồng bộ ngầm",
        detail: "Sau 30s, mạch mở 5% để thử nghiệm. Khi Backend khỏe lại, mạch đóng về Closed; Background Sync đẩy toàn bộ IndexedDB lên server.",
      },
    ],
    securityNote: "Cam kết: Ứng dụng không bao giờ bị sập toàn phần hay hiển thị màn hình trắng chết chóc; dữ liệu cục bộ được bảo toàn 100%.",
  },
};

export default function CommunicationDiagram({ flow = "passkey" }) {
  const data = DIAGRAMS[flow] || DIAGRAMS.passkey;
  const [activeStep, setActiveStep] = useState(0);

  return (
    <figure className="my-6 overflow-hidden rounded-3xl border border-sky-500/20 bg-slate-950 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/15 bg-sky-950/20 px-5 py-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-[11px] font-bold text-sky-400">
            <span className="material-symbols-outlined text-[13px]">sync_alt</span>
            <span>{data.badge}</span>
          </div>
          <h3 className="mt-2 text-base font-bold text-white tracking-tight sm:text-lg">
            {data.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            {data.desc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
            Sơ đồ chuỗi giao tiếp
          </span>
        </div>
      </div>

      {/* Nodes Overview */}
      <div className="grid grid-cols-3 gap-2 border-b border-sky-500/15 bg-white/[0.01] p-4 sm:p-5">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
              node.highlight
                ? "border-sky-500/60 bg-sky-500/10 shadow-sm"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              node.highlight ? "bg-sky-500 text-white shadow-xs" : "bg-white/10 text-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-white sm:text-sm">{node.label}</p>
            <p className="text-[10px] text-slate-400">{node.sub}</p>
          </div>
        ))}
      </div>

      {/* Sequence Steps Timeline */}
      <div className="p-4 sm:p-6 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-sky-400">timeline</span>
          <span>Trình tự các bước bắt tay giao tiếp (Sequence Steps):</span>
        </p>
        <div className="space-y-2">
          {data.steps.map((step, idx) => {
            const isCurrent = activeStep === idx;
            return (
              <div
                key={step.action}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                  isCurrent
                    ? "border-sky-500/70 bg-sky-500/[0.12] shadow-md"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                      isCurrent ? "bg-sky-500 text-white" : "bg-white/10 text-slate-400"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white truncate">
                      {step.action}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                    <span>{step.from}</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    <span>{step.to}</span>
                  </div>
                </div>
                <p className="mt-1.5 pl-8 text-xs text-slate-300 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Security Note */}
      {data.securityNote && (
        <figcaption className="border-t border-sky-500/15 bg-sky-950/20 px-5 py-3.5 text-xs text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-400 text-base shrink-0">verified</span>
          <span>{data.securityNote}</span>
        </figcaption>
      )}
    </figure>
  );
}
