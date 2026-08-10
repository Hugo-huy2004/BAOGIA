/**
 * Hình minh hoạ cho trang Hướng dẫn — vẽ bằng SVG, không dùng ảnh chụp màn hình.
 *
 * Ảnh chụp màn hình thật sẽ lỗi thời ngay lần đổi giao diện kế tiếp và nặng
 * hàng trăm KB. Hình ở đây mô phỏng đúng bố cục cần chỉ, dùng token màu của
 * theme nên tự đúng ở cả nền sáng lẫn nền tối, và mỗi hình có các chấm số khớp
 * với các bước viết bên cạnh.
 *
 * ponytail: chỉ có khối hộp và chữ ngắn, không vẽ chi tiết pixel-perfect —
 * mục đích là chỉ chỗ bấm, không phải tái tạo giao diện.
 */

const SURFACE = "hsl(var(--card))";
const BG = "hsl(var(--muted))";
const LINE = "hsl(var(--border))";
const INK = "hsl(var(--foreground))";
const DIM = "hsl(var(--muted-foreground))";
const AX = "hsl(var(--primary))";

/* ---------------------------------------------------------------- mảnh ghép */

/** Khung điện thoại. */
function Phone({ x = 0, y = 0, w = 150, h = 260, children }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width={w} height={h} rx="18" fill={SURFACE} stroke={LINE} strokeWidth="1.5" />
      <rect x="6" y="6" width={w - 12} height={h - 12} rx="13" fill={BG} />
      <rect x={w / 2 - 16} y="10" width="32" height="4" rx="2" fill={LINE} />
      {children}
    </g>
  );
}

/** Khung cửa sổ trình duyệt trên máy tính. */
function Window({ x = 0, y = 0, w = 300, h = 190, children }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width={w} height={h} rx="10" fill={SURFACE} stroke={LINE} strokeWidth="1.5" />
      <rect x="0" y="0" width={w} height="22" rx="10" fill={BG} />
      <rect x="0" y="14" width={w} height="8" fill={BG} />
      <circle cx="14" cy="11" r="3" fill={LINE} />
      <circle cx="24" cy="11" r="3" fill={LINE} />
      <circle cx="34" cy="11" r="3" fill={LINE} />
      <rect x="46" y="5" width={w - 60} height="12" rx="6" fill={SURFACE} />
      {children}
    </g>
  );
}

/** Dải giả lập một dòng chữ. */
function Line({ x, y, w, h = 5, o = 0.35, fill = INK }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} opacity={o} />;
}

/** Khối chữ nhật đặc (ảnh, thẻ). */
function Box({ x, y, w, h, r = 6, fill = SURFACE, stroke }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />;
}

/** Nút bấm có chữ. */
function Btn({ x, y, w, h = 20, label, tone = "solid" }) {
  const solid = tone === "solid";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={solid ? AX : SURFACE} stroke={solid ? "none" : LINE} strokeWidth="1" />
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="600" fill={solid ? "#fff" : INK}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Chữ nhỏ. */
function Txt({ x, y, children, size = 8, weight = 500, fill = INK, anchor = "start", opacity = 1 }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} opacity={opacity}>
      {children}
    </text>
  );
}

/** Chấm số chỉ chỗ — khớp với các bước viết bên cạnh hình. */
function Pin({ x, y, n }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill={AX} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{n}</text>
    </g>
  );
}

/* ------------------------------------------------------------------- cảnh vẽ */

const SCENES = {
  /** Màn hình đăng nhập bằng Google. */
  login: (
    <>
      <Phone x={95} y={5} h={200}>
        <Txt x={70} y={46} anchor="middle" size={11} weight={700}>Hugo Studio</Txt>
        <Txt x={70} y={60} anchor="middle" size={7} fill={DIM}>Đăng nhập để tiếp tục</Txt>
        <Box x={22} y={80} w={106} h={26} r={13} stroke={LINE} />
        <circle cx="40" cy="93" r="6" fill={AX} opacity="0.9" />
        <Txt x={54} y={96} size={8} weight={600}>Tiếp tục với Google</Txt>
        <Line x={30} y={124} w={90} o={0.18} />
        <Line x={40} y={136} w={70} o={0.18} />
        <Box x={22} y={170} w={106} h={22} r={11} fill={BG} stroke={LINE} />
        <Txt x={75} y={184} anchor="middle" size={7} fill={DIM}>Xem trang công khai</Txt>
      </Phone>
      <Pin x={110} y={93} n={1} />
      <Txt x={20} y={100} size={9} weight={600}>Một nút duy nhất</Txt>
      <Txt x={20} y={114} size={8} fill={DIM}>Không có ô mật khẩu</Txt>
      <Txt x={20} y={126} size={8} fill={DIM}>vì hệ thống không tạo</Txt>
      <Txt x={20} y={138} size={8} fill={DIM}>mật khẩu riêng cho bạn.</Txt>
    </>
  ),

  /** Bật đăng nhập bằng khoá thiết bị. */
  passkey: (
    <>
      <Phone x={20} y={5} w={140} h={185}>
        <Txt x={20} y={40} size={10} weight={700}>Cài đặt</Txt>
        <Box x={14} y={52} w={112} h={30} stroke={LINE} />
        <Txt x={24} y={65} size={8} weight={600}>Đăng nhập nhanh</Txt>
        <Txt x={24} y={76} size={7} fill={DIM}>Vân tay hoặc khuôn mặt</Txt>
        <rect x="98" y="61" width="22" height="13" rx="6.5" fill={AX} />
        <circle cx="114" cy="67.5" r="5" fill="#fff" />
        <Box x={14} y={90} w={112} h={24} stroke={LINE} />
        <Txt x={24} y={105} size={8} fill={DIM}>Thông báo</Txt>
        <Box x={14} y={122} w={112} h={24} stroke={LINE} />
        <Txt x={24} y={137} size={8} fill={DIM}>Ngôn ngữ</Txt>
      </Phone>
      <Pin x={128} y={67} n={1} />

      <Phone x={200} y={5} w={140} h={185}>
        <Box x={24} y={60} w={92} h={110} r={12} stroke={LINE} />
        <circle cx="70" cy="102" r="20" fill={AX} opacity="0.12" />
        <path d="M62 110c0-10 3-16 8-16s8 6 8 16M66 110c0-8 1-12 4-12s4 4 4 12M70 110v-8" stroke={AX} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Txt x={70} y={140} anchor="middle" size={8} weight={600}>Xác nhận danh tính</Txt>
        <Txt x={70} y={152} anchor="middle" size={7} fill={DIM}>Chạm cảm biến vân tay</Txt>
      </Phone>
      <Pin x={288} y={102} n={2} />
      <Txt x={200} y={196} size={7} fill={DIM}>Vân tay ở lại trong máy, không gửi lên máy chủ.</Txt>
    </>
  ),

  /** Từ trình soạn Bio ra trang Bio công khai. */
  bioEditor: (
    <>
      <Window x={0} y={5} w={200} h={185}>
        <Txt x={14} y={40} size={9} weight={700}>Chỉnh trang Bio</Txt>
        <Txt x={14} y={58} size={7} fill={DIM}>Tên hiển thị</Txt>
        <Box x={14} y={62} w={172} h={16} r={5} fill={BG} />
        <Line x={20} y={68} w={60} o={0.4} />
        <Txt x={14} y={92} size={7} fill={DIM}>Mô tả ngắn</Txt>
        <Box x={14} y={96} w={172} h={26} r={5} fill={BG} />
        <Line x={20} y={103} w={140} o={0.3} />
        <Line x={20} y={112} w={100} o={0.3} />
        <Txt x={14} y={136} size={7} fill={DIM}>Liên kết</Txt>
        <Box x={14} y={140} w={82} h={16} r={5} fill={BG} />
        <Box x={104} y={140} w={82} h={16} r={5} fill={BG} />
        <Btn x={14} y={164} w={60} h={16} label="Lưu" />
      </Window>
      <Pin x={16} y={70} n={1} />
      <Pin x={16} y={104} n={2} />
      <Pin x={16} y={148} n={3} />

      <path d="M208 100h22m0 0-6-5m6 5-6 5" stroke={DIM} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      <Phone x={240} y={5} w={130} h={185}>
        <circle cx="65" cy="46" r="16" fill={AX} opacity="0.25" />
        <Txt x={65} y={74} anchor="middle" size={9} weight={700}>Tên của bạn</Txt>
        <Line x={30} y={82} w={70} o={0.25} />
        <Box x={18} y={96} w={94} h={18} r={9} fill={SURFACE} stroke={LINE} />
        <Txt x={65} y={108} anchor="middle" size={7} fill={DIM}>Liên kết 1</Txt>
        <Box x={18} y={120} w={94} h={18} r={9} fill={SURFACE} stroke={LINE} />
        <Txt x={65} y={132} anchor="middle" size={7} fill={DIM}>Liên kết 2</Txt>
        <Box x={18} y={144} w={94} h={18} r={9} fill={SURFACE} stroke={LINE} />
        <Txt x={65} y={156} anchor="middle" size={7} fill={DIM}>Liên kết 3</Txt>
      </Phone>
      <Txt x={240} y={198} size={7} fill={DIM}>Trang công khai bạn gửi cho người khác</Txt>
    </>
  ),

  /** Ví JOY: số dư, lịch sử, mã QR. */
  joy: (
    <>
      <Phone x={20} y={5} w={140} h={178}>
        <Box x={14} y={34} w={112} h={52} r={10} fill={AX} />
        <Txt x={24} y={50} size={7} fill="#fff" opacity={0.75}>Số dư JOY</Txt>
        <Txt x={24} y={70} size={17} weight={700} fill="#fff">1.240</Txt>
        <Txt x={20} y={102} size={7} fill={DIM}>LỊCH SỬ</Txt>
        {[0, 1, 2].map((row) => (
          <g key={row}>
            <Line x={20} y={112 + row * 20} w={54} o={0.35} />
            <Line x={20} y={121 + row * 20} w={34} o={0.18} h={4} />
            <Txt x={122} y={119 + row * 20} anchor="end" size={8} weight={600} fill={row === 1 ? "#EF4444" : "#22C55E"}>
              {row === 1 ? "−80" : "+25"}
            </Txt>
          </g>
        ))}
      </Phone>
      <Pin x={128} y={55} n={1} />
      <Pin x={128} y={118} n={2} />

      <Phone x={210} y={5} w={140} h={178}>
        <Txt x={70} y={44} anchor="middle" size={9} weight={700}>Mã nhận JOY</Txt>
        <Box x={35} y={56} w={70} h={70} r={8} fill="#fff" stroke={LINE} />
        {Array.from({ length: 36 }, (_, index) => {
          const col = index % 6;
          const row = Math.floor(index / 6);
          return (index * 5 + col * 3) % 5 < 2 ? (
            <rect key={index} x={42 + col * 10} y={63 + row * 10} width="8" height="8" rx="1" fill="#111" />
          ) : null;
        })}
        <Box x={35} y={136} w={70} h={16} r={8} fill={BG} />
        <Txt x={70} y={147} anchor="middle" size={7} fill={DIM}>Còn hiệu lực 02:00</Txt>
      </Phone>
      <Pin x={112} y={91} n={3} />
      <Txt x={210} y={196} size={7} fill={DIM}>Mã hết hạn nhanh — tạo mới khi cần.</Txt>
    </>
  ),

  /** Cài lên máy: iPhone và Android. */
  install: (
    <>
      <Txt x={20} y={16} size={9} weight={700}>iPhone · Safari</Txt>
      <Phone x={20} y={24} w={140} h={175}>
        <Box x={14} y={16} w={112} h={80} r={8} fill={SURFACE} stroke={LINE} />
        <Txt x={24} y={116} size={8} weight={600}>Thêm vào MH chính</Txt>
        <rect x="104" y="106" width="14" height="14" rx="3" fill={AX} opacity="0.25" />
        <Line x={24} y={132} w={70} o={0.2} />
        <Line x={24} y={146} w={84} o={0.2} />
        <rect x="46" y="158" width="48" height="4" rx="2" fill={LINE} />
      </Phone>
      <Pin x={148} y={137} n={2} />
      <g transform="translate(76 208)">
        <path d="M8 12V2m0 0L4 6m4-4 4 4M2 10v6h12v-6" stroke={AX} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Pin x={70} y={216} n={1} />
      <Txt x={96} y={220} size={7} fill={DIM}>Nút Chia sẻ ở thanh dưới</Txt>

      <Txt x={210} y={16} size={9} weight={700}>Android · Chrome</Txt>
      <Phone x={210} y={24} w={140} h={175}>
        <circle cx="118" cy="26" r="1.6" fill={INK} />
        <circle cx="118" cy="31" r="1.6" fill={INK} />
        <circle cx="118" cy="36" r="1.6" fill={INK} />
        <Box x={54} y={42} w={72} h={62} r={7} fill={SURFACE} stroke={LINE} />
        <Line x={62} y={54} w={40} o={0.2} />
        <Line x={62} y={68} w={48} o={0.2} />
        <Txt x={62} y={88} size={7} weight={600} fill={AX}>Cài đặt ứng dụng</Txt>
        <Line x={62} y={96} w={36} o={0.2} />
      </Phone>
      <Pin x={340} y={55} n={1} />
      <Pin x={340} y={110} n={2} />
      <Txt x={210} y={216} size={7} fill={DIM}>Menu ba chấm → Cài đặt ứng dụng</Txt>
    </>
  ),

  /** Hai lớp cho phép thông báo. */
  notifications: (
    <>
      <Phone x={30} y={5} w={140} h={160}>
        <Txt x={20} y={40} size={10} weight={700}>Cài đặt</Txt>
        <Box x={14} y={52} w={112} h={30} stroke={LINE} />
        <Txt x={24} y={65} size={8} weight={600}>Thông báo đẩy</Txt>
        <Txt x={24} y={76} size={7} fill={DIM}>Nhắc lịch, chuỗi ngày</Txt>
        <rect x="98" y="61" width="22" height="13" rx="6.5" fill={AX} />
        <circle cx="114" cy="67.5" r="5" fill="#fff" />
      </Phone>
      <Pin x={128} y={67} n={1} />

      <path d="M180 100h22m0 0-6-5m6 5-6 5" stroke={DIM} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      <Phone x={215} y={5} w={140} h={160}>
        <Box x={16} y={62} w={108} h={78} r={10} fill={SURFACE} stroke={LINE} />
        <Txt x={70} y={82} anchor="middle" size={8} weight={600}>Cho phép thông báo?</Txt>
        <Line x={34} y={92} w={72} o={0.2} />
        <Btn x={26} y={108} w={40} h={18} label="Chặn" tone="ghost" />
        <Btn x={74} y={108} w={40} h={18} label="Cho phép" />
      </Phone>
      <Pin x={352} y={117} n={2} />
      <Txt x={215} y={196} size={7} fill={DIM}>Phải đồng ý cả hai lớp mới nhận được.</Txt>
    </>
  ),

  /** Nhật ký giấc ngủ và biểu đồ tuần. */
  sleep: (
    <>
      <Phone x={30} y={5} w={140} h={180}>
        <Txt x={20} y={40} size={10} weight={700}>Đêm qua</Txt>
        <Box x={14} y={50} w={54} h={34} r={8} stroke={LINE} />
        <Txt x={22} y={64} size={6} fill={DIM}>NGỦ LÚC</Txt>
        <Txt x={22} y={77} size={10} weight={700}>23:40</Txt>
        <Box x={72} y={50} w={54} h={34} r={8} stroke={LINE} />
        <Txt x={80} y={64} size={6} fill={DIM}>DẬY LÚC</Txt>
        <Txt x={80} y={77} size={10} weight={700}>06:20</Txt>
        <Txt x={20} y={102} size={7} fill={DIM}>Chất lượng</Txt>
        {[0, 1, 2, 3, 4].map((star) => (
          <path
            key={star}
            transform={`translate(${20 + star * 16} 108) scale(0.5)`}
            d="M10 0l3 6.5 7 1-5 5 1.2 7L10 16l-6.2 3.5L5 12.5l-5-5 7-1z"
            fill={star < 4 ? AX : LINE}
          />
        ))}
        <Txt x={20} y={140} size={7} fill={DIM}>Tâm trạng</Txt>
        <Box x={14} y={146} w={112} h={20} r={10} fill={BG} />
      </Phone>
      <Pin x={158} y={64} n={1} />
      <Pin x={158} y={112} n={2} />

      <Window x={210} y={30} w={150} h={140}>
        <Txt x={14} y={40} size={8} weight={600}>Tuần này</Txt>
        {[38, 52, 44, 62, 30, 58, 66].map((value, index) => (
          <g key={index}>
            <rect x={14 + index * 19} y={116 - value} width="12" height={value} rx="3" fill={AX} opacity={index === 6 ? 1 : 0.35} />
            <Txt x={20 + index * 19} y={128} anchor="middle" size={6} fill={DIM}>{["2", "3", "4", "5", "6", "7", "CN"][index]}</Txt>
          </g>
        ))}
      </Window>
      <Pin x={356} y={64} n={3} />
    </>
  ),

  /** Bốn bước từ xem giá tới thanh toán. */
  booking: (
    <>
      {[
        { label: "Xem bảng giá", icon: "list" },
        { label: "Đặt lịch", icon: "cal" },
        { label: "Chốt phạm vi", icon: "chat" },
        { label: "Thanh toán", icon: "pay" },
      ].map((step, index) => {
        const x = 12 + index * 96;
        return (
          <g key={step.label}>
            <rect x={x} y={40} width="80" height="72" rx="12" fill={SURFACE} stroke={LINE} strokeWidth="1.2" />
            <circle cx={x + 40} cy={66} r="15" fill={AX} opacity="0.12" />
            {step.icon === "list" && <path d={`M${x + 32} 62h16M${x + 32} 68h16M${x + 32} 74h10`} stroke={AX} strokeWidth="1.8" strokeLinecap="round" />}
            {step.icon === "cal" && (
              <g stroke={AX} strokeWidth="1.6" fill="none">
                <rect x={x + 30} y={58} width="20" height="17" rx="3" />
                <path d={`M${x + 30} 63h20M${x + 35} 55v5M${x + 45} 55v5`} strokeLinecap="round" />
              </g>
            )}
            {step.icon === "chat" && <path d={`M${x + 29} 60h22v13h-9l-5 5v-5h-8z`} stroke={AX} strokeWidth="1.6" fill="none" strokeLinejoin="round" />}
            {step.icon === "pay" && (
              <g stroke={AX} strokeWidth="1.6" fill="none">
                <rect x={x + 28} y={59} width="24" height="16" rx="3" />
                <path d={`M${x + 28} 65h24`} />
              </g>
            )}
            <Txt x={x + 40} y={100} anchor="middle" size={8} weight={600}>{step.label}</Txt>
            <circle cx={x + 12} cy={52} r="8" fill={AX} />
            <text x={x + 12} y={55.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{index + 1}</text>
            {index < 3 && (
              <path d={`M${x + 84} 76h8m0 0-4-3m4 3-4 3`} stroke={DIM} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      })}
      <Txt x={12} y={132} size={7} fill={DIM}>Buổi trao đổi đầu tiên không tính phí. Giá và phạm vi chốt bằng văn bản trước khi bắt đầu.</Txt>
    </>
  ),

  /** Bản đồ các tab trong khu vực thành viên. */
  tabs: (
    <>
      <Phone x={130} y={5} w={150} h={250}>
        <Txt x={20} y={38} size={11} weight={700}>Xin chào</Txt>
        <Box x={14} y={48} w={122} h={40} r={10} stroke={LINE} />
        <Line x={24} y={60} w={60} o={0.3} />
        <Line x={24} y={72} w={90} o={0.18} />
        <Box x={14} y={96} w={58} h={46} r={10} stroke={LINE} />
        <Box x={78} y={96} w={58} h={46} r={10} stroke={LINE} />
        <Box x={14} y={150} w={122} h={40} r={10} stroke={LINE} />
        <rect x="6" y="212" width="138" height="42" rx="12" fill={SURFACE} />
        {["Nhà", "Bio", "Ví", "Học", "Thêm"].map((label, index) => (
          <g key={label}>
            <circle cx={20 + index * 27} cy={228} r="7" fill={index === 0 ? AX : LINE} opacity={index === 0 ? 1 : 0.5} />
            <Txt x={20 + index * 27} y={246} anchor="middle" size={6} fill={index === 0 ? INK : DIM}>{label}</Txt>
          </g>
        ))}
      </Phone>
      <Pin x={122} y={228} n={1} />
      <Txt x={12} y={120} size={9} weight={600}>Thanh tab dưới đáy</Txt>
      <Txt x={12} y={134} size={8} fill={DIM}>Là chỗ chuyển giữa các</Txt>
      <Txt x={12} y={146} size={8} fill={DIM}>khu vực chính.</Txt>
      <Txt x={290} y={120} size={9} weight={600}>Mở một app</Txt>
      <Txt x={290} y={134} size={8} fill={DIM}>Thanh tab tự ẩn để</Txt>
      <Txt x={290} y={146} size={8} fill={DIM}>app chiếm trọn màn.</Txt>
    </>
  ),
};

const VIEWBOX = {
  login: "0 0 380 210",
  passkey: "0 0 360 210",
  bioEditor: "0 0 380 205",
  joy: "0 0 370 205",
  install: "0 0 370 232",
  notifications: "0 0 370 205",
  sleep: "0 0 380 195",
  booking: "0 0 380 145",
  tabs: "0 0 380 262",
};

/** Hình minh hoạ theo tên cảnh. */
export default function GuideArt({ kind, className = "" }) {
  const scene = SCENES[kind];
  if (!scene) return null;
  return (
    <svg viewBox={VIEWBOX[kind] || "0 0 380 210"} className={`block h-auto w-full ${className}`} role="img" aria-hidden="true">
      {scene}
    </svg>
  );
}
