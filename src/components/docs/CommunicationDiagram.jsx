import { useState } from "react";

/**
 * Sơ đồ giao tiếp kiến trúc (Communication Sequence & Protocol Diagrams)
 * Chuẩn phong cách Apple Developer Documentation:
 * - Trình bày luồng bắt tay giữa các bên (Client <-> Security Gateway <-> Server / Hardware / Third-Party)
 * - Minh hoạ luồng gói tin, chữ ký mật mã, thời gian phản hồi và cam kết an toàn
 */

const DIAGRAMS = {
  passkey: {
    badge: "FIDO2 / WebAuthn Protocol",
    title: "Sơ đồ giao tiếp: Xác thực sinh trắc học Passkey không mật khẩu",
    desc: "Mô tả luồng bắt tay mật mã học bất đối xứng. Dữ liệu vân tay/Face ID luôn nằm lại trong chip phần cứng và không bao giờ rời khỏi máy bạn.",
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
        detail: "Gửi định danh tài khoản Google / username (không gửi mật khẩu).",
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
        detail: "Gọi navigator.credentials.get(). Thiết bị yêu cầu bạn chạm Touch ID hoặc nhìn Face ID.",
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
        detail: "Server dùng Public Key đã đăng ký trước đó để đối soát chữ ký. Đăng nhập thành công trong < 1.0s!",
      },
    ],
    securityNote: "Cam kết: Máy chủ chỉ lưu Public Key vô hại; nếu máy chủ bị rò rỉ dữ liệu thì hacker cũng không thể suy ngược ra vân tay hay Private Key của bạn.",
  },

  payos: {
    badge: "Napas 24/7 / PayOS Webhook",
    title: "Sơ đồ giao tiếp: Thanh toán VietQR & Kích hoạt hợp đồng tự động",
    desc: "Quy trình thanh toán chính xác đến từng đồng thông qua cổng thanh toán quốc gia Napas 24/7, xác nhận tức thời qua Webhook có chữ ký HMAC.",
    nodes: [
      { id: "client", label: "Khách hàng", sub: "App Ngân hàng", icon: "person" },
      { id: "payos", label: "Cổng thanh toán PayOS", sub: "Napas 24/7 Gateway", icon: "qr_code_scanner", highlight: true },
      { id: "server", label: "Máy chủ Hugo Studio", sub: "Order Management", icon: "dns" },
    ],
    steps: [
      {
        from: "client",
        to: "server",
        action: "1. Khảo sát & Chọn gói dịch vụ",
        detail: "Khách hàng chọn cấu hình web trên trang /services và nhấn đặt cọc 50%.",
      },
      {
        from: "server",
        to: "payos",
        action: "2. Tạo liên kết thanh toán VietQR",
        detail: "Server gọi API PayOS với mã đơn hàng duy nhất, số tiền và nội dung chuyển khoản chuẩn hóa.",
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
        detail: "Hệ thống liên ngân hàng Napas xử lý giao dịch trong 1-2 giây và gửi biên lai chuyển tiền.",
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
        action: "6. Kích hoạt dự án & Gửi email",
        detail: "Hệ thống tự động chuyển trạng thái đơn hàng sang 'Đã cọc', tạo kênh trao đổi và gửi email xác nhận trong 3 giây.",
      },
    ],
    securityNote: "Cam kết: Không thu phí ẩn. Giao dịch trực tiếp từ tài khoản ngân hàng của bạn, Hugo Studio không chạm vào thông tin thẻ hay OTP.",
  },

  autograder: {
    badge: "Isolated Sandbox Engine",
    title: "Sơ đồ giao tiếp: Máy chủ chấm bài lập trình tự động Hugo Learning",
    desc: "Quy trình cách ly và thực thi mã an toàn (Chroot Sandbox), đối soát cú pháp AST và đưa ra phản hồi chi tiết cho học viên.",
    nodes: [
      { id: "client", label: "Trình duyệt học viên", sub: "Code Editor / AST", icon: "code" },
      { id: "gateway", label: "Cổng bảo vệ Hugo API", sub: "Rate Limiter & Auth", icon: "shield" },
      { id: "sandbox", label: "Môi trường cách ly Sandbox", sub: "Isolated Container", icon: "memory", highlight: true },
    ],
    steps: [
      {
        from: "client",
        to: "gateway",
        action: "1. Nộp bài lập trình",
        detail: "Học viên nhấn 'Chạy thử' hoặc 'Nộp bài'. Trình duyệt đóng gói mã nguồn và token phiên gửi lên.",
      },
      {
        from: "gateway",
        to: "sandbox",
        action: "2. Đưa vào Sandbox cách ly an toàn",
        detail: "Gateway kiểm tra quyền, gắn bộ Test Cases bí mật và gửi vào container cách ly không có quyền truy cập mạng ngoài.",
      },
      {
        from: "sandbox",
        to: "sandbox",
        action: "3. Thực thi & Giới hạn tài nguyên",
        detail: "Bộ máy chạy mã với giới hạn nghiêm ngặt: RAM tối đa 128MB, thời gian CPU tối đa 2.0s, chặn mọi lệnh hệ thống nguy hiểm.",
      },
      {
        from: "sandbox",
        to: "gateway",
        action: "4. So sánh kết quả đầu ra & Phân tích AST",
        detail: "Kiểm tra từng Test Case: Giá trị trả về, thời gian chạy, bộ nhớ tiêu tốn và cú pháp code sạch.",
      },
      {
        from: "gateway",
        to: "client",
        action: "5. Trả kết quả Console & Thưởng JOY",
        detail: "Học viên nhận kết quả chi tiết từng dòng; nếu đạt 100% test case, hệ thống tự động cộng điểm JOY và mở khóa bài tiếp theo.",
      },
    ],
    securityNote: "Cam kết: Mã nguồn của bạn chạy hoàn toàn trong môi trường hộp cát an toàn, bảo vệ tuyệt đối máy chủ và dữ liệu của các học viên khác.",
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
        action: "5. Gửi lệnh chuyển điểm lên Server",
        detail: "Gửi gói tin chuyển điểm kèm chữ ký HMAC và mã PIN đã băm (hash).",
      },
      {
        from: "server",
        to: "sender",
        action: "6. Đối soát & Cập nhật số dư 2 bên",
        detail: "Server kiểm tra hạn mức ngày, trừ JOY người gửi và cộng JOY người nhận; đồng bộ biến động số dư cho cả hai trong 1 giây.",
      },
    ],
    securityNote: "Cam kết: Mã QR hạt phân tử tự động vô hiệu sau 60 giây để ngăn chặn chụp lén hoặc gửi lặp giao dịch.",
  },
};

export default function CommunicationDiagram({ flow = "passkey" }) {
  const data = DIAGRAMS[flow] || DIAGRAMS.passkey;
  const [activeStep, setActiveStep] = useState(0);

  return (
    <figure className="my-6 overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-[#0a0c14] text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-3 py-0.5 text-[11px] font-bold text-primary">
            <span className="material-symbols-outlined text-[13px]">sync_alt</span>
            <span>{data.badge}</span>
          </div>
          <h3 className="mt-2 text-base font-bold text-white tracking-tight sm:text-lg">
            {data.title}
          </h3>
          <p className="mt-1 text-xs text-white/60 max-w-2xl leading-relaxed">
            {data.desc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            Sơ đồ trực quan
          </span>
        </div>
      </div>

      {/* Nodes Overview */}
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-white/[0.01] p-4 sm:p-5">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
              node.highlight
                ? "border-primary/60 bg-primary/10 shadow-sm"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              node.highlight ? "bg-primary text-primary-foreground" : "bg-white/10 text-white"
            }`}>
              <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-white sm:text-sm">{node.label}</p>
            <p className="text-[10px] text-white/50">{node.sub}</p>
          </div>
        ))}
      </div>

      {/* Sequence Steps Timeline */}
      <div className="p-4 sm:p-6 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">timeline</span>
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
                    ? "border-primary/70 bg-primary/[0.12] shadow-md"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                      isCurrent ? "bg-primary text-white" : "bg-white/10 text-white/70"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-white truncate">
                      {step.action}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    <span>{step.from}</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    <span>{step.to}</span>
                  </div>
                </div>
                <p className="mt-1.5 pl-8 text-xs text-white/70 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Security Note */}
      {data.securityNote && (
        <figcaption className="border-t border-white/10 bg-white/[0.02] px-5 py-3.5 text-xs text-white/70 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-base shrink-0">verified</span>
          <span>{data.securityNote}</span>
        </figcaption>
      )}
    </figure>
  );
}
