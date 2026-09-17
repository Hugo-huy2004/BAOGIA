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
