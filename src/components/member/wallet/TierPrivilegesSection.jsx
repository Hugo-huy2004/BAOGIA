import React from "react";
import { nom } from "../../../lib/nomText";
import { TIER_META } from "../../../lib/memberTier";
import { financeFacts } from "../../../../shared/tierFinance";

/**
 * Dòng "Tài chính & Giao dịch" được SINH RA từ shared/tierFinance.js, không
 * viết tay.
 *
 * Bốn dòng này từng là chuỗi HTML gõ tay, và cả bốn đều sai: hứa Star-VIP miễn
 * phí 0% trong khi mọi người đều bị thu 5%, hứa Star-14 trần 500/ngày trong khi
 * thực tế 1.000, hứa hạn mức vay 1.000/5.000/500 trong khi mã nguồn chưa bao
 * giờ đọc tới hạng. Sai vì có HAI nguồn mà không gì so chúng với nhau.
 *
 * Giờ con số chỉ còn một chỗ, và `check:tier-finance` chặn mọi con số viết tay
 * quay lại dòng này.
 */
function financeBenefit(tier) {
  const f = financeFacts(tier);
  const credit = f.creditLocked
    ? nom("Không phát sinh giao dịch nợ (khoá tính năng vay JOY Gối Đầu)")
    : `Hạn mức vay JOYlater nhân ×${f.creditMultiplier} trên hạn mức được xét theo hồ sơ`;
  const fee = f.feeFree
    ? nom("miễn phí hoàn toàn (0%) mọi loại phí chuyển JOY")
    : `phí chuyển JOY ${f.feePercent}%`;
  return `<b>${nom("Tài chính & Giao dịch:")}</b> ${credit}, ${fee}, chuyển tối đa ${f.dailyCap.toLocaleString("vi-VN")} JOY/ngày.`;
}

export const TIER_PRIVILEGES_MAP = {
  star18: {
    tier: "star18",
    title: "Star-18",
    subtitle: nom("Thành viên 18 đến hết tháng sinh nhật 23 tuổi"),
    badge: nom("Đặc quyền toàn diện"),
    accentColor: "#F59E0B",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    policySummary:
      "Dành riêng cho lứa tuổi thanh niên từ 18 tuổi đến hết tháng sinh nhật năm 23 tuổi. Hưởng trọn vẹn các ưu đãi học tập số, trải nghiệm hệ sinh thái miễn phí hoặc trợ giá sinh viên.",
    benefits: [
      "<b>Lập trình & Kỹ năng số:</b> Mở khoá miễn phí HugoCoder Basic nền tảng; hỗ trợ giá sinh viên cho toàn bộ chặng chuyên sâu.",
      "<b>Tâm lý học (HugoPSY):</b> Trị liệu AI 60 phút mỗi ngày miễn phí, nhận thưởng lên đến 180 JOY/ngày.",
      "<b>Tiện ích & Giải trí:</b> Nghe Lofi không quảng cáo, mở khoá toàn bộ game Arcade, sử dụng miễn phí HugoSO Docs & Lịch.",
      financeBenefit("star18"),
      "<b>Đặc quyền sinh nhật:</b> Cộng thêm 30 ngày duy trì tài khoản & Voucher giảm 15% khi thiết kế website."
    ],
  },
  star14: {
    tier: "star14",
    title: "Star-14",
    subtitle: nom("Thành viên học sinh 14 - 17 tuổi"),
    badge: nom("Bảo vệ vị thành niên"),
    accentColor: "#F43F5E",
    bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    policySummary:
      nom("Thiết kế riêng cho học sinh trung học (14 đến dưới 18 tuổi). Tối ưu cho việc học tập, giải trí lành mạnh và tuân thủ tuyệt đối quy định bảo vệ dữ liệu trẻ em."),
    benefits: [
      "<b>Lập trình & Kỹ năng số:</b> Miễn phí hoàn toàn Chặng 1 Basic để định hướng sớm tư duy lập trình.",
      "<b>Tâm lý học (HugoPSY):</b> Kênh tâm sự học đường bảo mật và ẩn danh tuyệt đối.",
      "<b>Tiện ích học tập:</b> Không gian Lofi học bài, HugoSO Ghi chú & Thời khoá biểu miễn phí.",
      financeBenefit("star14"),
      "<b>Quà tặng sinh nhật:</b> Cộng thêm 15 ngày gia hạn tài khoản (Tự động nâng cấp Star-18 khi đủ 18 tuổi)."
    ],
  },
  starVip: {
    tier: "starVip",
    title: "Star-VIP",
    subtitle: nom("Thành viên danh dự Hugo Studio"),
    badge: nom("Đặc quyền tối thượng"),
    accentColor: "#0F172A",
    bgGradient: "from-slate-500/10 via-slate-400/5 to-transparent",
    policySummary:
      nom("Hạng thẻ danh dự trọn đời do Hugo Studio trực tiếp trao tặng cho các đối tác, đóng góp xuất sắc hoặc thành viên danh dự. Mở khoá không giới hạn mọi dịch vụ trên toàn hệ sinh thái."),
    benefits: [
      "<b>Lập trình & Kỹ năng số:</b> Miễn phí truy cập trọn đời toàn bộ 6 chặng đào tạo (từ Basic đến DevOps).",
      "<b>Tâm lý học (HugoPSY):</b> Trị liệu chuyên sâu ưu tiên, không giới hạn thời gian và số lượt.",
      "<b>Tiện ích & Giải trí:</b> Mở khoá trọn bộ HugoSO Bundle, kho âm thanh Premium, toàn bộ Arcade game với x2 thưởng JOY.",
      financeBenefit("starVip"),
      "<b>Đặc quyền VIP:</b> Cộng 90 ngày hạn tài khoản mỗi dịp sinh nhật, Voucher ưu đãi lớn cho dịch vụ Website."
    ],
  },
  eco: {
    tier: "eco",
    title: "Eco",
    subtitle: nom("Thành viên trên 23 tuổi hoặc dùng thử nghiệm"),
    badge: nom("Tiết kiệm & Linh hoạt"),
    accentColor: "#2563EB",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    policySummary:
      "Hạng thẻ tiêu chuẩn dành cho người dùng trên 23 tuổi hoặc tài khoản đang dùng thử nghiệm. Chủ động chi dùng tiện ích theo nhu cầu thực tế bằng số JOY tích luỹ từ hoạt động hàng ngày.",
    benefits: [
      "<b>Lập trình & Kỹ năng số:</b> Thuê hoặc mua bài học linh hoạt bằng JOY (200 - 450 JOY tuỳ chặng).",
      "<b>Tâm lý học (HugoPSY):</b> Trải nghiệm phiên cơ bản miễn phí; 150 JOY cho mỗi phiên chuyên sâu.",
      "<b>Tiện ích học tập & Giải trí:</b> Trải nghiệm có giới hạn thời gian (ví dụ: nghe 30 phút lofi/ngày) hoặc mua thêm bằng JOY tích luỹ.",
      financeBenefit("eco"),
      "<b>Quà tặng sinh nhật:</b> Cộng 15 ngày duy trì tài khoản (áp dụng khi đã xác minh ngày sinh)."
    ],
  },
};

export default function TierPrivilegesSection({
  activeTier,
  userTier,
  onSelectTier,
}) {
  const data = TIER_PRIVILEGES_MAP[activeTier] || TIER_PRIVILEGES_MAP.eco;
  const isUserCurrentTier = activeTier === userTier;

  const toneBadgeClasses = {
    free: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    discount: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    vip: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    standard: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    locked: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };

  return (
    <section className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
              Hạng {data.title}
            </span>
            {isUserCurrentTier ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>{nom("Hạng của bạn")}</span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30 whitespace-nowrap shrink-0">
                <span className="material-symbols-outlined text-[13px]">lock</span>{nom("Đang xem trước")}</span>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">{data.subtitle}</p>
        </div>

        {/* NÚT ĐIỀU HƯỚNG NHANH CÁC HẠNG (TIER CHIPS) */}
        {onSelectTier && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(["star18", "star14", "starVip", "eco"]).map((tId) => {
              const meta = TIER_META[tId];
              const isCurrent = tId === activeTier;
              const isMine = tId === userTier;
              return (
                <button
                  key={tId}
                  type="button"
                  onClick={() => onSelectTier(tId)}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                    isCurrent
                      ? "bg-foreground text-background shadow-sm scale-100"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isMine && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  {meta?.label || tId}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* POLICY SUMMARY BANNER */}
      <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${data.bgGradient} border border-border/30 text-[13px] text-foreground/90 leading-relaxed`}>
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base mt-0.5 text-foreground/70 shrink-0">
            verified_user
          </span>
          <p className="m-0">{nom(data.policySummary)}</p>
        </div>
      </div>

      {/* PRIVILEGES LIST (Văn bản và gạch đầu dòng) */}
      <div className="bg-background/60 border border-border/40 rounded-2xl p-4 sm:p-5">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: data.accentColor }}>
            stars
          </span>{nom("Chi tiết đặc quyền")}</h4>
        <ul className="space-y-2.5">
          {data.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[13px] sm:text-[14px] leading-relaxed text-foreground/85">
              <span className="material-symbols-outlined text-[16px] mt-0.5 text-muted-foreground shrink-0">
                check
              </span>
              <span dangerouslySetInnerHTML={{ __html: nom(benefit) }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
