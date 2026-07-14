import React from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";

// Each utility gets a three-stop gradient identity (richer than a flat tint)
// plus a cluster of secondary icons hinting at what's inside. Card outline,
// icon-badge shape and corner radius all rotate per card too, so the grid
// reads as a mosaic of different pieces — "đa sắc, đa hình dạng" — rather
// than identical tiles with swapped colors.
const GRADIENTS = {
  indigo:  "from-primary via-violet-500 to-purple-500",
  rose:    "from-rose-500 via-fuchsia-500 to-pink-500",
  cyan:    "from-info via-info to-primary",
  blue:    "from-primary via-primary to-violet-500",
  teal:    "from-teal-400 via-success to-success",
  orange:  "from-warning via-orange-500 to-destructive",
  purple:  "from-fuchsia-500 via-purple-500 to-primary",
  slate:   "from-slate-500 via-zinc-500 to-stone-500",
};

// Three alternating card silhouettes — organic/blob, standard squircle,
// and sharper-cut — cycled by index so neighboring cards never look identical.
const SHAPES = [
  "rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl",
  "rounded-[1.75rem]",
  "rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl",
];
// Three alternating icon-badge shapes — circle, squircle, diamond-ish via rotation.
const BADGE_SHAPES = ["rounded-full", "rounded-xl", "rounded-2xl rotate-3 group-hover:rotate-0"];

export default function MemberUtilitiesDashboard({ setSelectedUtility, showToast }) {
  const { t } = useTranslation();
  const { data } = useData();

  const handleUtilityClick = (utilId) => {
    if (data?.systemSettings?.blockUtilities && window.location.hostname === "hugowishpax.studio") {
      const isBlocked = typeof data.systemSettings.blockUtilities === "boolean" 
        ? data.systemSettings.blockUtilities 
        : data.systemSettings.blockUtilities === utilId;

      if (isBlocked) {
        if (showToast) {
          showToast("Hugo... đang được hệ thống tiến hành nâng cấp lên phiên bản mới nhất, hẹn gặp bạn sau 24 tiếng", "info");
        }
        return;
      }
    }
    setSelectedUtility(utilId);
  };

  const utilities = [
    {
      id: "bio",
      icon: "badge",
      glyphs: ["visibility", "link"],
      tint: "purple",
      title: "Trang Bio",
      desc: "Xem trước trang Bio cá nhân công khai của bạn. Chỉnh sửa nội dung tại Cài đặt › Thông tin.",
      shortDesc: "Xem trước trang Bio của bạn.",
      btnText: "Xem trang Bio"
    },
    {
      id: "helpdesk",
      icon: "support_agent",
      glyphs: ["qr_code_2", "mail"],
      tint: "indigo",
      title: "HugoHelpdesk",
      desc: "Mã QR/NFC thông minh và chữ ký email chuyên nghiệp — gộp 2 công cụ chia sẻ thông tin liên hệ vào một nơi.",
      shortDesc: "Mã QR/NFC & chữ ký email.",
      btnText: "Mở Helpdesk"
    },
    {
      id: "handle",
      icon: "handyman",
      glyphs: ["lock", "photo_size_select_large"],
      tint: "rose",
      title: "HugoHandle",
      desc: "Link bảo mật bằng mật khẩu và trình chuyển đổi/nén ảnh trực tuyến — gộp 2 công cụ xử lý file & link.",
      shortDesc: "Link bảo mật & nén/đổi ảnh.",
      btnText: "Mở Handle"
    },
    {
      id: "psychology",
      icon: "psychology",
      glyphs: ["favorite", "self_improvement"],
      tint: "cyan",
      title: t("companion.tab.title", "HugoPSY"),
      desc: t("utilities.dashboard.psychology.desc", "AI hỗ trợ tư vấn tâm lý học tập, theo dõi giấc ngủ và trị liệu cảm xúc."),
      shortDesc: "AI tư vấn tâm lý & giấc ngủ.",
      btnText: t("utilities.dashboard.psychology.btnText", "Mở Tiện Ích")
    },
    {
      id: "ide",
      icon: "code",
      glyphs: ["terminal", "data_object"],
      tint: "blue",
      title: t("utilities.dashboard.ide.title", "HugoCoder"),
      desc: t("utilities.dashboard.ide.desc", "Trình soạn thảo code đa năng (C, C++, C#, Python, Web, PHP) với gợi ý code, bài học cơ bản và hướng dẫn lưu file local."),
      shortDesc: "Soạn code đa ngôn ngữ, có gợi ý.",
      btnText: t("utilities.dashboard.ide.btnText", "Mở Trình Code")
    },
    {
      id: "radio",
      icon: "radio",
      glyphs: ["graphic_eq", "public"],
      tint: "teal",
      title: "HugoRadio",
      desc: t("utilities.dashboard.radio.desc", "Nghe đài tin tức Việt Nam, tin tức quốc tế và các kênh nhạc trực tuyến, miễn phí."),
      shortDesc: "Radio tin tức & nhạc trực tuyến.",
      btnText: t("utilities.dashboard.radio.btnText", "Mở Đài Radio")
    },
    {
      id: "arcade",
      icon: "stadium",
      glyphs: ["sports_esports", "emoji_events"],
      tint: "orange",
      title: "HugoArcade",
      desc: t("utilities.dashboard.arcade.desc", "2048, Caro, Cờ vua, Đua xe 3D và nhiều game khác — chơi để ghi điểm và nhận JOY khi đạt kỷ lục mới."),
      shortDesc: "Mini game, đua xe, cờ vua, nhận JOY.",
      btnText: t("utilities.dashboard.arcade.btnText", "Vào Sảnh Game")
    },
    {
      id: "aura",
      icon: "blur_on",
      glyphs: ["spa", "nightlight"],
      tint: "purple",
      title: "HugoAura",
      desc: t("utilities.dashboard.aura.desc", "Không gian tập trung Pomodoro tích hợp bộ trộn âm thanh thiên nhiên thư giãn & trị liệu, nhận JOY."),
      shortDesc: "Pomodoro & âm thanh thư giãn.",
      btnText: t("utilities.dashboard.aura.btnText", "Vào Không Gian")
    },
    {
      id: "info",
      icon: "info",
      glyphs: ["new_releases", "redeem"],
      tint: "slate",
      title: "Info & Version",
      desc: t("memberPortal.infoVersion.desc"),
      shortDesc: t("memberPortal.infoVersion.desc"),
      btnText: t("memberPortal.infoVersion.title")
    },
    {
      id: "deco",
      icon: "chair",
      glyphs: ["pets", "desk"],
      tint: "pink",
      title: "Deco Studio",
      desc: "Trang trí không gian Ký Túc Xá Ảo của bạn bằng các vật phẩm nội thất độc đáo và trưng bày trên trang Bio.",
      shortDesc: "Trang trí Ký Túc Xá Ảo của bạn.",
      btnText: "Mở Deco Studio"
    },
    {
      id: "team",
      icon: "groups",
      glyphs: ["school", "favorite"],
      tint: "teal",
      title: "Hugo Team",
      desc: "Cộng đồng phát triển mã nguồn mở. Các sinh viên nam/nữ năm 2-3 ngành CNTT hãy cùng chúng tôi học vừa làm, phi lợi nhuận.",
      shortDesc: "Tuyển dụng sinh viên CNTT",
      btnText: "Tham gia Hugo Team"
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header — a spectrum accent bar + diversity tagline instead of a
          plain bordered box, since this whole tab is meant to feel like one
          colorful place built for every kind of person to find their own
          corner in, not a row of identical buttons. */}
      <div className="relative overflow-hidden bg-card rounded-2xl p-4 md:p-8 border border-border shadow-sm">
        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500" />
        <div className="space-y-2 md:space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-muted text-muted-foreground uppercase border border-border">
            <span className="material-symbols-outlined text-[12px]">diversity_3</span>
            {t("memberPortal.utilitiesPage.tabTitle")}
          </span>
          <h2 className="text-base md:text-2xl font-black tracking-tight text-foreground">
            {t("memberPortal.utilitiesPage.title")}
          </h2>
          <p className="text-[11.5px] md:text-xs text-muted-foreground max-w-xl leading-relaxed">
            {t("memberPortal.utilitiesPage.desc")}
            <span className="hidden md:inline"> Mỗi người một cá tính, một nhịp sống — chọn công cụ hợp với chính mình, không cần giống ai cả.</span>
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6">
        {utilities.map((util, idx) => {
          const gradient = GRADIENTS[util.tint] || GRADIENTS.indigo;
          const shape = SHAPES[idx % SHAPES.length];
          const badgeShape = BADGE_SHAPES[idx % BADGE_SHAPES.length];
          return (
          <div
            id={`utility-card-${util.id}`}
            key={util.id}
            onClick={() => handleUtilityClick(util.id)}
            className={`group relative cursor-pointer overflow-hidden bg-card ${shape} p-3.5 md:p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 active:scale-[0.98] flex flex-col justify-between h-[124px] md:h-[220px]`}
          >
            {/* Thin identity stripe — the card's only colour accent (flat, calm surface) */}
            <span className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

            {/* Decorative glyph cluster — secondary icons hinting at what's inside, low-key in the corner */}
            <div className="absolute bottom-3 right-3 flex -space-x-1.5 opacity-25 dark:opacity-20 pointer-events-none transition-transform duration-300 group-hover:scale-110">
              {util.glyphs.map((g, i) => (
                <span key={i} className="material-symbols-outlined text-muted-foreground/70" style={{ fontSize: i === 0 ? 26 : 20 }}>{g}</span>
              ))}
            </div>

            <div className="relative z-10 flex items-start gap-3 md:block md:space-y-4">
              <div className={`relative w-11 h-11 md:w-12 md:h-12 ${badgeShape} flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                <span className="material-symbols-outlined text-[22px] md:text-2xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{util.icon}</span>
              </div>
              <div className="min-w-0 flex-1 md:space-y-1 md:mt-4">
                <h3 className="text-[11.5px] md:text-sm font-black text-foreground line-clamp-1 md:line-clamp-none">
                  {util.title}
                </h3>
                <p className="md:hidden text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {util.shortDesc}
                </p>
                <p className="hidden md:block text-[11.5px] text-muted-foreground leading-relaxed">
                  {util.desc}
                </p>
              </div>
              <span className="material-symbols-outlined md:hidden text-zinc-400 text-sm shrink-0 mt-1">chevron_right</span>
            </div>
            <div className="relative z-10 hidden md:flex items-center gap-1.5 text-[9px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest pt-2 transition-colors">
              <span className="truncate">{util.btnText}</span> <span className="material-symbols-outlined text-[10px] transform group-hover:translate-x-1 transition-transform shrink-0">arrow_forward_ios</span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
