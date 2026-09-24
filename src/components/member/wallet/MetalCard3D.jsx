import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { nom } from "../../../lib/nomText";
import JsBarcode from "jsbarcode";
import { useJoy } from "../../../lib/joyDisplay";
import { hapticSelect } from "../../../utils/haptics";
import JoyAmount from "../shared/JoyAmount";
import { memberTier } from "../../../lib/memberTier";

// 4 bảng màu chuẩn theo chính sách các hạng thành viên:
// 1. Star-18: Vàng nghệ rực rỡ + đốm xanh cobalt & đen organic
// 2. Star-14: Hồng pastel mềm mại + nét xanh cobalt & đen
// 3. Star-VIP: Trắng ngọc trai / Platinum tinh khôi + đốm hồng & viền bạc sang trọng
// 4. Tiêu chuẩn / Edu: Xanh hoàng gia cobalt + vết lá đỏ rực & trắng
const THEMES                    = [
  {
    id: "star18",
    name: "Star-18",
    subLabel: "Thành viên 18 - 23 tuổi",
    dotColor: "#FFB800",
    bg: "#FFB800",
    textColor: "#09090B",
    subtextColor: "#27272A",
    glyphColor: "#09090B",
    backBg: "#FFB800",
    backTextColor: "#09090B",
    // Số dư nằm trên mảng màu đen góc dưới phải nên dùng chữ trắng sáng chống chìm
    balanceTextColor: "#FFFFFF",
    balanceSubtextColor: "#D4D4D8",
    balanceJoyColor: "#FFB800",
    lockHint: "Dành riêng cho thành viên 18 đến hết tháng sinh nhật 23 tuổi",
    svgBackground: (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 290" preserveAspectRatio="none">
        <rect width="460" height="290" fill="#FFB800" />
        {/* Splash xanh cobalt góc trên trái */}
        <path d="M 0 0 C 70 0, 120 20, 135 60 C 105 85, 30 75, 0 85 Z" fill="#2563EB" />
        {/* Sóng trắng cắt qua góc trên trái */}
        <path d="M 50 0 C 85 15, 135 25, 175 60 C 190 85, 160 115, 120 100 C 90 90, 80 60, 50 35 C 30 15, 0 20, 0 0 Z" fill="#FFFFFF" />
        {/* Khối cong đen góc dưới phải chuẩn ảnh */}
        <path d="M 230 290 C 270 205, 340 175, 460 195 L 460 290 Z" fill="#18181B" />
        {/* Cánh hoa xanh cobalt bên trong góc đen */}
        <path d="M 370 230 C 400 195, 435 220, 440 270 C 405 275, 380 255, 370 230 Z" fill="#2563EB" />
      </svg>
    ),
  },
  {
    id: "star14",
    name: "Star-14",
    subLabel: "Thành viên 14 - 17 tuổi",
    dotColor: "#F472B6",
    bg: "#FCE7F3",
    textColor: "#18181B",
    subtextColor: "#3F3F46",
    glyphColor: "#18181B",
    backBg: "#FCE7F3",
    backTextColor: "#18181B",
    balanceTextColor: "#18181B",
    balanceSubtextColor: "#3F3F46",
    balanceJoyColor: "#2563EB",
    lockHint: "Dành riêng cho thành viên học sinh 14 - 17 tuổi",
    svgBackground: (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 290" preserveAspectRatio="none">
        <rect width="460" height="290" fill="#FCE7F3" />
        {/* Sóng trắng quét ngang */}
        <path d="M 0 150 C 140 130, 240 70, 460 170 L 460 0 L 0 0 Z" fill="#FFFFFF" />
        {/* Mảng hồng phấn mềm */}
        <path d="M 0 0 C 80 40, 140 120, 180 290 L 0 290 Z" fill="#FBCFE8" />
        {/* Vòng cung xanh cobalt mảnh góc trên phải */}
        <circle cx="390" cy="90" r="40" fill="none" stroke="#2563EB" strokeWidth="3.5" />
        {/* Đốm đen nghệ thuật đáy */}
        <path d="M 200 290 C 240 265, 275 275, 295 290 Z" fill="#18181B" />
      </svg>
    ),
  },
  {
    id: "starVip",
    name: "Star-VIP",
    subLabel: "Thành viên danh dự",
    dotColor: "#E2E8F0",
    bg: "#FFFFFF",
    textColor: "#0F172A",
    subtextColor: "#475569",
    glyphColor: "#0F172A",
    backBg: "#F8FAFC",
    backTextColor: "#0F172A",
    balanceTextColor: "#0F172A",
    balanceSubtextColor: "#475569",
    balanceJoyColor: "#0F172A",
    lockHint: "Hạng thẻ danh dự chỉ do Hugo Studio cấp tặng",
    svgBackground: (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 290" preserveAspectRatio="none">
        <rect width="460" height="290" fill="#FFFFFF" />
        {/* Đốm hồng phấn mềm mại ở đỉnh giữa */}
        <ellipse cx="230" cy="20" rx="90" ry="60" fill="#FCE7F3" />
        {/* Sóng bạc nhẹ nhàng phía đáy */}
        <path d="M 0 220 C 120 200, 240 250, 460 210 L 460 290 L 0 290 Z" fill="#F1F5F9" />
        {/* Nét viền ánh bạc tinh tế */}
        <circle cx="380" cy="200" r="50" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "eco",
    name: "Eco",
    subLabel: "Thành viên Eco Hugo Studio",
    dotColor: "#2563EB",
    bg: "#2563EB",
    textColor: "#FFFFFF",
    subtextColor: "#BFDBFE",
    glyphColor: "#FFFFFF",
    backBg: "#1D4ED8",
    backTextColor: "#FFFFFF",
    balanceTextColor: "#FFFFFF",
    balanceSubtextColor: "#BFDBFE",
    balanceJoyColor: "#FFFFFF",
    lockHint: "Dành cho thành viên trên 23 tuổi hoặc dùng thử nghiệm",
    svgBackground: (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 290" preserveAspectRatio="none">
        <rect width="460" height="290" fill="#2563EB" />
        {/* Cánh hoa đỏ rực rỡ bên phải */}
        <path d="M 330 70 C 370 20, 430 40, 460 100 C 430 140, 360 120, 330 70 Z" fill="#EF4444" />
        <path d="M 390 120 C 420 100, 450 140, 460 190 C 410 190, 390 160, 390 120 Z" fill="#EF4444" />
        {/* Vòng trắng và đường cong ở góc trên trái theo đúng mẫu thiết kế, không đè lên chữ ECO */}
        <circle cx="55" cy="45" r="14" fill="#FFFFFF" />
        <path d="M 55 31 C 55 10, 95 10, 95 55" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      </svg>
    ),
  },
];

/**
 * KHỔ VẼ CỦA THẺ — cố định, không đổi theo màn hình.
 *
 * 460×290 là tỷ lệ thẻ ID-1 theo ISO/IEC 7810 (85,6 × 53,98 mm → 1,586), đúng
 * tỷ lệ của thẻ ngân hàng cầm trên tay. Mọi con chữ, khoảng đệm và mã vạch bên
 * trong được vẽ theo đúng khổ này.
 */
const CARD_W = 460;
const CARD_H = 290;

/**
 * Tỷ lệ thu nhỏ để thẻ vừa khít bề ngang đang có.
 *
 * ── VÌ SAO KHÔNG DÙNG BREAKPOINT ────────────────────────────────────────────
 * Trước đây cỡ chữ trong thẻ đổi theo `sm:` — tức theo bề ngang MÀN HÌNH, thứ
 * chẳng liên quan gì tới bề ngang THẺ. Trên desktop thẻ nằm trong một cột hẹp
 * (5/12) nhưng vẫn lấy cỡ chữ của tablet, nên chữ tràn và tỷ lệ sai; trên điện
 * thoại thì ngược lại. Vẽ nguyên khổ rồi thu cả khối thì mọi tỷ lệ bên trong
 * đúng tuyệt đối ở mọi bề ngang — đúng như thu nhỏ một tấm thẻ thật.
 */
function useCardScale() {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  // useLayoutEffect chứ không useEffect: đo sau khung đầu thì thẻ loé lên ở khổ
  // 460px rồi mới thu lại — trên cột hẹp đó là một cú giật rất rõ.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const measure = () => {
      const width = box.clientWidth;
      // Không bao giờ PHÓNG TO quá khổ gốc: mã vạch và viền kim loại vẽ cho
      // 460px, kéo to hơn chỉ làm chúng mờ.
      if (width > 0) setScale(Math.min(width / CARD_W, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return [boxRef, scale];
}

export default function MetalCard3D({
  balance,
  cardholderName,
  referralCode,
  bio,
  onCopyCode,
  copied,
  activeTier,
  onTierChange,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [boxRef, scale] = useCardScale();
  const joy = useJoy();
  const barcodeRef = useRef(null);

  // Suy ra hạng từ chính sách hệ thống (Star-18, Star-14, Star-VIP hoặc Eco)
  const policyTier = useMemo(() => {
    const t = memberTier(bio);
    if (t === "star18") return "star18";
    if (t === "star14") return "star14";
    if (t === "starVip") return "starVip";
    return "eco";
  }, [bio]);

  const [internalThemeId, setInternalThemeId] = useState(policyTier);
  const selectedThemeId = activeTier || internalThemeId;
  const setSelectedThemeId = (id) => {
    setInternalThemeId(id);
    onTierChange?.(id);
  };

  // Cập nhật khi bio thay đổi
  useEffect(() => {
    setInternalThemeId(policyTier);
  }, [policyTier]);

  // Kiểm tra xem hạng đang xem có phải là hạng thực tế của thành viên hay không
  const isTierUnlocked = selectedThemeId === policyTier;

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedThemeId) || THEMES[0],
    [selectedThemeId]
  );

  const cleanCode = referralCode?.trim() || "JOY-MEMBER";

  // Tính ngày hết hạn EXP Date theo quy tắc chính sách hệ thống
  const tierExp = useMemo(() => {
    // 1. Star-VIP: Hạng danh dự do admin cấp -> Vô hạn / Vĩnh viễn
    if (selectedThemeId === "starVip" || bio?.starVip) {
      return { text: nom("VĨNH VIỄN"), hint: nom("Hạng danh dự trọn đời do Hugo Studio cấp") };
    }

    // 2. Star-14: Từ 14 đến đúng ngày sinh nhật năm 18 tuổi
    if (selectedThemeId === "star14") {
      const birthYear = Number(bio?.birthYear);
      const birthMonth = Number(bio?.birthMonth) || 12;
      const birthDay = Number(bio?.birthDay);
      if (birthYear && birthYear > 1900) {
        const expYear = birthYear + 18;
        const mm = String(birthMonth).padStart(2, "0");
        const yy = String(expYear).slice(-2);
        if (birthDay && birthDay >= 1 && birthDay <= 31) {
          const dd = String(birthDay).padStart(2, "0");
          return { text: `${dd}/${mm}/${yy}`, hint: `Hết hạn đúng ngày sinh nhật 18 tuổi (${dd}/${mm}/${expYear})` };
        }
        return { text: `${mm}/${yy}`, hint: `Hết hạn khi đủ 18 tuổi (${mm}/${expYear})` };
      }
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear() + 3).slice(-2);
      return { text: `${mm}/${yy}`, hint: nom("Hết hạn khi đủ 18 tuổi") };
    }

    // 3. Star-18: Từ 18 đến hết tháng sinh nhật năm 23 tuổi
    if (selectedThemeId === "star18") {
      const birthYear = Number(bio?.birthYear);
      const birthMonth = Number(bio?.birthMonth) || 12;
      if (birthYear && birthYear > 1900) {
        const expYear = birthYear + 23;
        const mm = String(birthMonth).padStart(2, "0");
        const yy = String(expYear).slice(-2);
        // Hết ngày cuối cùng của tháng sinh nhật năm 23 tuổi
        const lastDay = new Date(expYear, birthMonth, 0).getDate();
        const dd = String(lastDay).padStart(2, "0");
        return { text: `${dd}/${mm}/${yy}`, hint: `Hết hạn khi hết tháng sinh nhật 23 tuổi (${dd}/${mm}/${expYear})` };
      }
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear() + 4).slice(-2);
      return { text: `${mm}/${yy}`, hint: nom("Hết hạn khi hết tháng sinh nhật 23 tuổi") };
    }

    // 4. Eco: Dành cho trên 23 tuổi hoặc dùng thử nghiệm
    // Nếu chưa xác minh: hạn 30 ngày, gắn đủ ngày/tháng
    const isTrial = !bio?.birthYear;
    if (isTrial) {
      const created = bio?.createdAt ? new Date(bio.createdAt) : new Date();
      const expDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
      const dd = String(expDate.getDate()).padStart(2, "0");
      const mm = String(expDate.getMonth() + 1).padStart(2, "0");
      const yy = String(expDate.getFullYear()).slice(-2);
      return { text: `${dd}/${mm}/${yy}`, hint: `Hạn dùng thử 30 ngày (đến hết ${dd}/${mm}/${expDate.getFullYear()})` };
    }

    // Đối với > 23 tuổi: dùng hạn đến hết ngày kết thúc hạn BIO tài khoản (bio.expiresAt)
    if (bio?.expiresAt) {
      const expDate = new Date(bio.expiresAt);
      const dd = String(expDate.getDate()).padStart(2, "0");
      const mm = String(expDate.getMonth() + 1).padStart(2, "0");
      const yy = String(expDate.getFullYear()).slice(-2);
      return { text: `${dd}/${mm}/${yy}`, hint: `Theo ngày hết hạn Bio tài khoản (hết ${dd}/${mm}/${expDate.getFullYear()})` };
    }

    // Dự phòng khi Bio chưa lưu expiresAt: chu kỳ thường niên 1 năm
    const created = bio?.createdAt ? new Date(bio.createdAt) : new Date();
    const expDate = new Date(created.getTime() + 365 * 24 * 60 * 60 * 1000);
    const dd = String(expDate.getDate()).padStart(2, "0");
    const mm = String(expDate.getMonth() + 1).padStart(2, "0");
    const yy = String(expDate.getFullYear()).slice(-2);
    return { text: `${dd}/${mm}/${yy}`, hint: `Theo ngày hết hạn Bio tài khoản (hết ${dd}/${mm}/${expDate.getFullYear()})` };
  }, [selectedThemeId, bio]);

  // Vẽ mã vạch chuẩn Code 128 (Đa năng: chuyển JOY, tra cứu thông tin hệ thống, admin)
  useEffect(() => {
    if (barcodeRef.current && cleanCode) {
      try {
        JsBarcode(barcodeRef.current, cleanCode, {
          format: "CODE128",
          width: 1.6,
          height: 42,
          displayValue: true,
          fontSize: 12,
          font: "monospace",
          fontOptions: "bold",
          textMargin: 3,
          background: "#ffffff",
          lineColor: "#09090b",
          margin: 4,
        });
      } catch (err) {
        console.error("Barcode render error:", err);
      }
    }
  }, [cleanCode, isFlipped]);

  const handleCardClick = () => {
    hapticSelect();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      {/* BA lớp, mỗi lớp đúng một việc. Gộp lại thì hỏng:
          ĐO   — chiếm bề ngang có sẵn, cao theo tỷ lệ thẻ sau khi thu.
          THU  — khối 460×290 thu nhỏ. Phải là một div RIÊNG, không mang
                 `preserve-3d`: đặt `scale()` lên chính phần tử giữ ngữ cảnh 3D
                 sẽ làm phẳng nó và cả hai mặt thẻ biến mất (đã gặp).
          LẬT  — nơi duy nhất có preserve-3d + rotateY, y như trước. */}
      <div
        ref={boxRef}
        className="w-full max-w-[460px] relative cursor-pointer"
        style={{ height: CARD_H * scale }}
        onClick={handleCardClick}
      >
        <div
          style={{
            width: CARD_W,
            height: CARD_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            perspective: "1200px",
          }}
        >
        <div
          className="w-full h-full relative transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ══════════════════════════════════════════════════════════════
              MẶT TRƯỚC (FRONT)
              - Giữa: Tên loại hạng thành viên (hoặc Khóa nếu không phải hạng của mình)
              - Dưới phải: Số dư JOY hiện tại (thay cho EXP date to)
              - Dưới trái: Tên chủ thẻ, ID và EXP date nhỏ
              ══════════════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 w-full h-full rounded-[34px] p-7 overflow-hidden shadow-2xl flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              // Lỗi đã sửa (2026-09-24): WebKit BỎ QUA backface-visibility khi
              // phần tử có cả border-radius lẫn overflow:hidden — mặt sau lộ
              // chữ mặt trước chồng lên, rõ nhất ở PWA standalone. Ép phần tử
              // ra một lớp kết xuất GPU riêng thì WebKit mới tôn trọng đúng.
              WebkitTransform: "translateZ(0)",
              willChange: "transform",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12) inset",
            }}
          >
            {/* Vector nghệ thuật trừu tượng từng hạng thành viên */}
            {currentTheme.svgBackground}

            {/* Hàng 1: Biểu tượng 2 vòng tròn lồng nhau góc trên phải */}
            <div className="relative z-10 flex items-center justify-end">
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full shadow-sm"
                  style={{ backgroundColor: currentTheme.glyphColor }}
                />
                <div
                  className="w-8 h-8 rounded-full -ml-4 border-[2.5px] shadow-sm"
                  style={{ borderColor: currentTheme.glyphColor }}
                />
              </div>
            </div>

            {/* Hàng 2: TÊN LOẠI HẠNG THÀNH VIÊN Ở GIỮA THẺ (CÓ Ổ KHÓA NẾU KHÔNG PHẢI HẠNG CỦA MÌNH) */}
            {!isTierUnlocked ? (
              <div className="relative z-20 my-auto flex flex-col items-center justify-center p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xl mx-auto max-w-[240px]">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 shadow-inner">
                  <span className="material-symbols-outlined text-2xl text-white">lock</span>
                </div>
                <h4 className="text-base font-black font-mono tracking-wider uppercase m-0 text-center text-white">
                  {currentTheme.name}
                </h4>
                <span className="text-[12px] font-bold text-amber-300 mt-0.5 tracking-wider uppercase text-center">{nom(nom("Hạng chưa mở khóa"))}</span>
                <span className="text-[13px] text-white/75 mt-0.5 text-center leading-snug">
                  {nom(currentTheme.lockHint)}
                </span>
              </div>
            ) : (
              <div className="relative z-10 my-auto text-left">
                <h3
                  className="text-5xl font-black font-mono tracking-tight uppercase m-0 leading-none"
                  style={{ color: currentTheme.textColor }}
                >
                  {currentTheme.name}
                </h3>
                <p
                  className="text-sm font-bold opacity-80 uppercase tracking-wider mt-1.5 m-0"
                  style={{ color: currentTheme.subtextColor }}
                >
                  {nom(currentTheme.subLabel)}
                </p>
              </div>
            )}

            {/* Hàng 3: trái là TẠP BÀI CHI CHỦ (卡牌之主 — chủ thẻ), ID và hạn
                thẻ; phải là số dư JOY hiện tại. */}
            <div className="relative z-10 flex items-end justify-between pt-2">
              <div className="text-left">
                <span
                  className="text-[12px] font-semibold block mb-0.5 tracking-wide uppercase"
                  style={{ color: currentTheme.subtextColor }}
                >{nom(nom("Tạp bài chi chủ"))}</span>
                <span
                  className="text-sm font-bold font-mono tracking-wider block uppercase"
                  style={{ color: currentTheme.textColor }}
                >
                  {cardholderName || nom("QUÝ THÀNH VIÊN")}
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span
                    className="text-[12px] font-mono font-semibold tracking-wider block"
                    style={{ color: currentTheme.subtextColor }}
                    title={tierExp.hint}
                  >
                    EXP: {tierExp.text}
                  </span>
                </div>
              </div>

              {/* SỐ JOY HIỆN TẠI THAY THẾ CHO EXP DATE (MÀU CHỐNG CHÌM TRÊN MỌI MẢNG NỀN) */}
              <div className="text-right">
                <span
                  className="text-xs font-semibold block mb-0.5 tracking-wide uppercase"
                  style={{
                    color: currentTheme.balanceSubtextColor || currentTheme.subtextColor,
                    textShadow: currentTheme.id === "star18" ? "0 1px 2px rgba(0,0,0,0.8)" : "none",
                  }}
                >{nom(nom("Số dư JOY"))}</span>
                <div className="flex items-baseline justify-end gap-1 font-mono">
                  <span
                    className="text-3xl font-black tracking-tight"
                    style={{
                      color: currentTheme.balanceTextColor || currentTheme.textColor,
                      textShadow: currentTheme.id === "star18" ? "0 2px 4px rgba(0,0,0,0.9)" : "none",
                    }}
                  >
                    <JoyAmount value={balance} />
                  </span>
                  <span
                    className="text-sm font-black"
                    style={{
                      color: currentTheme.balanceJoyColor || currentTheme.textColor,
                      opacity: currentTheme.id === "star18" ? 1 : 0.85,
                      textShadow: currentTheme.id === "star18" ? "0 2px 4px rgba(0,0,0,0.9)" : "none",
                    }}
                  >
                    JOY
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              MẶT SAU (BACK: BỐ CỤC CHUẨN THẺ ATM THEO ẢNH USER GỬI)
              - Nền: Đổi theo màu chủ đạo của thẻ
              - Trên: Dải từ tính đen ngang thẻ
              - Giữa: Dải trắng chứa MÃ VẠCH (Có số mã thành viên ở dưới)
              - Dưới: ID thành viên dập nổi + Các dòng chính sách quy định dùng thẻ
              ══════════════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 w-full h-full rounded-[34px] overflow-hidden shadow-2xl flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              // Cùng lỗi WebKit như mặt trước — xem chú thích ở đó. Mặt sau
              // còn phải giữ nguyên rotateY(180deg) làm mốc lật, translateZ(0)
              // chỉ CỘNG THÊM vào cùng transform chứ không thay thế nó.
              transform: "rotateY(180deg) translateZ(0)",
              WebkitTransform: "rotateY(180deg) translateZ(0)",
              willChange: "transform",
              backgroundColor: currentTheme.backBg,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12) inset",
            }}
          >
            {/* Dải từ tính đen bóng ATM (Magnetic Stripe) với ánh phản quang chéo */}
            <div className="w-full h-12 mt-5 bg-[#09090b] shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.15)_50%,transparent_60%)]" />
            </div>

            {/* DẢI TRẮNG CHỨA MÃ VẠCH ĐA NĂNG (Gôm mã QR vào thẳng mã vạch) */}
            <div className="px-6 my-auto">
              <div className="w-full p-2.5 rounded-xl bg-white shadow-md flex flex-col items-center justify-center overflow-hidden">
                <svg ref={barcodeRef} className="w-full max-h-12 overflow-visible" />
              </div>
            </div>

            {/* Khu vực đáy mặt sau: ID thành viên dập nổi & Các dòng chính sách dùng thẻ */}
            <div className="px-6 pb-4 pt-1 space-y-2 text-left">
              {/* ID thành viên phong cách thẻ ngân hàng dập nổi (thay cho .... .... .... NHHK) */}
              <div
                className="tracking-[0.25em] font-mono font-black text-base select-none"
                style={{
                  color: currentTheme.backTextColor || currentTheme.textColor,
                  textShadow:
                    (currentTheme.backTextColor || currentTheme.textColor) === "#FFFFFF"
                      ? "0 1px 2px rgba(0,0,0,0.6), 0 -1px 1px rgba(0,0,0,0.4)"
                      : "0 1px 1px rgba(255,255,255,0.8), 0 -1px 1px rgba(0,0,0,0.25)",
                }}
              >
                ID: {cleanCode}
              </div>

              {/* Các dòng chữ chính sách quy định về dùng thẻ */}
              <div
                className="space-y-1 text-[12px] leading-relaxed select-none"
                style={{ color: currentTheme.backTextColor || currentTheme.textColor }}
              >
                <p className="m-0 font-medium opacity-85">{nom(nom("Thẻ thành viên số thuộc quyền sở hữu của Hugo Studio. Mã vạch tích hợp định danh tài khoản, tra cứu hệ thống và thực hiện giao dịch chuyển nhận JOY bảo chứng."))}</p>
                <p className="m-0 font-medium opacity-75">{nom(nom("Quy định sử dụng tuân thủ Điều khoản dịch vụ Hugo Studio. Thẻ gắn liền tài khoản chính chủ, không chuyển nhượng."))}</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Thanh chọn màu theo chính sách các hạng thành viên */}
      <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
        {THEMES.map((t) => {
          const isActive = selectedThemeId === t.id;
          const isOwned = t.id === policyTier;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                hapticSelect();
                setSelectedThemeId(t.id);
              }}
              className={`px-3 py-1 rounded-full text-[13px] font-bold transition-all flex items-center gap-1.5 border ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-sm scale-105"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
              }`}
              title={`${nom(t.subLabel)} (${nom(isOwned ? "Hạng của bạn" : "Chưa mở khoá")})`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow-inner border border-black/10"
                style={{ backgroundColor: t.dotColor }}
              />
              <span>{t.name}</span>
              {!isOwned && (
                <span className="material-symbols-outlined text-[13px] opacity-70">lock</span>
              )}
              {isOwned && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">{nom(nom("Hiện tại"))}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
