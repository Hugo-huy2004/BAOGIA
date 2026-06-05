import { withTranslation } from "react-i18next";
import React, { Component } from 'react';

const getBasePackageDetails = (serviceLabel) => {
  const label = serviceLabel || "Student Bio";
  if (label.toLowerCase().includes("signature")) {
    return {
      name: "Signature Portfolio",
      color: "#6366f1",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "Thiết Kế Độc Bản Portfolio: Thể hiện cá tính chuyên nghiệp thông qua thiết kế Portfolio tinh tế.",
        "Bố Cục Tối Ưu UX/UI: Giúp các đối tác và khách hàng dễ dàng tương tác và nắm bắt thông tin.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh."
      ]
    };
  }
  if (label.toLowerCase().includes("ultimate")) {
    return {
      name: "Ultimate Web App",
      color: "#ec4899",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "Trải Nghiệm Web App Đỉnh Cao: Biến Bio Link thành một ứng dụng web thực thụ mượt mà.",
        "Bố Cục Tối Ưu UX/UI: Giúp các đối tác và khách hàng dễ dàng tương tác và nắm bắt thông tin.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh."
      ]
    };
  }
  if (label.toLowerCase().includes("student")) {
    return {
      name: "Student Bio",
      color: "#0071e3",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "3 Giao Diện Độc Bản: Lựa chọn các mẫu giao diện Classic thanh lịch, Brutalism cá tính hoặc Flat Design đa sắc màu.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh.",
        "Không Giới Hạn Kết Nối: Chia sẻ tối đa 5 liên kết mạng xã hội chính của bạn giúp tiếp cận khách hàng tối ưu nhất."
      ]
    };
  }
  return {
    name: "Free Bio",
    color: "#64748b",
    benefits: [
      "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
      "Classic Profile Layout: Bố cục Bio Link truyền thống, đơn giản, sạch sẽ và dễ đọc.",
      "Không Quảng Cáo Rác: Cam kết giao diện sạch sẽ, thân thiện và tối ưu nhất cho người xem."
    ]
  };
};

class PackageCard extends Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  toggleOpen = () => {
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const { t } = this.props;
    const { name, duration, durationUnit, benefits, color, startLabel, expiresLabel, isBasePackage = false } = this.props;
    const { isOpen } = this.state;
    const formattedBenefits = benefits || [];

    return (
      <div className="space-y-3">
        <div 
          onClick={this.toggleOpen}
          style={{ 
            background: `linear-gradient(135deg, ${color} 0%, #1c1c24 60%, #111115 100%)`,
            borderColor: `${color}40`
          }}
          className="relative overflow-hidden rounded-[24px] text-white p-6 sm:p-8 border shadow-[0_24px_50px_rgba(0,0,0,0.3)] flex flex-col justify-between h-[200px] sm:h-[245px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)] cursor-pointer select-none"
        >
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none" 
            style={{ backgroundImage: `radial-gradient(circle at 80% 20%, ${color}20 0%, transparent 80%)` }}
          />
          <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-white/60 font-black uppercase text-[9px] tracking-[0.25em]">
                <span className="material-symbols-outlined text-xs">workspace_premium</span>
                {isBasePackage ? t("memberPortal.package.base") : t("memberPortal.package.promo")}
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-zinc-150 to-zinc-400 bg-clip-text text-transparent">{name}</h3>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đang hoạt động
            </div>
          </div>

          <div className="space-y-3 relative z-10 mt-auto">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="text-xs sm:text-sm font-semibold flex items-center gap-4 sm:gap-6">
                <div>
                  <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">Ngày bắt đầu</span>
                  <span className="text-xs sm:text-sm font-mono text-zinc-150">{startLabel}</span>
                </div>
                {expiresLabel && (
                  <>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div>
                      <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">Hạn dùng Bio</span>
                      <span className="text-red-300 font-bold text-xs sm:text-sm font-mono">{expiresLabel}</span>
                    </div>
                  </>
                )}
                {!expiresLabel && (
                  <>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div>
                      <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">Thời hạn cộng thêm</span>
                      <span className="text-white font-bold text-xs sm:text-sm font-mono">+{duration} {durationUnit === "days" ? "ngày" : durationUnit === "years" ? "năm" : "tháng"}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-white/60 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="transition-all duration-300 ease-in-out overflow-hidden"
          style={{ 
            maxHeight: isOpen ? '1000px' : '0px',
            opacity: isOpen ? 1 : 0
          }}
        >
          <div className="bg-zinc-50 dark:bg-[#181622]/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-[11px] sm:text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ color }}>verified_user</span>{t("memberTabs.manage.benefitsTitle")}</h4>
              <p className="text-[9px] sm:text-[10px] text-zinc-400">Xem các quyền lợi độc quyền đi kèm gói này.</p>
            </div>

            {formattedBenefits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {formattedBenefits.map((benefit, i) => (
                  <div key={i} className="flex gap-2.5 items-start p-3.5 rounded-lg bg-white dark:bg-[#1c1c1e] border border-zinc-150 dark:border-zinc-800/60 transition-all hover:scale-[1.01]">
                    <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0" style={{ color }}>check_circle</span>
                    <p className="text-[10px] sm:text-[11px] font-medium text-zinc-750 dark:text-zinc-300 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-450 italic py-2">Gói này không đi kèm danh sách quyền lợi chi tiết.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

class MemberManageTab extends Component {
  constructor(props) {
    super(props);
    this.state = { giftCode: "" };
  }

  handleRedeem = () => {
    if (!this.state.giftCode.trim()) return;
    this.props.handleRedeemCode(this.state.giftCode.trim());
    this.setState({ giftCode: "" });
  }

  render() {
    const { t } = this.props;
    const { bio, publicLink, handleCopyLink, handleDeleteBio, saving } = this.props;
    const { giftCode } = this.state;

    const basePkg = getBasePackageDetails(bio?.serviceLabel);
    const startLabel = bio?.createdAt ? new Date(bio.createdAt).toLocaleDateString('vi-VN') : '15/05/2026';
    const expiresLabel = bio?.expiresAt ? new Date(bio.expiresAt).toLocaleDateString('vi-VN') : 'Lifetime (Vĩnh viễn)';
    
    return (
      <div className="max-w-2xl mx-auto space-y-5 px-3 sm:px-0 animate-fadeIn">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#0071e3]">wallet</span>{t("memberTabs.manage.ownedPackagesTitle")}</h2>
          <p className="text-[10px] text-zinc-400">{t("memberTabs.manage.ownedPackagesDesc")}</p>
        </div>

        {/* Base Package Card */}
        <PackageCard t={t}
          name={basePkg.name}
          duration={12}
          durationUnit="months"
          benefits={basePkg.benefits}
          color={basePkg.color}
          startLabel={startLabel}
          expiresLabel={expiresLabel}
          isBasePackage={true}
        />

        {/* Custom assigned packages from bio.packages */}
        {bio?.packages && bio.packages.map((pkg) => (
          <PackageCard t={t}
            key={pkg._id}
            name={pkg.name}
            duration={pkg.duration}
            durationUnit={pkg.durationUnit}
            benefits={pkg.benefits}
            color={pkg.color}
            startLabel={new Date(pkg.addedAt).toLocaleDateString('vi-VN')}
            isBasePackage={false}
          />
        ))}

        {/* Redeem Gift Code Card */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 rounded-xl border border-amber-500/20 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">redeem</span>
              MÃ QUÀ TẶNG / VOUCHER
            </h4>
            <p className="text-[10px] sm:text-xs text-amber-700/70 dark:text-amber-500/70">Nhập mã ưu đãi từ Hugo Studio để kích hoạt hoặc gia hạn gói Bio của bạn.</p>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("memberTabs.manage.placeholderGift")}
              value={giftCode}
              onChange={(e) => this.setState({ giftCode: e.target.value.toUpperCase() })}
              onKeyDown={(e) => { if (e.key === 'Enter') this.handleRedeem(); }}
              className="flex-1 rounded-lg border border-amber-500/30 bg-white/50 dark:bg-black/20 text-xs sm:text-sm p-3.5 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold font-mono tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={this.handleRedeem}
              disabled={!giftCode.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-5 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm hidden sm:block">verified</span>
              <span className="text-xs">Nhận Gói</span>
            </button>
          </div>
        </div>

        {/* Public Link Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0071e3]">link</span>
              ĐƯỜNG DẪN BIO PHÁT HÀNH
            </h4>
            <p className="text-[10px] sm:text-xs text-zinc-400">Được phân phối chính thức qua máy chủ của Hugo Studio.</p>
          </div>

          {bio?.slug ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 font-bold select-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <span className="material-symbols-outlined text-sm text-emerald-500 shrink-0">lock</span>
                <span className="flex-1 overflow-x-auto scrollbar-none whitespace-nowrap">{publicLink}</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold py-3 rounded-lg transition-all text-center text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  Xem Trang Live
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold py-3 rounded-lg transition-all text-xs border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">content_copy</span>
                  Sao Chép Link
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-750">link_off</span>
              <p className="text-[11px] italic text-zinc-400 mt-2">Bạn chưa kích hoạt thiết kế Bio. Hãy hoàn thành thiết lập ở tab Cá Nhân để kích hoạt.</p>
            </div>
          )}
        </div>

        {/* Warning Danger Zone */}
        {bio?._id && (
          <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/30 p-5 rounded-lg shadow-sm space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
                <span className="material-symbols-outlined text-base">warning</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white">{t("memberTabs.manage.removeBioTitle")}</h4>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-400 mt-0.5 leading-relaxed">Xóa vĩnh viễn trang Bio Link và thu hồi tên miền riêng của bạn lập tức. Bạn không thể hoàn tác thao tác này.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteBio}
              disabled={saving}
              className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white font-bold py-2.5 rounded-md transition-all text-xs shadow-sm flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              Xóa Bio Cá Nhân
            </button>
          </div>
        )}

      </div>
    );
  }
}

export default withTranslation()(MemberManageTab);
