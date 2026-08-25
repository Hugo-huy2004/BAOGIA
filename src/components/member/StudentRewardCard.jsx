import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import memberService from "../../services/classes/MemberService";

const OPTIONS = [
  { type: "achievement", days: 35, icon: "workspace_premium" },
  { type: "transcript", days: 60, icon: "school" },
];

function vietnamSeason() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, open: month >= 7 && month <= 9 };
}

export default function StudentRewardCard({ bio, onBioUpdate, showToast }) {
  const { i18n } = useTranslation();
  const vi = i18n.language?.startsWith("vi");
  const season = vietnamSeason();
  const inputs = useRef({});
  const [files, setFiles] = useState({});
  const [reviewing, setReviewing] = useState("");
  const [result, setResult] = useState(null);
  const claims = bio?.studentRewards || [];

  const copy = vi ? {
    eyebrow: "Quà thường niên · Tháng 07–09",
    title: "Hugo Studio đồng hành cùng HSSV",
    desc: "Gửi từng loại hồ sơ một lần trong năm. Hai phần thưởng được cộng dồn, tối đa +95 ngày duy trì tài khoản.",
    achievement: "Giấy khen hoặc chứng chỉ",
    achievementDesc: `Tài liệu phải ghi năm ${season.year} và đọc rõ nội dung.`,
    transcript: "Bảng điểm hiện tại",
    transcriptDesc: `Chỉ xét kết quả năm ${season.year}; điểm của năm cũ được bỏ qua.`,
    choose: "Chọn ảnh hoặc PDF", review: "Xét duyệt ngay", reviewing: "Đang xét duyệt…",
    received: "Đã nhận", closed: "Cổng nhận hồ sơ mở lại vào tháng 07",
    unverified: "Cần xác minh HSSV trước khi tham gia.", privacy: "Ảnh/file chỉ dùng trong lần xét duyệt này và không được lưu lại.",
  } : {
    eyebrow: "Annual gift · July–September", title: "Hugo Studio supports students",
    desc: "Submit each evidence type once per year. Both rewards stack, up to +95 account days.",
    achievement: "Award or certificate", achievementDesc: `The document must clearly show ${season.year}.`,
    transcript: "Current transcript", transcriptDesc: `Only ${season.year} results count; older scores are ignored.`,
    choose: "Choose image or PDF", review: "Review now", reviewing: "Reviewing…", received: "Received",
    closed: "Submissions reopen in July", unverified: "Student verification is required first.",
    privacy: "Your image/file is used for this review only and is not stored.",
  };

  const review = async (type) => {
    const file = files[type];
    if (!file) return inputs.current[type]?.click();
    setReviewing(type);
    setResult(null);
    try {
      const data = await memberService.reviewStudentReward(type, file);
      setResult({ ok: true, message: data.message });
      setFiles((current) => ({ ...current, [type]: null }));
      onBioUpdate?.({ expiresAt: data.expiresAt, studentRewards: data.studentRewards });
      showToast?.(data.message, "success");
    } catch (error) {
      setResult({ ok: false, message: error.message });
      showToast?.(error.message, "error");
    } finally {
      setReviewing("");
    }
  };

  return (
    <section className="apple-account-section rounded-[28px] border border-border bg-card p-5 sm:p-6" aria-labelledby="student-reward-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{copy.eyebrow}</p>
          <h3 id="student-reward-title" className="mt-1 text-[22px] font-extrabold tracking-tight text-foreground">{copy.title}</h3>
          <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{copy.desc}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-primary" aria-hidden="true">
          <span className="material-symbols-outlined text-[30px]">redeem</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const claimed = claims.some((entry) => entry.year === season.year && entry.type === option.type);
          const disabled = claimed || !season.open || !bio?.isEduVerified || reviewing;
          return (
            <article key={option.type} className="rounded-3xl border border-border bg-muted/35 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-primary" aria-hidden="true">{option.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-[16px] font-bold text-foreground">{copy[option.type]}</h4>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-extrabold text-primary">+{option.days} {vi ? "ngày" : "days"}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{copy[`${option.type}Desc`]}</p>
                </div>
              </div>
              <input
                ref={(node) => { inputs.current[option.type] = node; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(event) => setFiles((current) => ({ ...current, [option.type]: event.target.files?.[0] || null }))}
              />
              {files[option.type] && !claimed && <p className="mt-3 truncate text-[12px] font-medium text-foreground">{files[option.type].name}</p>}
              <div className="mt-4 flex gap-2">
                {!claimed && (
                  <button type="button" disabled={disabled} onClick={() => inputs.current[option.type]?.click()} className="min-h-[44px] flex-1 rounded-xl border border-border bg-card px-3 text-[13px] font-bold text-foreground disabled:opacity-45">
                    {copy.choose}
                  </button>
                )}
                <button type="button" disabled={disabled || !files[option.type]} onClick={() => review(option.type)} className="min-h-[44px] flex-1 rounded-xl bg-foreground px-3 text-[13px] font-bold text-background disabled:opacity-45">
                  {claimed ? `${copy.received} +${option.days}` : reviewing === option.type ? copy.reviewing : copy.review}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!season.open && <p className="mt-4 text-[13px] font-semibold text-amber-700 dark:text-amber-300">{copy.closed}</p>}
      {!bio?.isEduVerified && <p className="mt-4 text-[13px] font-semibold text-amber-700 dark:text-amber-300">{copy.unverified}</p>}
      {result && <p role="status" className={`mt-4 rounded-2xl px-4 py-3 text-[13px] font-semibold ${result.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>{result.message}</p>}
      <p className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">shield_lock</span>{copy.privacy}</p>
    </section>
  );
}
