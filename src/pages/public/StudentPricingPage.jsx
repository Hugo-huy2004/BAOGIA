import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { withUsdPrices } from "../../utils/priceFormatter";
import { getMemberSession, loginMemberWithGoogle } from "../../services/authSession";
import { isEduEmail } from "../../utils/eduEmail";
import { notify } from "../../lib/notify";
import { isVietnameseLanguage } from "../../i18n/languages";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const reveal = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-72px" },
};

// Hai nhóm tách bạch: bài được chấm điểm (có ràng buộc) và hồ sơ cá nhân (không).
const PLAN_ICONS = {
  bug: "handyman",
  html: "code",
  php: "code_blocks",
  react: "terminal",
  exclusiveBio: "badge",
  bento: "contact_page",
};

// Hệ phẳng: 1 bán kính cho thẻ (2xl), 1 cho ô con (xl), không đổ bóng,
// emerald là màu nhấn duy nhất và chỉ dùng cho "đã xác minh / miễn phí".
const CARD = "rounded-2xl border border-border bg-card";
const INNER = "rounded-xl border border-border/70 bg-background/60";

function MonoIcon({ name, className = "" }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">{name}</span>
    </span>
  );
}

// Tiêu đề section dùng chung — một đường kẻ trên mỗi khối tạo nhịp đều cho cả trang.
function SectionHead({ eyebrow, title, desc, aside }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{title}</h2>
        {desc && <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{desc}</p>}
      </div>
      {aside}
    </div>
  );
}

// Một dòng trong checklist xác minh — trạng thái tự cập nhật theo phiên đăng nhập.
function StepRow({ state, icon, title, desc }) {
  const mark = {
    done: { icon: "check_circle", cls: "text-emerald-600 dark:text-emerald-400" },
    loading: { icon: "progress_activity", cls: "text-primary animate-spin" },
    warn: { icon: "pending", cls: "text-amber-600 dark:text-amber-400" },
    todo: { icon: icon, cls: "text-muted-foreground" },
  }[state];

  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`material-symbols-outlined text-[20px] mt-0.5 ${mark.cls}`}>{mark.icon}</span>
      <div className="min-w-0">
        <p className={`text-sm font-bold ${state === "todo" ? "text-muted-foreground" : "text-foreground"}`}>{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}

function PlanCard({ plan, vi, t }) {
  return (
    <motion.div {...reveal} className={`${CARD} flex h-full flex-col p-6 transition-colors hover:border-foreground/25`}>
      {/* Đầu thẻ: tên + giá đứng cùng khối để mắt bắt giá ngay, không phải quét xuống. */}
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{plan.label}</p>
          <h3 className="font-display mt-1.5 text-lg font-bold leading-snug text-foreground">{plan.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
        <MonoIcon name={plan.icon} />
      </div>

      <div className="flex items-baseline gap-1.5 pt-5">
        <span className="text-[26px] font-black leading-none tracking-tight text-foreground">{plan.price}</span>
        {plan.unit && <span className="text-xs font-medium text-muted-foreground">{plan.unit}</span>}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">{plan.note}</p>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{plan.desc}</p>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {vi ? t("studentPricing.banNhanDuoc") : "What you get"}
      </p>
      <ul className="mt-3 space-y-2">
        {plan.includes?.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
            <span className="material-symbols-outlined mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">check</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Trần phạm vi: giá chỉ có nghĩa khi biết nó dừng ở đâu. */}
      {plan.cap?.length > 0 && (
        <div className={`${INNER} mt-5 p-4`}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="material-symbols-outlined text-[14px]">straighten</span>
            {t("servicesPage.studentPlans.capLabel")}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {plan.cap.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.compare && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <span className="material-symbols-outlined mt-0.5 text-[14px]">compare_arrows</span>
          <span>
            <span className="font-semibold text-foreground/80">{t("servicesPage.studentPlans.compareLabel")}: </span>
            {plan.compare}
          </span>
        </p>
      )}

      {/* mt-auto ghim nút xuống đáy để các thẻ cao khác nhau vẫn thẳng hàng nút. */}
      <div className="mt-auto pt-6">
        <Link
          to={`/booking?type=student&plan=${plan.id}`}
          className="flex min-h-11 items-center justify-center rounded-xl bg-foreground text-xs font-bold text-background transition-colors hover:bg-foreground/90"
        >
          {t("servicesPage.studentPlans.orderCta")}
        </Link>
      </div>
    </motion.div>
  );
}

export default function StudentPricingPage() {
  const { t, i18n } = useTranslation();
  const vi = isVietnameseLanguage(i18n.resolvedLanguage || i18n.language);

  useHeadMeta({
    title: vi
      ? "Đặc Quyền & Bảng Giá Học Sinh, Sinh Viên | Hugo Studio"
      : "Student Perks & Pricing | Hugo Studio",
    description:
      "Xác minh email giáo dục để nhận trang Bio miễn phí 12 tháng, xem bảng giá gói HSSV, biết rõ nhận được gì và không bao gồm gì.",
    keywords: "bảng giá sinh viên, quyền lợi HSSV, Bio miễn phí, email edu, liêm chính học thuật",
    canonicalUrl: "https://www.hugowishpax.studio/student-pricing",
  });

  const [session, setSession] = useState(() => getMemberSession());
  // idle (chưa đăng nhập) | checking | edu (đã xác minh) | pending (chờ duyệt tay)
  const [eduState, setEduState] = useState("idle");
  const [gisReady, setGisReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const googleButtonRef = useRef(null);

  // Tự động kiểm duyệt: có phiên đăng nhập là gọi luôn verify-edu, không cần thao tác.
  useEffect(() => {
    const email = session?.email;
    if (!email) {
      setEduState("idle");
      return;
    }
    let alive = true;
    setEduState("checking");
    isEduEmail(email).then((ok) => {
      if (alive) setEduState(ok ? "edu" : "pending");
    });
    return () => {
      alive = false;
    };
  }, [session?.email]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      notify.error(t("studentBenefitsPage.toastFail"));
      return;
    }
    const { session: next, error } = await loginMemberWithGoogle(response.credential);
    if (!next) {
      notify.error(error === "network" ? t("studentBenefitsPage.toastNetwork") : t("studentBenefitsPage.toastFail"));
      return;
    }
    setSession(next);
  }, [t]);

  // GIS gọi callback đã đăng ký lúc initialize → giữ handler mới nhất trong ref.
  const credentialHandler = useRef(handleGoogleCredential);
  credentialHandler.current = handleGoogleCredential;

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setGisReady(false);
    setGoogleConfigError("");
    if (!clientId || session?.email) return;

    let cancelled = false;
    let timer = null;
    let timeout = null;

    const tryInitGoogle = () => {
      if (cancelled) return;
      const googleId = window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return;

      setGisReady(true);
      if (!window.__googleInitializedForStudent) {
        googleId.initialize({
          client_id: clientId,
          callback: (res) => credentialHandler.current(res),
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        window.__googleInitializedForStudent = true;
        googleId.prompt();
      }

      googleButtonRef.current.innerHTML = "";
      try {
        googleId.renderButton(googleButtonRef.current, {
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          width: 280,
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
        });
      } catch {
        setGoogleConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
      }

      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };

    timer = window.setInterval(tryInitGoogle, 250);
    timeout = window.setTimeout(() => {
      if (cancelled) return;
      setGoogleConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}. Hãy thêm origin này vào Google Cloud Console.`);
      window.clearInterval(timer);
    }, 4000);
    tryInitGoogle();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      window.__googleInitializedForStudent = false;
    };
  }, [session?.email]);

  const readPlans = useCallback(
    (keys) =>
      keys.map((key) => ({
        id: key,
        icon: PLAN_ICONS[key],
        ...withUsdPrices(
          i18n,
          `servicesPage.studentPlans.${key}`,
          t(`servicesPage.studentPlans.${key}`, { returnObjects: true }),
        ),
      })),
    [t, i18n],
  );

  const courseworkPlans = useMemo(() => readPlans(["bug", "html", "php"]), [readPlans]);
  // Gói nâng cao không đứng cùng hàng với 3 gói kia: mình ưu tiên bài đơn giản.
  const advancedPlan = useMemo(() => readPlans(["react"])[0], [readPlans]);
  const profilePlans = useMemo(() => readPlans(["exclusiveBio", "bento"]), [readPlans]);

  const benefits = useMemo(
    () =>
      ["free", "creative", "fast", "yours"].map((key, idx) => ({
        icon: ["volunteer_activism", "palette", "bolt", "fingerprint"][idx],
        title: t(`studentBenefitsPage.benefits.${key}.title`),
        desc: t(`studentBenefitsPage.benefits.${key}.desc`),
      })),
    [t],
  );

  const flow = vi
    ? [
        { icon: "verified_user", title: "1. Xác minh", desc: "Đăng nhập Google bằng email trường. Hệ thống tự kiểm tra tên miền .edu / .ac, không cần gửi giấy tờ." },
        { icon: "chat", title: "2. Chốt trần phạm vi", desc: "Bạn gửi đề bài. Mình xác nhận nằm trong trần phạm vi của gói, rồi báo giá cố định và mốc thời gian — không phát sinh giữa chừng." },
        { icon: "code", title: "3. Thực hiện", desc: "Mình tự làm toàn bộ, một mình, không thuê ngoài. Bạn theo tiến độ qua các commit trong repo." },
        { icon: "cloud_download", title: "4. Bàn giao qua Git", desc: "Nhận link Git để clone code về máy, kèm tài liệu hướng dẫn: cách chạy, vai trò từng file và luồng chạy từng chức năng." },
      ]
    : [
        { icon: "verified_user", title: "1. Verify", desc: "Sign in with your school Google account. The .edu / .ac domain is checked automatically — no paperwork." },
        { icon: "chat", title: "2. Agree the scope", desc: "You send the brief. I confirm it fits the plan's scope limits, then quote a fixed price and timeline — nothing creeps in later." },
        { icon: "code", title: "3. Build", desc: "I do all of it myself, nothing outsourced. You follow the progress through the commits in the repo." },
        { icon: "cloud_download", title: "4. Handover over Git", desc: "A Git link to clone from, plus documentation: how to run it, what each file does, and the flow behind each feature." },
      ];

  const notIncluded = vi
    ? [
        "Đồ án tốt nghiệp và đồ án chuyên ngành — mình không nhận, không nhận với bất kỳ giá nào",
        "Thi hộ, kiểm tra hộ hoặc nộp bài dưới tên bạn",
        "Viết báo cáo, thuyết minh hay slide bảo vệ thay bạn",
        "Đơn hàng mà bạn không có ý định hiểu code sau khi nhận",
        "Tên miền riêng và hosting trả phí (nếu bạn muốn dùng)",
        "Chỉnh sửa không giới hạn sau khi đã bàn giao và nghiệm thu",
      ]
    : [
        "Graduation and capstone projects — I decline these at any price",
        "Sitting exams or submitting anything under your name",
        "Writing your report, write-up, or defence slides",
        "Orders where you have no intention of understanding the code",
        "Paid domains and hosting (if you want them)",
        "Unlimited revisions after final handover",
      ];

  const verified = eduState === "edu";

  return (
    <div className="min-h-screen bg-background pb-24 pt-24 text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex justify-start">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {vi ? t("studentPricing.quayLaiDichVu") : "Back to Services"}
          </Link>
        </div>

        {/* Màn đầu: lời hứa bên trái, việc cần làm (xác minh) bên phải — không phải cuộn mới thấy nút. */}
        <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="material-symbols-outlined text-[13px]">school</span>
              {vi ? t("studentPricing.dacQuyenNguoiHoc") : "Academic specials"}
            </span>
            <h1 className="font-display mt-4 text-4xl font-black leading-[1.08] tracking-tight text-foreground md:text-5xl">
              {vi ? t("studentPricing.dacQuyenBangGia") : "Student perks & pricing"}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {vi
                ? t("studentPricing.xacMinhEmailTruong")
                : "Verify your school email once to unlock a free 12-month Bio page and student pricing on every plan below."}
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {(vi
                ? [
                    { icon: "block", title: t("studentPricing.chiCourseworkCuoiMon"), desc: t("studentPricing.khongDoAnChuyen") },
                    { icon: "cloud_download", title: t("studentPricing.banGiaoQuaGit"), desc: t("studentPricing.linkRepoDeBan") },
                    { icon: "straighten", title: t("studentPricing.giaCoDinhCo"), desc: t("studentPricing.moiGoiGhiRo") },
                  ]
                : [
                    { icon: "block", title: "End-of-term work only", desc: "No capstone projects, no graduation projects, no writing your report." },
                    { icon: "cloud_download", title: "Handover over Git", desc: "A repo link to clone, plus docs on running it and how the code works." },
                    { icon: "straighten", title: "Fixed price, hard scope", desc: "Every plan states where it stops, so nothing creeps in mid-way." },
                  ]
              ).map((item) => (
                <li key={item.title} className={`${INNER} p-4`}>
                  <span className="material-symbols-outlined text-xl text-muted-foreground">{item.icon}</span>
                  <p className="mt-2 text-xs font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Thẻ xác minh dính khi cuộn: nút hành động luôn trong tầm mắt lúc đọc bảng giá. */}
          <motion.div {...reveal} className={`${CARD} p-5 sm:p-6 lg:sticky lg:top-24`}>
            <div className="flex items-center gap-3">
              <MonoIcon
                name={verified ? "verified" : "school"}
                className={verified ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}
              />
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  {vi ? t("studentPricing.kiemDuyetTuDong") : "Automatic verification"}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {vi ? t("studentPricing.khongCanGuiThe") : "No student card uploads."}
                </p>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-border/60">
              <StepRow
                state={session?.email ? "done" : "todo"}
                icon="account_circle"
                title={vi ? t("studentPricing.dangNhapBangGoogle") : "Sign in with Google"}
                desc={session?.email || (vi ? t("studentPricing.dungTaiKhoanGoogle") : "Use your school Google account.")}
              />
              <StepRow
                state={eduState === "checking" ? "loading" : verified ? "done" : eduState === "pending" ? "warn" : "todo"}
                icon="alternate_email"
                title={vi ? t("studentPricing.kiemTraEmailGiao") : "Educational email check"}
                desc={
                  eduState === "checking"
                    ? vi ? t("studentPricing.dangDoiChieuTen") : "Checking the domain..."
                    : verified
                      ? vi ? t("studentPricing.tenMienEduAc") : "Valid .edu / .ac domain."
                      : eduState === "pending"
                        ? vi ? t("studentPricing.khongPhaiEmailTruong") : "Not a school email — moved to manual review."
                        : vi ? t("studentPricing.tuChayNgaySau") : "Runs automatically after sign-in."
                }
              />
              <StepRow
                state={verified ? "done" : eduState === "pending" ? "warn" : "todo"}
                icon="redeem"
                title={vi ? t("studentPricing.moDacQuyenHssv") : "Unlock student perks"}
                desc={
                  verified
                    ? vi ? t("studentPricing.bioMienPhi12") : "Free 12-month Bio + student pricing applied."
                    : vi ? t("studentPricing.bioMienPhi122") : "Free 12-month Bio and student pricing on every plan below."
                }
              />
            </ul>

            <div className="mt-5 border-t border-border/60 pt-5">
              {!session?.email && (
                <div className="flex flex-col items-center gap-3">
                  <div ref={googleButtonRef} className="flex min-h-[44px] justify-center" />
                  <button
                    type="button"
                    onClick={() => {
                      const googleId = window.google?.accounts?.id;
                      if (!googleId) return;
                      // Hủy prompt cũ đang treo, tránh lỗi FedCM "outstanding request".
                      googleId.cancel();
                      setTimeout(() => googleId.prompt(), 100);
                    }}
                    className="w-full border-b border-primary/30 px-1 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/5"
                  >
                    {t("studentBenefitsPage.clickSelect")}
                  </button>
                  {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <p className="text-center text-[10px] font-medium text-red-500">{t("studentBenefitsPage.warningClientId")}</p>
                  )}
                  {googleConfigError && (
                    <div className="w-full border-l-2 border-warning/40 bg-warning/8 px-4 py-3 text-left text-[10px] text-warning dark:text-amber-300">
                      <p className="font-semibold">{googleConfigError}</p>
                      <p className="mt-1 text-muted-foreground">{t("studentBenefitsPage.originError")}</p>
                    </div>
                  )}
                  <p className="text-center text-[10px] font-medium text-muted-foreground">
                    {googleConfigError
                      ? t("studentBenefitsPage.blockedByOauth")
                      : gisReady
                        ? t("studentBenefitsPage.ready")
                        : t("studentBenefitsPage.loading")}
                  </p>
                </div>
              )}

              {verified && (
                <Link
                  to="/member"
                  className="block w-full rounded-2xl bg-foreground py-3 text-center text-xs font-bold text-background transition-all hover:bg-foreground/90 active:scale-98"
                >
                  {vi ? t("studentPricing.nhanTrangBioMien") : "Claim your free 12-month Bio"}
                </Link>
              )}

              {eduState === "pending" && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {vi
                      ? t("studentPricing.emailCuaBanKhong")
                      : "Your email is not on a school domain. Send a photo of your valid student ID (matching your account name) via the contact form and I'll review it within 24h."}
                  </p>
                  <Link
                    to="/booking?type=student&plan=verify"
                    className="block w-full rounded-2xl border border-border py-3 text-center text-xs font-bold text-foreground transition-all hover:bg-muted"
                  >
                    {vi ? t("studentPricing.guiTheSinhVien") : "Send student ID for manual review"}
                  </Link>
                </div>
              )}

              <div className="mt-4 flex gap-2.5 text-left text-[10px] leading-relaxed text-muted-foreground">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-muted-foreground">shield_person</span>
                <p>{t("studentBenefitsPage.securityDesc")}</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Quà HSSV: Bio miễn phí 12 tháng */}
        <section className="mt-16">
          <SectionHead
            eyebrow={t("studentBenefitsPage.giftSpark")}
            title={t("studentBenefitsPage.title")}
            desc={t("studentBenefitsPage.desc")}
          />
          <motion.div {...reveal} className={`${CARD} grid gap-8 p-6 md:p-8 lg:grid-cols-[240px_1fr]`}>
            <div className="flex flex-row gap-8 lg:flex-col lg:gap-5 lg:border-r lg:border-border/60 lg:pr-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("studentBenefitsPage.marketValue")}
                </p>
                <p className="mt-1 text-lg font-bold text-muted-foreground/70 line-through decoration-muted-foreground/40">
                  {t("studentBenefitsPage.marketPrice")}
                  <span className="text-xs font-normal">{t("studentBenefitsPage.perYear")}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  {t("studentBenefitsPage.giftToYou")}
                </p>
                <p className="mt-1 text-3xl font-black leading-none tracking-tight text-foreground">
                  {t("studentBenefitsPage.giftPrice")}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{t("studentBenefitsPage.priceless")}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.title}>
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                    <span className="material-symbols-outlined text-lg">{benefit.icon}</span>
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{benefit.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Nhóm 1: bài được chấm điểm */}
        <section className="mt-16">
        <SectionHead
          eyebrow={vi ? t("studentPricing.01BaiDuocCham") : "01 — Graded work"}
          title={t("servicesPage.studentPlans.groupCoursework.title")}
          desc={t("servicesPage.studentPlans.groupCoursework.desc")}
          aside={
            <span
              className={`inline-flex w-max items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                verified
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{verified ? "verified" : "lock_open_right"}</span>
              {verified
                ? vi ? t("studentPricing.daXacMinhGia") : "Verified — student pricing active"
                : vi ? t("studentPricing.xacMinhEmailTruong2") : "Verify your school email to order"}
            </span>
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courseworkPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} vi={vi} t={t} />
          ))}
        </div>

        {/* Bài nâng cao gập lại: khuyến khích tự học trước, nhận hạn chế. <details> lo phần đóng/mở. */}
        <details className={`${CARD} group mt-6 p-5 sm:p-6`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-xl text-muted-foreground">school</span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {vi ? t("studentPricing.baiNangCaoReact") : "Advanced work (React, Node, full-stack)?"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vi
                    ? t("studentPricing.minhKhuyenBanTu")
                    : "I'd rather you learn this one yourself. Open for the reasoning and the limited support I do take."}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
              expand_more
            </span>
          </summary>

          <div className="mt-6 grid gap-6 border-t border-border/60 pt-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                {vi
                  ? t("studentPricing.toiMucReactRest")
                  : "At React + REST API level, the grade no longer hinges on code that runs, but on understanding why it runs. This is also the exact knowledge that follows you into job interviews — buying it means buying the one thing you should have kept."}
              </p>
              <p>
                {vi
                  ? t("studentPricing.nenMinhUuTien")
                  : t("studentPricing.soTheThreeSimpler")}
              </p>
              <Link
                to="/ide"
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border px-4 text-xs font-bold text-foreground transition-all hover:bg-muted"
              >
                <span className="material-symbols-outlined text-base">terminal</span>
                {vi ? t("studentPricing.tuHocBangWeb") : "Learn it in the free Web IDE"}
              </Link>
            </div>

            {advancedPlan && <PlanCard plan={advancedPlan} vi={vi} t={t} />}
          </div>
        </details>
        </section>

        {/* Nhóm 2: hồ sơ cá nhân, không dính điểm số */}
        <section className="mt-16">
        <SectionHead
          eyebrow={vi ? t("studentPricing.02KhongDinhDiem") : "02 — Nothing graded"}
          title={t("servicesPage.studentPlans.groupProfile.title")}
          desc={t("servicesPage.studentPlans.groupProfile.desc")}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bản miễn phí đứng cạnh bản trả phí để không ai tưởng mình bán lại thứ vừa tặng. */}
          <motion.div
            {...reveal}
            className="flex h-full flex-col rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-emerald-500/20 pb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  {vi ? t("studentPricing.quaHssv") : "Student gift"}
                </p>
                <h3 className="font-display mt-1.5 text-lg font-bold leading-snug text-foreground">
                  {vi ? t("studentPricing.bioTuDung") : "Self-Built Bio"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {vi ? t("studentPricing.banTuLamTrong") : "You build it, in 10 minutes"}
                </p>
              </div>
              <MonoIcon name="redeem" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <div className="flex items-baseline gap-1.5 pt-5">
                <span className="text-[26px] font-black leading-none tracking-tight text-foreground">{t("studentPricing.0d")}</span>
                <span className="text-xs font-medium text-muted-foreground">{vi ? t("studentPricing.12Thang") : "/ 12 months"}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                {vi
                  ? t("studentPricing.chiCanEmailTruong")
                  : "Just the verified school email above. No card required."}
              </p>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {vi ? t("studentPricing.banNhanDuoc") : "What you get"}
              </p>
              <ul className="mt-3 space-y-2">
                {(vi
                  ? [t("studentPricing.trinhSoanThaoTrong"), t("studentPricing.chonTuCacTheme"), t("studentPricing.lienKetMangXa"), t("studentPricing.duongDanRiengHugowishpax")]
                  : ["An editor inside your account, change it anytime", "Pick from the built-in themes and palettes", "Social links, avatar, short intro", "Your own hugowishpax.studio/bio/your-name link"]
                ).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                    <span className="material-symbols-outlined mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">check</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto pt-6">
              <Link
                to="/member"
                className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/40 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                {verified
                  ? vi ? t("studentPricing.moTrinhSoanThao") : "Open the Bio editor"
                  : vi ? t("studentPricing.xacMinhOTren") : "Verify above to claim"}
              </Link>
            </div>
          </motion.div>

          {profilePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} vi={vi} t={t} />
          ))}
        </div>
        </section>

        {/* Quy trình + ranh giới liêm chính học thuật */}
        <section className="mt-16">
        <SectionHead
          eyebrow={vi ? t("studentPricing.03QuyTrinh") : "03 — How it runs"}
          title={vi ? t("studentPricing.banNhanDuocGi") : "What you get, step by step"}
          desc={
            vi
              ? t("studentPricing.tuLucXacMinh")
              : "From verification to handover — everything is agreed up front, no surprises."
          }
        />

        <motion.div {...reveal}>
          <div className="grid gap-4 md:grid-cols-4">
            {flow.map((step) => (
              <div key={step.title} className={`${CARD} p-5`}>
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                </span>
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className={`${CARD} mt-4 p-6 md:p-8`}>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-muted-foreground">history_edu</span>
              <h3 className="font-display text-base font-bold text-foreground">
                {vi ? t("studentPricing.minhKhongNhanKe") : "What I decline — even at a higher price"}
              </h3>
            </div>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {notIncluded.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="material-symbols-outlined mt-0.5 text-sm text-muted-foreground/70">close</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
        </section>
      </div>
    </div>
  );
}
