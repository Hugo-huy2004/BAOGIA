/**
 * Dữ liệu Sơ đồ Giao tiếp và Cơ sở Dữ liệu (Tiếng Việt)
 * Cung cấp cho CommunicationDiagram và DatabaseDiagram thông qua DocBlock
 */

export const COMM_DIAGRAMS_VI = {
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
  },

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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
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
        to: "payos",
        action: "1. Quét mã VietQR trên ứng dụng ngân hàng",
        detail: "Khách hàng quét mã VietQR động đã tích hợp sẵn số tiền chính xác và mã đơn hàng duy nhất.",
      },
      {
        from: "payos",
        to: "payos",
        action: "2. Xử lý thanh toán Napas 24/7 tức thì",
        detail: "Hệ thống ngân hàng ghi có trong < 2 giây. PayOS xác nhận giao dịch thành công.",
      },
      {
        from: "payos",
        to: "server",
        action: "3. Bắn Webhook kèm chữ ký số HMAC-SHA256",
        detail: "PayOS gửi gói tin Webhook bảo mật tới máy chủ Hugo Studio kèm chữ ký số để chống giả mạo kết quả.",
      },
      {
        from: "server",
        to: "server",
        action: "4. Đối soát chữ ký mật mã & Xác nhận đơn hàng",
        detail: "Máy chủ kiểm tra checksum HMAC; đối chiếu số tiền và mã hóa đơn để chống tấn công thanh toán giả.",
      },
      {
        from: "server",
        to: "client",
        action: "5. Kích hoạt dịch vụ & Gửi hợp đồng điện tử",
        detail: "Hệ thống tự động chuyển trạng thái đơn hàng sang 'Đã thanh toán', tạo kênh trao đổi và gửi email xác nhận trong 3 giây.",
      },
    ],
    securityNote: "Cam kết: Không thu phí ẩn. Giao dịch trực tiếp từ tài khoản ngân hàng của bạn, Hugo Studio không chạm vào thông tin thẻ tín dụng hay mã OTP.",
    uiLabels: {
      sequenceLabel: "Sơ đồ chuỗi giao tiếp",
      stepsHeading: "Trình tự các bước bắt tay giao tiếp (Sequence Steps):",
    },
  },
};

export const DB_DIAGRAM_VI = {
  headerBadge: "Relational Schema & Architecture Model",
  headerTitle: "Sơ đồ Cơ sở Dữ liệu & Mối quan hệ Thực thể (ERD)",
  headerDesc: "Mô hình hóa 7 Collection cốt lõi trong MongoDB. Thiết kế chuẩn hóa theo triết lý bảo mật, phân tách trách nhiệm và đảm bảo tính bất biến của sổ cái điểm thưởng.",
  engineLabel: "MongoDB 7.x Engine",
  footerNote: "Cam kết kiến trúc: MongoDB chạy với cơ chế Replica Set đảm bảo dữ liệu ghi bền vững (Write Concern: majority). Mọi dữ liệu nhạy cảm được băm mật mã trước khi chạm ổ đĩa.",
  uiLabels: {
    fieldName: "Tên trường (Field)",
    dataType: "Kiểu dữ liệu (Type)",
    keyIndex: "Khóa & Chỉ mục (Key/Index)",
    businessMeaning: "Ý nghĩa nghiệp vụ",
    directRelations: "Mối quan hệ trực tiếp:",
    integrityTitle: "Ma trận Toàn vẹn Dữ liệu & Ràng buộc Quan hệ (Integrity Constraints):",
    collectionLabel: "Collection:",
  },
  entities: [
    {
      id: "UserProfile",
      name: "UserProfile",
      collection: "userprofiles",
      role: "Thực thể định danh gốc (Core Identity Entity)",
      desc: "Lưu thông tin tài khoản, chân dung quan tâm (User Understanding Layer), biểu đồ giờ hoạt động và cấu hình phiên.",
      color: "sky",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính tự sinh MongoDB" },
        { name: "email", type: "String", key: "Indexed, Unique", desc: "Định danh tài khoản người dùng" },
        { name: "interests", type: "Map<String, Number>", key: "", desc: "Trọng số sở thích học tập & công nghệ" },
        { name: "activeHours", type: "Array<Number>[24]", key: "", desc: "Histogram hoạt động 24h theo múi giờ" },
        { name: "engagementCount", type: "Number", key: "", desc: "Số lượt tương tác tích cực" },
        { name: "createdAt / updatedAt", type: "Date", key: "", desc: "Dấu vết thời gian hệ thống" },
      ],
      relations: [
        { target: "WebAuthnCredential", type: "1:N", desc: "Một người dùng đăng ký nhiều thiết bị Passkey" },
        { target: "BioProfile", type: "1:1", desc: "Một người dùng sở hữu 1 trang cá nhân Bio @slug" },
        { target: "JoyLedger", type: "1:N", desc: "Một người dùng sở hữu lịch sử biến động sổ cái JOY" },
        { target: "PaymentLink", type: "1:N", desc: "Lịch sử hóa đơn dịch vụ & đóng góp" },
      ],
    },
    {
      id: "WebAuthnCredential",
      name: "WebAuthnCredential",
      collection: "webauthncredentials",
      role: "Thực thể khóa mật mã sinh trắc học (Passkey)",
      desc: "Lưu Public Key COSE và bộ đếm chữ ký. Không bao giờ lưu Private Key hay vân tay/Face ID của người dùng.",
      color: "indigo",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "email", type: "String", key: "FK, Indexed", desc: "Tham chiếu tới UserProfile.email" },
        { name: "credentialID", type: "String", key: "Indexed, Unique", desc: "Mã định danh chứng chỉ Base64URL" },
        { name: "publicKey", type: "String", key: "", desc: "Khóa công khai Public Key (COSE format)" },
        { name: "counter", type: "Number", key: "", desc: "Bộ đếm chữ ký chống Replay Attack" },
        { name: "deviceName", type: "String", key: "", desc: "Tên thiết bị (iPhone Face ID, MacBook Touch ID...)" },
        { name: "lastUsedAt", type: "Date", key: "", desc: "Thời điểm đăng nhập gần nhất" },
      ],
      relations: [
        { target: "UserProfile", type: "N:1", desc: "Thuộc về một tài khoản duy nhất (Cascade on Delete)" },
      ],
    },
    {
      id: "BioProfile",
      name: "BioProfile",
      collection: "bios",
      role: "Hồ sơ cá nhân điện ảnh (Cinematic Bio Profile)",
      desc: "Cấu hình trang @slug, hiệu ứng hào quang Aura, lớp thời tiết tương tác và các liên kết công khai.",
      color: "blue",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "slug", type: "String", key: "Indexed, Unique", desc: "Đường dẫn tùy biến (hugowishpax.studio/bio/:slug)" },
        { name: "ownerEmail", type: "String", key: "FK, Indexed", desc: "Email chủ sở hữu hồ sơ" },
        { name: "displayName", type: "String", key: "", desc: "Tên hiển thị nghệ thuật" },
        { name: "auraTheme", type: "String", key: "", desc: "Chủ đề màu sắc hào quang (Cosmic, Emerald, Amber...)" },
        { name: "blocks", type: "Array<BlockObject>", key: "", desc: "Danh sách thẻ liên kết, mạng xã hội, dự án" },
        { name: "weatherEffect", type: "Boolean", key: "", desc: "Bật/tắt lớp phủ thời tiết thời gian thực" },
      ],
      relations: [
        { target: "UserProfile", type: "1:1", desc: "Liên kết 1-1 với tài khoản chủ sở hữu" },
      ],
    },
    {
      id: "JoyLedger",
      name: "JoyLedger",
      collection: "joyledgers",
      role: "Sổ cái điểm thưởng bất biến (Append-Only Ledger)",
      desc: "Lưu vết mọi giao dịch điểm thưởng JOY. Tuyệt đối không UPDATE số dư trực tiếp, chỉ INSERT dòng mới để chống Race Condition.",
      color: "emerald",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "email", type: "String", key: "FK, Indexed", desc: "Tham chiếu tài khoản hưởng hoặc trừ điểm" },
        { name: "amount", type: "Number", key: "", desc: "Số lượng điểm biến động (+/- JOY)" },
        { name: "balanceAfter", type: "Number", key: "", desc: "Số dư tức thời sau khi áp dụng giao dịch" },
        { name: "source", type: "String", key: "Indexed", desc: "Nguồn: streak_checkin, pomodoro, chess_win, p2p_transfer" },
        { name: "refId", type: "String", key: "", desc: "Mã tham chiếu đơn hàng hoặc token chuyển điểm" },
        { name: "createdAt", type: "Date", key: "Indexed (Compound)", desc: "Mốc thời gian giao dịch (email + createdAt index)" },
      ],
      relations: [
        { target: "UserProfile", type: "N:1", desc: "Mỗi dòng ghi sổ gắn chặt với một tài khoản" },
        { target: "PendingTransfer", type: "1:1 (ref)", desc: "Tham chiếu lệnh chuyển điểm nếu phát sinh từ P2P" },
      ],
    },
    {
      id: "PendingTransfer",
      name: "PendingTransfer",
      collection: "pendingtransfers",
      role: "Lệnh chuyển điểm P2P hạt phân tử (TTL 60s)",
      desc: "Đối tượng trung gian trong phiên quét QR hạt phân tử. Tự động xóa khỏi Database sau 60 giây nhờ MongoDB TTL Index.",
      color: "amber",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "token", type: "String", key: "Indexed, Unique", desc: "Mã băm ngẫu nhiên mã hóa trong QR" },
        { name: "receiverEmail", type: "String", key: "FK", desc: "Người tạo mã để nhận điểm" },
        { name: "status", type: "String", key: "", desc: "PENDING | COMPLETED | EXPIRED" },
        { name: "pinChallenge", type: "String", key: "", desc: "Salt bí mật dùng một lần để đối soát PIN" },
        { name: "createdAt", type: "Date", key: "TTL Index (60s)", desc: "Tự động hủy tài liệu sau 60 giây" },
      ],
      relations: [
        { target: "UserProfile", type: "N:1", desc: "Người nhận và người gửi đều là UserProfile" },
        { target: "JoyLedger", type: "1:2", desc: "Khi hoàn tất, sinh 2 dòng JoyLedger (người gửi -JOY, người nhận +JOY)" },
      ],
    },
    {
      id: "PaymentLink",
      name: "PaymentLink",
      collection: "paymentlinks",
      role: "Hóa đơn & Đơn hàng thanh toán tự động (PayOS)",
      desc: "Lưu vết đơn hàng dịch vụ web hoặc ủng hộ máy chủ, liên kết mã đơn hàng với cổng Napas 24/7.",
      color: "blue",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "orderCode", type: "Number", key: "Indexed, Unique", desc: "Mã đơn hàng số nguyên liên ngân hàng" },
        { name: "customLinkId", type: "String", key: "Unique", desc: "Mã định danh liên kết thanh toán" },
        { name: "amount", type: "Number", key: "", desc: "Số tiền chính xác đến từng đồng (VND)" },
        { name: "status", type: "String", key: "Indexed", desc: "PENDING | PAID | CANCELLED" },
        { name: "donorEmail", type: "String", key: "FK, Optional", desc: "Email người thanh toán" },
        { name: "paidAt", type: "Date", key: "", desc: "Thời điểm Napas bắn Webhook HMAC xác nhận" },
      ],
      relations: [
        { target: "UserProfile", type: "N:1 (optional)", desc: "Gắn với tài khoản thành viên nếu đăng nhập" },
      ],
    },
    {
      id: "AdminAuditLog",
      name: "AdminAuditLog",
      collection: "adminauditlogs",
      role: "Nhật ký kiểm toán an ninh quản trị (Audit Trail)",
      desc: "Ghi vết vĩnh viễn mọi hành động của Quản trị viên. Bất biến, không thể sửa đổi hay xóa bỏ để bảo đảm minh bạch.",
      color: "slate",
      fields: [
        { name: "_id", type: "ObjectId", key: "PK", desc: "Khóa chính" },
        { name: "adminId", type: "String", key: "Indexed", desc: "Mã định danh Admin thực hiện thao tác" },
        { name: "action", type: "String", key: "Indexed", desc: "login | adjust_joy | block_user | update_config" },
        { name: "targetEmail", type: "String", key: "Indexed", desc: "Đối tượng chịu tác động (nếu có)" },
        { name: "ipAddress", type: "String", key: "", desc: "Địa chỉ IP nguồn của phiên quản trị" },
        { name: "userAgent", type: "String", key: "", desc: "Trình duyệt và thiết bị của Admin" },
        { name: "details", type: "Mixed", key: "", desc: "Dữ liệu trước và sau biến động (Snapshot)" },
        { name: "createdAt", type: "Date", key: "Indexed", desc: "Mốc thời gian ghi log chính xác đến millisecond" },
      ],
      relations: [
        { target: "Admin", type: "N:1", desc: "Liên kết quản trị viên thực thi tác vụ" },
      ],
    },
  ],
  relationships: [
    {
      from: "UserProfile",
      to: "WebAuthnCredential",
      cardinality: "1 : N",
      rule: "Một người dùng có thể kích hoạt nhiều Passkey (Touch ID, Face ID, Windows Hello). Khi xóa tài khoản User, toàn bộ Credential bị thu hồi (Cascade Delete).",
    },
    {
      from: "UserProfile",
      to: "BioProfile",
      cardinality: "1 : 1",
      rule: "Mỗi người dùng sở hữu duy nhất 1 trang Bio theo slug độc nhất. Slug được index unique để bảo vệ thương hiệu cá nhân.",
    },
    {
      from: "UserProfile",
      to: "JoyLedger",
      cardinality: "1 : N (Append-Only)",
      rule: "Quan hệ ghi sổ một chiều. Hệ thống không bao giờ UPDATE số dư trực tiếp trong bảng User mà tính toán đối soát từ các dòng JoyLedger để loại bỏ hoàn toàn Race Condition.",
    },
    {
      from: "PendingTransfer",
      to: "JoyLedger",
      cardinality: "1 : 2 Atomic",
      rule: "Khi lệnh chuyển điểm P2P hoàn tất thành công, hệ thống kích hoạt transaction nguyên tử tạo đồng thời 2 dòng JoyLedger: Người gửi (-JOY) và Người nhận (+JOY).",
    },
    {
      from: "UserProfile",
      to: "PaymentLink",
      cardinality: "1 : N",
      rule: "Đơn hàng dịch vụ thiết kế web và hóa đơn điện tử được đối soát chính xác theo mã số orderCode qua cổng Napas 24/7.",
    },
    {
      from: "AdminAuditLog",
      to: "System Integrity",
      cardinality: "Bất biến (Immutable)",
      rule: "Nhật ký kiểm toán AdminAuditLog chỉ cho phép ghi (INSERT), cấm mọi hành vi UPDATE hoặc DELETE nhằm ngăn chặn lạm quyền quản trị.",
    },
  ],
};
