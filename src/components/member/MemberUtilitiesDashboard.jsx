import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function MemberUtilitiesDashboard({ setSelectedUtility }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const utilities = [
    {
      id: "nfc",
      icon: "sensors",
      title: t("utilities.dashboard.nfc.title", "Thẻ NFC Cá Nhân"),
      desc: t("utilities.dashboard.nfc.desc", "Cấu hình chạm thẻ để chia sẻ nhanh Bio Link hoặc thông tin liên hệ."),
      btnText: t("utilities.dashboard.nfc.btnText", "Thiết Lập Ngay")
    },
    {
      id: "vcard",
      icon: "contact_phone",
      title: t("utilities.dashboard.vcard.title", "Danh Bạ vCard"),
      desc: t("utilities.dashboard.vcard.desc", "Tạo QR code danh bạ thông minh quét nhanh lưu trực tiếp vào máy."),
      btnText: t("utilities.dashboard.vcard.btnText", "Thiết Lập Ngay")
    },
    {
      id: "signature",
      icon: "signature",
      title: t("utilities.dashboard.signature.title", "Chữ Ký Email"),
      desc: t("utilities.dashboard.signature.desc", "Thiết kế chữ ký email chuyên nghiệp chuẩn doanh nghiệp."),
      btnText: t("utilities.dashboard.signature.btnText", "Thiết Lập Ngay")
    },
    {
      id: "secret_link",
      icon: "lock",
      title: t("utilities.dashboard.secretLink.title", "Liên Kết Bí Mật"),
      desc: t("utilities.dashboard.secretLink.desc", "Tạo link bảo mật bằng mật khẩu dành riêng cho đối tác vip."),
      btnText: t("utilities.dashboard.secretLink.btnText", "Thiết Lập Ngay")
    },
    {
      id: "file_tools",
      icon: "folder_zip",
      title: t("utilities.dashboard.fileTools.title", "Xử Lý File"),
      desc: t("utilities.dashboard.fileTools.desc", "Trình chuyển đổi định dạng và nén dung lượng hình ảnh trực tuyến."),
      btnText: t("utilities.dashboard.fileTools.btnText", "Mở Công Cụ")
    },
    {
      id: "psychology",
      icon: "psychology",
      title: t("companion.tab.title", "Bạn Học Đường"),
      desc: t("utilities.dashboard.psychology.desc", "AI hỗ trợ tư vấn tâm lý học tập, theo dõi giấc ngủ và trị liệu cảm xúc."),
      btnText: t("utilities.dashboard.psychology.btnText", "Mở Tiện Ích")
    },
    {
      id: "ide",
      icon: "code",
      title: t("utilities.dashboard.ide.title", "Web-based IDE (Học Tập)"),
      desc: t("utilities.dashboard.ide.desc", "Trình soạn thảo code đa năng (C, C++, C#, Python, Web, PHP) với gợi ý code, bài học cơ bản và hướng dẫn lưu file local."),
      btnText: t("utilities.dashboard.ide.btnText", "Mở Trình Code")
    },
    {
      id: "chess",
      icon: "chess",
      title: "HugoChess",
      desc: t("utilities.dashboard.chess.desc", "Cộng đồng cờ vua mini — đấu Bot, ghép ngẫu nhiên, hoặc tạo phòng chia sẻ link chơi ngay cùng bạn bè. Hệ thống JOY & xếp hạng."),
      btnText: t("utilities.dashboard.chess.btnText", "Vào Sảnh Cờ")
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 rounded-xl p-6 md:p-8 text-white relative overflow-hidden border border-zinc-200/10 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/30">
            {t("memberPortal.utilitiesPage.tabTitle")}
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {t("memberPortal.utilitiesPage.title")}
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-xl leading-relaxed">
            {t("memberPortal.utilitiesPage.desc")}
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-6">
        {utilities.map((util) => (
          <div 
            id={`utility-card-${util.id}`}
            key={util.id}
            onClick={() => {
              setSelectedUtility(util.id);
            }}
            className="group cursor-pointer bg-white dark:bg-[#12111a] rounded-2xl p-4 md:p-6 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-zinc-800 dark:hover:border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-[155px] md:h-[210px]"
          >
            <div className="space-y-2 md:space-y-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black">
                <span className="material-symbols-outlined text-xl md:text-2xl">{util.icon}</span>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <h3 className="text-xs md:text-sm font-black text-zinc-800 dark:text-zinc-100 line-clamp-1 md:line-clamp-none">
                  {util.title === "HugoChess" ? (
                    <>
                      <span className="inline-flex">
                        <span style={{ color: "#EF4444" }}>H</span>
                        <span style={{ color: "#F97316" }}>u</span>
                        <span style={{ color: "#EAB308" }}>g</span>
                        <span style={{ color: "#22C55E" }}>o</span>
                      </span>
                      <span>Chess</span>
                    </>
                  ) : (
                    util.title
                  )}
                </h3>
                <p className="text-[9.5px] md:text-[10.5px] text-zinc-450 dark:text-zinc-400 leading-snug md:leading-relaxed line-clamp-2 md:line-clamp-none">
                  {util.desc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[8.5px] md:text-[9px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest pt-1 md:pt-2">
              <span className="truncate">{util.btnText}</span> <span className="material-symbols-outlined text-[9px] md:text-[10px] transform group-hover:translate-x-1 transition-transform shrink-0">arrow_forward_ios</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
