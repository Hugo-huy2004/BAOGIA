import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Solid color tints — no gradients, no multi-color icons. Each utility gets
// one distinct hue so the grid reads as colorful without breaking Hugo
// Studio's "flat tint badge" convention used elsewhere (see ACCOUNT_SECTIONS).
const TINTS = {
  sky:     { badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400",       bar: "bg-sky-500" },
  indigo:  { badge: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500" },
  violet:  { badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
  rose:    { badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400",     bar: "bg-rose-500" },
  emerald: { badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  cyan:    { badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",     bar: "bg-cyan-500" },
  blue:    { badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400",     bar: "bg-blue-500" },
  amber:   { badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",  bar: "bg-amber-500" },
  teal:    { badge: "bg-teal-500/15 text-teal-600 dark:text-teal-400",     bar: "bg-teal-500" },
  orange:  { badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
  purple:  { badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400", bar: "bg-purple-500" },
};

export default function MemberUtilitiesDashboard({ setSelectedUtility }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const utilities = [
    {
      id: "nfc",
      icon: "sensors",
      tint: "sky",
      title: t("utilities.dashboard.nfc.title", "HugoNFC"),
      desc: t("utilities.dashboard.nfc.desc", "Cấu hình chạm thẻ để chia sẻ nhanh Bio Link hoặc thông tin liên hệ."),
      shortDesc: "Chạm thẻ chia sẻ Bio Link nhanh.",
      btnText: t("utilities.dashboard.nfc.btnText", "Thiết Lập Ngay")
    },
    {
      id: "vcard",
      icon: "contact_phone",
      tint: "indigo",
      title: t("utilities.dashboard.vcard.title", "HugoVCard"),
      desc: t("utilities.dashboard.vcard.desc", "Tạo QR code danh bạ thông minh quét nhanh lưu trực tiếp vào máy."),
      shortDesc: "QR code danh bạ, lưu nhanh vào máy.",
      btnText: t("utilities.dashboard.vcard.btnText", "Thiết Lập Ngay")
    },
    {
      id: "signature",
      icon: "signature",
      tint: "violet",
      title: t("utilities.dashboard.signature.title", "HugoSMail"),
      desc: t("utilities.dashboard.signature.desc", "Thiết kế chữ ký email chuyên nghiệp chuẩn doanh nghiệp."),
      shortDesc: "Chữ ký email chuyên nghiệp.",
      btnText: t("utilities.dashboard.signature.btnText", "Thiết Lập Ngay")
    },
    {
      id: "secret_link",
      icon: "lock",
      tint: "rose",
      title: t("utilities.dashboard.secretLink.title", "HugoOcculta"),
      desc: t("utilities.dashboard.secretLink.desc", "Tạo link bảo mật bằng mật khẩu dành riêng cho đối tác vip."),
      shortDesc: "Link bảo mật bằng mật khẩu riêng.",
      btnText: t("utilities.dashboard.secretLink.btnText", "Thiết Lập Ngay")
    },
    {
      id: "file_tools",
      icon: "folder_zip",
      tint: "emerald",
      title: t("utilities.dashboard.fileTools.title", "HugoTractare"),
      desc: t("utilities.dashboard.fileTools.desc", "Trình chuyển đổi định dạng và nén dung lượng hình ảnh trực tuyến."),
      shortDesc: "Đổi định dạng & nén ảnh trực tuyến.",
      btnText: t("utilities.dashboard.fileTools.btnText", "Mở Công Cụ")
    },
    {
      id: "psychology",
      icon: "psychology",
      tint: "cyan",
      title: t("companion.tab.title", "HugoPSY"),
      desc: t("utilities.dashboard.psychology.desc", "AI hỗ trợ tư vấn tâm lý học tập, theo dõi giấc ngủ và trị liệu cảm xúc."),
      shortDesc: "AI tư vấn tâm lý & giấc ngủ.",
      btnText: t("utilities.dashboard.psychology.btnText", "Mở Tiện Ích")
    },
    {
      id: "ide",
      icon: "code",
      tint: "blue",
      title: t("utilities.dashboard.ide.title", "HugoCoder"),
      desc: t("utilities.dashboard.ide.desc", "Trình soạn thảo code đa năng (C, C++, C#, Python, Web, PHP) với gợi ý code, bài học cơ bản và hướng dẫn lưu file local."),
      shortDesc: "Soạn code đa ngôn ngữ, có gợi ý.",
      btnText: t("utilities.dashboard.ide.btnText", "Mở Trình Code")
    },
    {
      id: "chess",
      icon: "chess",
      tint: "amber",
      title: "HugoChess",
      desc: t("utilities.dashboard.chess.desc", "Cộng đồng cờ vua mini — đấu Bot, ghép ngẫu nhiên, hoặc tạo phòng chia sẻ link chơi ngay cùng bạn bè. Hệ thống JOY & xếp hạng."),
      shortDesc: "Cờ vua: đấu Bot hoặc bạn bè, có JOY.",
      btnText: t("utilities.dashboard.chess.btnText", "Vào Sảnh Cờ")
    },
    {
      id: "radio",
      icon: "radio",
      tint: "teal",
      title: "HugoRadio",
      desc: t("utilities.dashboard.radio.desc", "Nghe đài tin tức Việt Nam, tin tức quốc tế và các kênh nhạc trực tuyến, miễn phí."),
      shortDesc: "Radio tin tức & nhạc trực tuyến.",
      btnText: t("utilities.dashboard.radio.btnText", "Mở Đài Radio")
    },
    {
      id: "arcade",
      icon: "stadium",
      tint: "orange",
      title: "HugoArcade",
      desc: t("utilities.dashboard.arcade.desc", "2048, Caro đấu AI, Đoán Từ — chơi để ghi điểm và nhận JOY khi đạt kỷ lục mới."),
      shortDesc: "Mini game ghi điểm, nhận JOY.",
      btnText: t("utilities.dashboard.arcade.btnText", "Vào Sảnh Game")
    },
    {
      id: "aura",
      icon: "blur_on",
      tint: "purple",
      title: "HugoAura",
      desc: t("utilities.dashboard.aura.desc", "Không gian tập trung Pomodoro tích hợp bộ trộn âm thanh thiên nhiên thư giãn & trị liệu, nhận JOY."),
      shortDesc: "Pomodoro & âm thanh thư giãn.",
      btnText: t("utilities.dashboard.aura.btnText", "Vào Không Gian")
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section — flat card, no gradient; kept short on mobile to avoid clutter */}
      <div className="bg-card rounded-xl p-4 md:p-8 border border-border shadow-sm">
        <div className="space-y-1.5 md:space-y-2">
          <span className="hidden md:inline-flex px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-primary/10 text-primary uppercase border border-primary/20">
            {t("memberPortal.utilitiesPage.tabTitle")}
          </span>
          <h2 className="text-base md:text-2xl font-black tracking-tight text-foreground">
            {t("memberPortal.utilitiesPage.title")}
          </h2>
          <p className="hidden md:block text-xs text-muted-foreground max-w-xl leading-relaxed">
            {t("memberPortal.utilitiesPage.desc")}
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6">
        {utilities.map((util) => {
          const tint = TINTS[util.tint] || TINTS.indigo;
          return (
          <div
            id={`utility-card-${util.id}`}
            key={util.id}
            onClick={() => {
              setSelectedUtility(util.id);
            }}
            className="group relative cursor-pointer overflow-hidden bg-white dark:bg-background rounded-2xl p-3.5 md:p-6 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-[112px] md:h-[210px]"
          >
            <span className={`absolute top-0 left-0 right-0 h-1 ${tint.bar}`} />
            <div className="flex items-start gap-3 md:block md:space-y-4">
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${tint.badge}`}>
                <span className="material-symbols-outlined text-[22px] md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{util.icon}</span>
              </div>
              <div className="min-w-0 flex-1 md:space-y-1 md:mt-4">
                <h3 className="text-[11.5px] md:text-sm font-black text-zinc-800 dark:text-zinc-100 line-clamp-1 md:line-clamp-none">
                  {util.title}
                </h3>
                <p className="md:hidden text-[9.5px] text-zinc-450 dark:text-zinc-400 leading-snug">
                  {util.shortDesc}
                </p>
                <p className="hidden md:block text-[10.5px] text-zinc-450 dark:text-zinc-400 leading-relaxed">
                  {util.desc}
                </p>
              </div>
              <span className="material-symbols-outlined md:hidden text-zinc-400 text-sm shrink-0 mt-1">chevron_right</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[9px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest pt-2">
              <span className="truncate">{util.btnText}</span> <span className="material-symbols-outlined text-[10px] transform group-hover:translate-x-1 transition-transform shrink-0">arrow_forward_ios</span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
