import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../config/apiBase";

/**
 * Bảng "hồ sơ năng lực có kiểm chứng" gắn dưới trang Bio công khai.
 *
 * Tự gọi API theo slug và **trả về null** khi chủ trang chưa bật công bố hoặc
 * đã hết hạn thuê Hugo Profile. Nhờ vậy ba giao diện Bio (default/flat/
 * brutalism) chỉ cần đặt thẻ này vào cuối, không cần biết gì về hạn thuê.
 *
 * Mọi con số ở đây do server tổng hợp từ dữ liệu hệ thống đã duyệt. Không có
 * trường nào do chủ trang tự nhập — đó là toàn bộ lý do người xem nên tin.
 */
export default function VerifiedProfilePanel({ slug }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!slug) return undefined;
    let alive = true;
    fetch(`${API_BASE}/profile/public/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : { profile: null }))
      .then((data) => { if (alive) setProfile(data?.profile || null); })
      .catch(() => { /* trang Bio vẫn phải mở được khi API lỗi */ });
    return () => { alive = false; };
  }, [slug]);

  if (!profile) return null;

  const facts = [
    profile.student.verified && {
      icon: "school",
      label: t("utilities.profile.studentStatus"),
      value: t("utilities.profile.verified"),
      note: profile.student.school,
    },
    profile.learning.lessonsDone > 0 && {
      icon: "menu_book",
      label: t("utilities.profile.lessons"),
      value: `${profile.learning.lessonsDone}/${profile.learning.lessonsTotal}`,
      note: profile.learning.certificate ? t("utilities.profile.granted") : "",
    },
    profile.team.member && {
      icon: "schedule",
      label: t("utilities.profile.approvedHours"),
      value: `${profile.team.approvedHours}h`,
      note: t("utilities.profile.tasksDoneShort", { count: profile.team.tasksDone }),
    },
  ].filter(Boolean);

  if (facts.length === 0) return null;

  return (
    <section className="bg-background px-4 py-10" aria-labelledby="verified-profile">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-foreground" aria-hidden="true">verified</span>
          <h2 id="verified-profile" className="text-sm font-bold text-foreground">
            {t("utilities.profile.eyebrow")}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("utilities.profile.publicNote")}
        </p>

        <dl className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-border/60 bg-card p-4">
              <span className="material-symbols-outlined text-[18px] text-muted-foreground" aria-hidden="true">{fact.icon}</span>
              <dd className="mt-1.5 text-lg font-bold leading-none text-foreground">{fact.value}</dd>
              <dt className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{fact.label}</dt>
              {fact.note && <p className="mt-1 truncate text-[11px] text-muted-foreground/80">{fact.note}</p>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
