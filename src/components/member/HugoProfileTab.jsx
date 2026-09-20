import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "./os/AppFrame";
import StandaloneInstallButton from "../ui/StandaloneInstallButton";
import { notify } from "../../lib/notify";
import { API_BASE } from "../../config/apiBase";
import { localeForLanguage } from "../../i18n/languages";
import profileEvidenceApi from "../../services/api/ProfileEvidenceApi";

/**
 * Hugo Profile — hồ sơ năng lực có kiểm chứng.
 *
 * Toàn bộ số liệu do server tổng hợp từ những gì hệ thống đã ghi nhận; màn này
 * không nhận một ô nhập nào. Đó chính là điểm bán: người xem tin được vì không
 * ai tự khai được vào đây.
 *
 * Xem hồ sơ của chính mình thì miễn phí. Thứ phải trả JOY là quyền CÔNG BỐ nó
 * lên trang Bio công khai — bậc thuê/sở hữu do Hugo Store lo, ở đây chỉ đọc
 * `publishing.entitled` mà server trả về.
 */
export default function HugoProfileTab({ onBack, publicLink }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [nextEvidenceCursor, setNextEvidenceCursor] = useState(null);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/me`);
      if (res.ok) setData(await res.json());
    } catch {
      /* để nguyên màn chờ, người dùng mở lại là tải tiếp */
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadEvidence = useCallback(async (cursor = "") => {
    setEvidenceLoading(true);
    setEvidenceError("");
    try {
      const result = await profileEvidenceApi.list({ cursor, limit: 20 });
      setEvidence((current) => cursor ? [...current, ...result.items] : result.items);
      setNextEvidenceCursor(result.nextCursor || null);
    } catch {
      setEvidenceError(t("utilities.profile.evidenceLoadError"));
    } finally {
      setEvidenceLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (data?.capabilities?.learningEvidence) loadEvidence();
  }, [data?.capabilities?.learningEvidence, loadEvidence]);

  const removeEvidence = async (item) => {
    // notify.confirm, KHÔNG window.confirm: hộp thoại của trình duyệt chặn cả
    // luồng, không theo theme, và trong PWA độc lập trên iOS nó hiện kèm tên
    // miền trông như cảnh báo lạ. Quy ước dự án là một hệ thông báo duy nhất.
    const ok = await notify.confirm({
      title: t("utilities.profile.evidenceDeleteTitle", "Xoá minh chứng?"),
      message: t("utilities.profile.evidenceDeleteConfirm", { title: item.title }),
      danger: true,
    });
    if (!ok) return;
    setDeletingEvidenceId(item.id);
    try {
      await profileEvidenceApi.remove(item.id);
      setEvidence((current) => current.filter((entry) => entry.id !== item.id));
      notify.success(t("utilities.profile.evidenceDeleted"));
    } catch {
      notify.error(t("utilities.profile.evidenceDeleteError"));
    } finally {
      setDeletingEvidenceId("");
    }
  };

  const togglePublish = async (enabled) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/me/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.status === 402) throw new Error(t("utilities.profile.needPlan"));
      if (!res.ok) throw new Error(t("utilities.profile.saveError"));
      notify.success(enabled ? t("utilities.profile.published") : t("utilities.profile.unpublished"));
      load();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const profile = data?.profile;
  const publishing = data?.publishing;

  return (
    /*
     * Chuyển từ `SubUtilityHeader` sang khung chung `AppFrame` (20/09/2026).
     *
     * Vì sao: portal đang có BA bộ chrome song song — `AppFrame`, header này, và
     * các app tự dựng. Cùng một portal mà mỗi app một kiểu nút quay lại, một cỡ
     * chữ tiêu đề, một cách chừa safe-area; đó mới là gốc của cảm giác "UI không
     * đồng bộ". Gộp về một khung thì sửa một chỗ là cả hệ đổi theo.
     *
     * Chỉ gộp CẤU TRÚC, không gộp MÀU: nền/nhấn của app vẫn do `appPalette` cấp
     * theo tint riêng trong appRegistry, đúng chủ ý "mỗi app tự cầm màu của mình".
     * Nội dung bên dưới giữ nguyên token portal (`bg-card`, `text-foreground`) —
     * chúng đọc từ biến trên `:root` nên không bị `AppFrame` đè.
     *
     * `SubUtilityHeader` có nút cài PWA mà `AppFrame` không có, nên chuyển nó vào
     * khe `actions` — nếu không, đổi khung là mất mất một tính năng.
     */
    <AppFrame
      appId="profile"
      title={t("utilities.catalog.profile.title")}
      largeTitle
      onBack={onBack}
      actions={<StandaloneInstallButton appTitle={t("utilities.catalog.profile.title")} appId="profile" />}
      contentMaxWidth="720px"
    >
      {!profile ? (
        <p className="px-1 py-10 text-center text-[15px] text-muted-foreground">{t("utilities.profile.loading")}</p>
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t("utilities.profile.eyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-foreground">{profile.displayName}</h2>
            {profile.headline && <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>}
            <p className="mt-3 text-[13px] text-muted-foreground">
              {t("utilities.profile.generatedAt", { date: new Date(profile.generatedAt).toLocaleString(locale) })}
            </p>
          </section>

          <ProofSection title={t("utilities.profile.sectionStudent")}>
            <ProofRow
              label={t("utilities.profile.studentStatus")}
              value={profile.student.verified ? t("utilities.profile.verified") : t("utilities.profile.notVerified")}
              strong={profile.student.verified}
            />
            {profile.student.school && <ProofRow label={t("utilities.profile.school")} value={profile.student.school} />}
          </ProofSection>

          <ProofSection title={t("utilities.profile.sectionLearning")}>
            <ProofRow
              label={t("utilities.profile.lessons")}
              value={`${profile.learning.lessonsDone}/${profile.learning.lessonsTotal}`}
              strong={profile.learning.lessonsDone > 0}
            />
            <ProofRow
              label={t("utilities.profile.certificate")}
              value={profile.learning.certificate ? t("utilities.profile.granted") : t("utilities.profile.notYet")}
              strong={profile.learning.certificate}
            />
            <ProofRow label={t("utilities.profile.studyCourses")} value={String(profile.learning.studyCourses)} />
          </ProofSection>

          {data?.capabilities?.learningEvidence && (
            <section className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{t("utilities.profile.evidenceTitle")}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {t("utilities.profile.evidenceDescription")}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">verified</span>
                  {t("utilities.profile.evidencePrivate")}
                </span>
              </div>

              {evidenceError ? (
                <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive">
                  <p>{evidenceError}</p>
                  <button type="button" onClick={() => loadEvidence()} className="mt-2 font-bold underline">
                    {t("utilities.profile.evidenceRetry")}
                  </button>
                </div>
              ) : evidence.length === 0 && !evidenceLoading ? (
                <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-2xl text-muted-foreground" aria-hidden="true">workspace_premium</span>
                  <p className="mt-2 text-sm font-semibold text-foreground">{t("utilities.profile.evidenceEmpty")}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t("utilities.profile.evidenceEmptyHint")}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {evidence.map((item) => (
                    <article key={item.id} className="rounded-xl border border-border/60 bg-muted/25 p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-xl" aria-hidden="true">school</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold leading-snug text-foreground">{item.title}</h4>
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {t("utilities.profile.evidenceCompletedAt", {
                              date: new Date(item.occurredAt).toLocaleString(locale),
                            })}
                          </p>
                          {item.skillTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.skillTags.map((tag) => (
                                <span key={tag} className="rounded-md bg-background px-2 py-1 text-[13px] font-medium text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={deletingEvidenceId === item.id}
                          onClick={() => removeEvidence(item)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          aria-label={t("utilities.profile.evidenceDelete")}
                          title={t("utilities.profile.evidenceDelete")}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            {deletingEvidenceId === item.id ? "progress_activity" : "delete"}
                          </span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {evidenceLoading && (
                <p className="mt-4 text-center text-[13px] text-muted-foreground">{t("utilities.profile.evidenceLoading")}</p>
              )}
              {nextEvidenceCursor && !evidenceLoading && (
                <button
                  type="button"
                  onClick={() => loadEvidence(nextEvidenceCursor)}
                  className="mt-4 min-h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {t("utilities.profile.evidenceLoadMore")}
                </button>
              )}
            </section>
          )}

          {profile.team.member && (
            <ProofSection title={t("utilities.profile.sectionTeam")}>
              <ProofRow label={t("utilities.profile.approvedHours")} value={`${profile.team.approvedHours}h`} strong />
              <ProofRow label={t("utilities.profile.tasksDone")} value={String(profile.team.tasksDone)} strong={profile.team.tasksDone > 0} />
            </ProofSection>
          )}

          {/* Công bố: đây là phần tính JOY. Chưa thuê thì nút mở Hugo Store. */}
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-bold text-foreground">{t("utilities.profile.publishTitle")}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t("utilities.profile.publishDesc")}</p>

            {publishing?.entitled ? (
              <>
                <label className="mt-4 flex min-h-11 items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{t("utilities.profile.showOnBio")}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(publishing.enabled)}
                    disabled={saving}
                    onChange={(event) => togglePublish(event.target.checked)}
                    className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-primary disabled:opacity-50"
                  />
                </label>
                {publishing.enabled && publicLink && (
                  <p className="mt-2 break-all text-[13px] text-muted-foreground">{publicLink}</p>
                )}
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-muted/60 px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
                {t("utilities.profile.needPlan")}
              </p>
            )}
          </section>
        </div>
      )}
    </AppFrame>
  );
}

function ProofSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      <dl className="space-y-2.5">{children}</dl>
    </section>
  );
}

function ProofRow({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm ${strong ? "font-bold text-foreground" : "text-muted-foreground"}`}>{value}</dd>
    </div>
  );
}
