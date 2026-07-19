import React, { useState } from "react";

const DESCRIPTIONS = {
  bio: "Kiến tạo hồ sơ cá nhân độc bản và liên kết mạng xã hội (Biolink) mang phong cách của riêng bạn. Hỗ trợ tùy chỉnh ảnh đại diện, tiểu sử ngắn và tích hợp mã QR thanh toán nhanh.",
  ide: "Trình soạn thảo mã nguồn trực tuyến cực mạnh dành cho lập trình viên Hugo. Hỗ trợ các bài tập thực hành lập trình từ cơ bản tới nâng cao, kiểm thử code tức thì và chuẩn bị cho các kỳ thi chứng chỉ.",
  team: "Nơi kết nối và tuyển dụng nhân tài, các dự án thực tế của sinh viên Greenwich VN. Khám phá các cơ hội làm việc nhóm và đóng góp cho các dự án mã nguồn mở chất lượng.",
  psychology: "AI Trợ lý thấu cảm và tư vấn tâm lý 24/7. Trò chuyện giải tỏa áp lực học hành, thi cử, kết hợp các liệu pháp cải thiện chất lượng giấc ngủ và đo lường chỉ số tinh thần hoàn toàn bảo mật.",
  hugoskin: "Phân tích tình trạng da và tư vấn chu trình chăm sóc (Skincare) cá nhân hóa bằng AI. Quét sắc tố da qua camera, phát hiện khuyết điểm và gợi ý sản phẩm tối ưu.",
  radio: "Không gian thư giãn với Lofi music streaming trực tiếp từ các đài phát uy tín toàn cầu và cập nhật tin tức công nghệ mới nhất. Người bạn đồng hành không thể thiếu khi viết code.",
  helpdesk: "Trình tạo chữ ký email chuyên nghiệp và tích hợp thẻ liên kết thông minh NFC/QR. Định hình thương hiệu cá nhân của bạn trong các giao dịch số.",
  handle: "Bộ công cụ tiện ích đa năng hỗ trợ nén dung lượng hình ảnh chất lượng cao và rút gọn đường dẫn bảo mật chống mã độc, bảo vệ quyền riêng tư tuyệt đối.",
  arcade: "Thế giới mini-game giải trí tích lũy điểm thưởng JOY. Vừa thư giãn đầu óc vừa nhận về vô số ưu đãi đổi thưởng giá trị cao từ hệ sinh thái Hugo.",
  aura: "Tiện ích Pomodoro tập trung năng suất cao kết hợp âm thanh sóng não alpha/theta và nhạc tiếng mưa, tiếng quán cafe xung quanh giúp tối đa hóa khả năng học tập.",
  deco: "Tự tay thiết kế và trang trí căn phòng ký túc xá ảo theo phong cách Claymorphism. Sắp đặt nội thất, thể hiện phong cách sống và chia sẻ tới bạn bè.",
  info: "Bảng điều khiển thông tin hệ thống, nhật ký thay đổi phiên bản (Changelog) và cấu hình kỹ thuật của siêu ứng dụng Hugo Studio.",
  joy_wallet: "Ví điện tử JOY cá nhân. Xem trực quan lịch sử thu chi, số dư tài khoản và thực hiện chuyển khoản nhanh bằng mã QR giữa các thành viên hệ thống."
};

export default function LibraryCatalog({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  libraryAppsList,
  downloadingAppId,
  downloadProgress = {},
  installedApps,
  handleInstallApp,
  setSelectedUtility,
  gradients,
  onBack
}) {
  const [selectedApp, setSelectedApp] = useState(null);

  return (
    <div className="space-y-6">
      {/* Library Header */}
      <div className="flex items-center justify-between text-left border-b border-border/20 pb-3 gap-3">
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-foreground">Hugo Library</h2>
          <p className="text-[11px] text-muted-foreground/80 font-bold mt-0.5">Kho ứng dụng & tiện ích học tập</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-black uppercase border border-border/25 bg-card/75 text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại</span>
          </button>
        )}
      </div>
      {/* FEATURED BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-violet-500/10 to-transparent border border-border/40 rounded-[32px] p-6 md:p-8 text-left shadow-sm">
        <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest bg-primary/20 text-primary uppercase">
            <span className="material-symbols-outlined text-[12px] font-black">star</span>
            Ứng dụng nổi bật
          </span>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              HugoPSY AI Trợ Lý Tâm Lý
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lắng nghe bạn 24/7. Trò chuyện, giải tỏa áp lực thi cử và phân tích cải thiện giấc ngủ hoàn toàn bảo mật bằng AI thông minh.
            </p>
          </div>
          <button
            onClick={() => setSelectedUtility("psychology")}
            className="px-5 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all"
          >
            Mở ứng dụng ngay
          </button>
        </div>

        <span className="material-symbols-outlined absolute right-6 bottom-[-20px] text-[160px] text-primary/10 select-none pointer-events-none transform rotate-12">
          psychology
        </span>
      </div>

      {/* Search Bar - High-End App Store Search design */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-4 text-muted-foreground/60 text-[20px] pointer-events-none">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tiện ích, ứng dụng học tập..."
          className="w-full h-12 pl-11 pr-10 rounded-2xl border border-border/40 bg-muted/30 focus:bg-background/90 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* Categories scroller - Apple Store style pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wide whitespace-nowrap transition-all active:scale-95 ${
                active
                  ? "bg-primary text-white shadow-md shadow-primary/15 border-transparent"
                  : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/20"
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog grid */}
      {libraryAppsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-card border border-border/40 rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/75">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div>
            <p className="text-sm font-black text-foreground uppercase tracking-wider">Không tìm thấy ứng dụng</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Vui lòng nhập từ khóa khác hoặc chọn mục khác.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {libraryAppsList.map((app) => {
            const gradient = gradients[app.tint] || gradients.indigo;
            const isInstalled = installedApps.includes(app.id);
            const isDownloading = downloadingAppId === app.id;
            const progress = downloadProgress[app.id] || 0;

            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="cursor-pointer flex items-center justify-between p-5 bg-card/45 backdrop-blur-md border border-border/30 rounded-[28px] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-16 h-16 rounded-[16px] shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md relative overflow-hidden`}>
                    <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                    <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1 text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-black text-foreground leading-snug truncate">
                        {app.title}
                      </h3>
                      {app.badge && (
                        <span className="px-2 py-0.5 text-[8px] font-black tracking-widest bg-muted border border-border/50 text-muted-foreground uppercase rounded-md leading-none select-none">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate leading-normal">
                      {app.subLabel}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground/80">
                      <span className="text-warning flex items-center font-black">★ {app.rating}</span>
                      <span>•</span>
                      <span>{app.users} active</span>
                    </div>
                  </div>
                </div>

                {/* Apple App Store premium solid buttons */}
                <div className="ml-3 shrink-0">
                  {isDownloading ? (
                    <div 
                      className="w-[72px] h-[32px] relative overflow-hidden bg-muted/60 border border-border/10 rounded-full flex items-center justify-center select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="text-[10px] font-black text-primary relative z-10">{progress}%</span>
                    </div>
                  ) : isInstalled ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedUtility(app.id); }}
                      className="w-[72px] h-[32px] flex items-center justify-center rounded-full bg-primary text-white font-extrabold text-[11.5px] uppercase tracking-widest shadow-sm shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200"
                    >
                      Mở
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleInstallApp(app.id); }}
                      className="w-[72px] h-[32px] flex items-center justify-center rounded-full bg-muted hover:bg-primary text-primary hover:text-white font-extrabold text-[11.5px] uppercase tracking-widest active:scale-95 transition-all duration-200 shadow-sm"
                    >
                      Tải
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📱 APPLE APP STORE PRODUCT DETAIL MODAL SHEET */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />

          <div className="relative w-full sm:max-w-xl bg-[#0b0f19] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-[510] max-h-[92vh] overflow-y-auto animate-slideUp text-left space-y-6">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

            {/* Top Close Button */}
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/95 flex items-center justify-center active:scale-95 transition-transform z-25"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* 1. App Header Info */}
            <div className="flex gap-4 items-start pr-8">
              <div className={`w-20 h-20 rounded-[20px] bg-gradient-to-br ${gradients[selectedApp.tint] || gradients.indigo} flex items-center justify-center shadow-lg relative overflow-hidden shrink-0`}>
                <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <span className="material-symbols-outlined text-white text-[38px]" style={{ fontVariationSettings: "'FILL' 1" }}>{selectedApp.icon}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white leading-snug">
                    {selectedApp.title}
                  </h3>
                  {selectedApp.badge && (
                    <span className="px-2 py-0.5 text-[8px] font-black tracking-widest bg-white/10 border border-white/15 text-zinc-300 uppercase rounded-md leading-none select-none">
                      {selectedApp.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-normal">
                  {selectedApp.subLabel}
                </p>
                <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                  Hugo Studio Developer
                </p>

                {/* GET / OPEN Button in Header */}
                <div className="pt-2">
                  {installedApps.includes(selectedApp.id) ? (
                    <button
                      onClick={() => { setSelectedApp(null); setSelectedUtility(selectedApp.id); }}
                      className="px-6 py-1.5 rounded-full bg-primary text-white font-extrabold text-[11px] uppercase tracking-widest shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200"
                    >
                      Mở ứng dụng
                    </button>
                  ) : downloadingAppId === selectedApp.id ? (
                    <div className="inline-flex px-6 py-1.5 rounded-full bg-white/5 border border-white/10 items-center justify-center gap-2 select-none">
                      <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                      <span className="text-[10px] font-black text-blue-400">{downloadProgress[selectedApp.id] || 0}%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstallApp(selectedApp.id)}
                      className="px-6 py-1.5 rounded-full bg-primary text-white font-extrabold text-[11px] uppercase tracking-widest shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200"
                    >
                      Tải về máy
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Apple Quick Stats Row */}
            <div className="grid grid-cols-4 gap-2 py-3 border-y border-white/10 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Đánh giá</span>
                <span className="text-sm font-black text-zinc-100 flex items-center justify-center gap-0.5">
                  {selectedApp.rating} <span className="text-warning text-xs">★</span>
                </span>
                <span className="text-[9px] text-zinc-500 font-semibold block">98 lượt</span>
              </div>
              <div className="space-y-1 border-l border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Độ tuổi</span>
                <span className="text-sm font-black text-zinc-100">12+</span>
                <span className="text-[9px] text-zinc-500 font-semibold block">Tuổi</span>
              </div>
              <div className="space-y-1 border-l border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Người dùng</span>
                <span className="text-sm font-black text-zinc-100">{selectedApp.users}</span>
                <span className="text-[9px] text-zinc-500 font-semibold block">Hoạt động</span>
              </div>
              <div className="space-y-1 border-l border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Thể loại</span>
                <span className="text-sm font-black text-zinc-100 uppercase text-[10px] tracking-wider truncate block">
                  {selectedApp.category === "edu" ? "Học tập" : selectedApp.category === "wellness" ? "Sức khỏe" : selectedApp.category === "tools" ? "Công cụ" : "Giải trí"}
                </span>
                <span className="text-[9px] text-zinc-500 font-semibold block">Tiện ích</span>
              </div>
            </div>

            {/* 3. What's New Row */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-baseline">
                <h4 className="text-[13px] font-black uppercase tracking-wider text-white">Có gì mới</h4>
                <span className="text-[10px] text-zinc-500 font-bold">Phiên bản 2.5.0</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-white/5 border border-white/10 rounded-2xl p-4">
                Tối ưu hóa hiệu năng nạp trước (Hover Prefetching), khắc phục hoàn toàn hiện tượng trễ khi tải tài nguyên, căn chỉnh độ bo góc chuẩn Apple App Store.
              </p>
            </div>

            {/* 4. Detailed Description */}
            <div className="space-y-2 text-left">
              <h4 className="text-[13px] font-black uppercase tracking-wider text-white">Thông tin mô tả</h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                {DESCRIPTIONS[selectedApp.id] || "Ứng dụng tiện ích đa năng thuộc hệ sinh thái học tập và giải trí cao cấp Hugo Studio."}
              </p>
            </div>

            {/* 5. Horizontal Preview/Screenshots Mockups */}
            <div className="space-y-2 text-left">
              <h4 className="text-[13px] font-black uppercase tracking-wider text-white">Xem trước giao diện</h4>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2.5">
                {[
                  { title: "Bàn Làm Việc", desc: "Tối ưu hóa hiển thị, tùy chỉnh kích thước đa dạng." },
                  { title: "Hiệu Năng Cao", desc: "Công nghệ GPU tăng tốc, giảm hao tốn tài nguyên." },
                  { title: "Cá Nhân Hóa", desc: "Định hình phong cách màu sắc, tiện ích của bạn." }
                ].map((screen, idx) => (
                  <div 
                    key={idx} 
                    className={`w-[145px] h-[240px] rounded-2xl bg-gradient-to-br ${gradients[selectedApp.tint] || gradients.indigo} opacity-90 p-3.5 flex flex-col justify-between shrink-0 shadow-md relative overflow-hidden`}
                  >
                    {/* Mock Status Bar */}
                    <div className="flex justify-between items-center text-[7px] text-white/80 font-black tracking-wider">
                      <span>9:41</span>
                      <div className="flex gap-1 items-center">
                        <span className="material-symbols-outlined text-[7px]">wifi</span>
                        <span className="material-symbols-outlined text-[7px]">battery_full</span>
                      </div>
                    </div>

                    {/* Mock Icon Center */}
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto my-auto shadow-sm">
                      <span className="material-symbols-outlined text-white text-[20px]">{selectedApp.icon}</span>
                    </div>

                    {/* Mock Footer Label */}
                    <div className="space-y-1 text-left bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/10 w-full">
                      <p className="text-[8px] font-black text-white leading-tight uppercase tracking-wider">{screen.title}</p>
                      <p className="text-[6.5px] text-white/80 font-semibold leading-normal">{screen.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Info Table */}
            <div className="space-y-2 text-left pt-2 border-t border-white/10">
              <h4 className="text-[13px] font-black uppercase tracking-wider text-white">Thông tin chi tiết</h4>
              <div className="divide-y divide-white/10 text-xs">
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-450 font-semibold text-zinc-400">Nhà phát triển</span>
                  <span className="text-zinc-200 font-bold">Hugo Studio</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-450 font-semibold text-zinc-400">Dung lượng</span>
                  <span className="text-zinc-200 font-bold">12.4 MB</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-450 font-semibold text-zinc-400">Tương thích</span>
                  <span className="text-zinc-200 font-bold">iOS 15.0+ / Android 9.0+</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-450 font-semibold text-zinc-400">Ngôn ngữ</span>
                  <span className="text-zinc-200 font-bold">Tiếng Việt, Tiếng Anh</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-450 font-semibold text-zinc-400">Bản quyền</span>
                  <span className="text-zinc-200 font-bold">© 2026 Hugo Studio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
