import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Map, MonitorPlay, Library, UserRoundCog, Award, ShieldCheck, GraduationCap, RefreshCw, ArrowLeft, Lock, Share2 } from "lucide-react";
import { notify } from "../../../lib/notify";
import { STAGES, WEB_COURSES } from "./lessons";
import { STAGE_THEME } from "./stageThemes";
import { ResourcePreview } from "../../admin/AdminCoderResourcesTab";
import { getMemberSession } from "../../../services/authSession";
import { useJoyStore } from "../../../stores/joyStore";
import FeatureGate from "../shared/FeatureGate";

const MemberIdeTab = lazy(() => import("../MemberIdeTab"));

const TABS = [
  { id: "lessons", label: "Lộ trình bài học", icon: Map },
  { id: "videos", label: "Video bài học", icon: MonitorPlay },
  { id: "documents", label: "Tài liệu học thuật", icon: Library },
  { id: "manage", label: "Quản lý", icon: UserRoundCog }
];

const STAGE_FILTERS = [{ id: "all", label: "Tất cả" }, ...STAGES.map((s) => ({ id: s.id, label: `Chặng ${s.phaseNumber}` }))];
const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, `Chặng ${s.phaseNumber}`]));

// Thẻ skeleton — dùng khi đang tải HOẶC chưa có học liệu nào (giữ layout không trống trải)
function ResourceSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      <div className="w-full aspect-video bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-2/5 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ====== Tab Video / Tài liệu — học liệu admin đăng, có preview trực quan ======
function ResourceGrid({ type }) {
  const [items, setItems] = useState(null);
  const [stage, setStage] = useState("all");
  const apiBase = import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetch(`${apiBase}/coder-resources?type=${type}&stage=${stage}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { items: [] }))   // endpoint chưa sẵn / 404 → rỗng, không ném lỗi
      .then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [type, stage]);

  const loading = items === null;
  const empty = items?.length === 0;

  return (
    <div className="space-y-4">
      {/* Bộ lọc chặng — màu theo chặng, đồng bộ với bản đồ & trang Quản lý */}
      <div className="flex gap-1.5 flex-wrap">
        {STAGE_FILTERS.map((f) => {
          const active = stage === f.id;
          const th = STAGE_THEME[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setStage(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border transition-all active:scale-95 ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
              }`}
            >
              {th && <span className={`w-2 h-2 rounded-full ${active ? "bg-background" : th.dot}`} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Đang tải HOẶC chưa có học liệu → skeleton (không để trống trải) */}
      {(loading || empty) && (
        <>
          {empty && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
              <span className="material-symbols-outlined text-lg text-muted-foreground">{type === "video" ? "smart_display" : "menu_book"}</span>
              <p className="text-[11px] text-muted-foreground leading-4">
                {type === "video" ? "Video bài học đang được biên soạn" : "Tài liệu học thuật đang được tuyển chọn"} — Hugo Studio sẽ đăng dần theo từng chặng.
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <ResourceSkeleton key={i} />)}
          </div>
        </>
      )}

      {/* Có học liệu */}
      {!loading && !empty && (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const th = STAGE_THEME[item.stageId];
            return (
              <div key={item._id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                <ResourcePreview type={item.type} url={item.url} className="w-full aspect-video" />
                <div className="p-3 space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${th ? th.chip : "bg-muted text-muted-foreground border-border"}`}>
                      {th && <span className={`w-1.5 h-1.5 rounded-full ${th.dot}`} />}
                      {STAGE_LABEL[item.stageId] || "Mọi chặng"}
                    </span>
                  </div>
                  <p className="text-sm font-black text-foreground leading-snug">{item.title}</p>
                  {item.source && <p className="text-[10px] font-bold text-muted-foreground">Nguồn: {item.source}</p>}
                  {item.description && <p className="text-xs text-muted-foreground leading-5 line-clamp-3">{item.description}</p>}
                  <div className="pt-1">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-foreground underline underline-offset-2">
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Mở {item.type === "video" ? "video" : "tài liệu"}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ====== Tab Quản lý — gói, chứng chỉ, hồ sơ học thuật ======
function ManageTab({ bio, onBioUpdate }) {
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const completed = useMemo(
    () => (bio?.completedLessons || []).filter((id) => WEB_COURSES.some((c) => c.id === id)),
    [bio?.completedLessons]
  );
  const hasAll = !!bio?.hugoCoderAll7Lifetime;
  const maintenanceExpires = bio?.featureSubscriptions?.hugoCoder?.expiresAt;
  const maintenanceActive = hasAll || (maintenanceExpires ? new Date(maintenanceExpires).getTime() > Date.now() : false);

  const stageOwned = {
    basic: hasAll || !!bio?.hugoCoderBasicLifetime,
    intermediate: hasAll || !!bio?.hugoCoderIntermediateLifetime,
    advanced: hasAll || !!bio?.hugoCoderAdvancedLifetime,
    security: hasAll || !!(bio?.hugoCoderSecurityLifetime || bio?.hugoCoderExamLifetime || bio?.hugoCoderOptimizeLifetime),
    project: hasAll || !!bio?.hugoCoderUltimateLifetime,
    devops: hasAll || !!(bio?.hugoCoderDevopsLifetime || bio?.hugoCoderUltimateLifetime)
  };

  const stageEarned = (stage) => {
    const lastId = `lesson${stage.to}`;
    if (stage.phaseNumber === 6) return completed.includes(lastId) || bio?.hugoCoderProjectStatus === "approved";
    return completed.includes(lastId);
  };

  const examLessons = WEB_COURSES.filter((c) => c.practiceType === "quiz");
  const attempts = bio?.hugoCoderExamAttempts || {};
  const earnedCount = STAGES.filter(stageEarned).length;
  const rank =
    completed.length >= 90 ? "Kỹ sư DevOps"
    : completed.length >= 70 ? "Kỹ sư Full-Stack"
    : completed.length >= 50 ? "Kỹ sư Bảo mật & AI"
    : completed.length >= 25 ? "Lập trình viên Trung cấp"
    : completed.length >= 10 ? "Lập trình viên Sơ cấp"
    : "Học viên Nhập môn";

  const payMaintenance = async () => {
    const ok = await notify.confirm({
      title: "Gia hạn bảo trì HugoCoder",
      message: "Dùng 50 JOY (+10% phí sáng tạo) để gia hạn 30 ngày quyền truy cập học tập?",
      confirmText: "Gia hạn 50 JOY"
    });
    if (!ok) return;
    try {
      const session = getMemberSession();
      const res = await fetch(`${apiBase}/joy/subscribe-feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) },
        body: JSON.stringify({ email: bio.email, featureKey: "hugoCoder", months: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giao dịch thất bại.");
      notify.success("Đã gia hạn phí bảo trì thành công!");
      onBioUpdate?.({
        ...bio,
        joyBalance: data.balance,
        featureSubscriptions: { ...(bio.featureSubscriptions || {}), hugoCoder: { active: true, expiresAt: data.expiresAt } }
      });
    } catch (e) {
      notify.error(e.message);
    }
  };

  const pct = completed.length;

  return (
    <div className="space-y-5">
      {/* HERO — danh hiệu + vòng tiến độ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-5 text-white shadow-lg">
        <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          {/* Vòng tiến độ SVG */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${pct} ${100 - pct}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Danh hiệu hiện tại</p>
            <h3 className="text-lg font-black leading-tight truncate">{rank}</h3>
            <p className="text-[11px] text-white/80 mt-0.5">{completed.length}/100 bài • {earnedCount}/6 chặng đạt chứng chỉ</p>
          </div>
        </div>
      </section>

      {/* Lượt thi trong gói */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-[13px] font-black text-foreground flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center"><GraduationCap className="w-3.5 h-3.5 text-foreground" /></span>
          Lượt thi kiểm tra
        </h3>
        <p className="text-[10.5px] text-muted-foreground leading-4 -mt-1">Mỗi bài thi có 1 lượt trong gói. Thi lại tốn 250 JOY/lượt.</p>
        <div className="space-y-1.5">
          {examLessons.map((exam) => {
            const used = Number(attempts[exam.id] || 0);
            const passed = completed.includes(exam.id);
            return (
              <div key={exam.id} className="flex items-center justify-between gap-2 text-xs py-2 border-b border-border/40 last:border-0">
                <span className="text-foreground/80 truncate">{exam.title.replace(/^\d+\.\s*/, "")}</span>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wide ${
                  passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : used === 0 ? "bg-primary/10 text-primary"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {passed ? "Đã đậu" : used === 0 ? "Còn lượt" : `Đã nộp ${used}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chứng chỉ — màu theo chặng, đồng bộ với bản đồ */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-[13px] font-black text-foreground flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center"><Award className="w-3.5 h-3.5 text-foreground" /></span>
          Chứng chỉ của tôi
        </h3>
        <div className="space-y-2">
          {STAGES.map((stage) => {
            const earned = stageEarned(stage);
            const th = STAGE_THEME[stage.id];
            const StageIcon = th.icon;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                  earned ? `bg-gradient-to-br ${th.soft}` : "border-border bg-muted/30"
                }`}
              >
                <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                  earned ? `bg-gradient-to-br ${th.banner} text-white shadow-sm` : "bg-muted text-muted-foreground"
                }`}>
                  {earned ? <StageIcon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-black truncate ${earned ? "text-foreground" : "text-muted-foreground"}`}>{stage.title.replace(/^Chặng \d+: /, `Chặng ${stage.phaseNumber}: `)}</p>
                  <p className="text-[10px] text-muted-foreground">{stage.rangeText}</p>
                </div>
                {earned ? (
                  <a
                    href={`/certificate/${bio?.slug}/${stage.phaseNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                  >
                    <Share2 className="w-3 h-3" /> Chia sẻ
                  </a>
                ) : (
                  <span className="shrink-0 text-[9.5px] font-bold text-muted-foreground uppercase">Chưa đạt</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Gói đã sở hữu — màu theo chặng */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-[13px] font-black text-foreground flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5 text-foreground" /></span>
          Gói đã sở hữu
        </h3>
        {hasAll && (
          <div className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 p-3 text-xs font-black flex items-center gap-2">
            <Award className="w-4 h-4" /> Trọn gói 6 chặng vĩnh viễn — miễn phí bảo trì trọn đời
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {STAGES.map((stage) => {
            const owned = stageOwned[stage.id];
            const th = STAGE_THEME[stage.id];
            return (
              <div key={stage.id} className={`rounded-xl border p-2.5 text-center ${owned ? `bg-gradient-to-br ${th.soft}` : "border-border bg-muted/30 opacity-70"}`}>
                <span className={`inline-block w-2 h-2 rounded-full mb-1 ${owned ? th.dot : "bg-muted-foreground/40"}`} />
                <p className="text-[10px] font-black text-foreground">Chặng {stage.phaseNumber}</p>
                <p className="text-[8.5px] text-muted-foreground leading-tight">{owned ? "Vĩnh viễn" : "Chưa mở"}</p>
              </div>
            );
          })}
        </div>
        {!hasAll && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 border border-border p-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-foreground">Phí bảo trì hàng tháng</p>
              <p className="text-[10px] text-muted-foreground leading-4">
                {maintenanceActive
                  ? `Còn hạn đến ${new Date(maintenanceExpires).toLocaleDateString("vi-VN")}`
                  : "Hết hạn — gia hạn để tiếp tục học (quá 3 tháng reset tiến trình)"}
              </p>
            </div>
            <button
              onClick={payMaintenance}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              <RefreshCw className="w-3 h-3" /> 50 JOY
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// ====== Vỏ 4 tab thống nhất của HugoCoder ======
// Shell fullscreen DUY NHẤT: header + tab bar dùng chung cho cả 4 tab.
// Gate JOY một lần ở đây; MemberIdeTab/MobileGuidebook chạy embedded (không tự bọc shell).
export default function HugoCoderHub({ onBack, bio, showToast, onBioUpdate, urlLessonId }) {
  const [tab, setTab] = useState("lessons");
  const joyBalance = useJoyStore((s) => s.balance);

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={1500}
      icon="terminal"
      title="Trao đổi JOY để mở khóa HugoCoder"
      description="Học 100 bài lập trình web, xem video, đọc tài liệu học thuật và nhận chứng chỉ."
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      className="max-w-lg mx-auto mt-10"
    >
      <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
        {/* Header thống nhất — chống Dynamic Island: sàn tối thiểu 44px dù env=0 */}
        <header
          className="shrink-0 bg-card/95 backdrop-blur-xl border-b border-border"
          style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 44px) + 6px)" }}
        >
          <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Tiện ích
            </button>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-foreground">terminal</span>
              <h2 className="text-sm font-black text-foreground tracking-tight">HugoCoder</h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-black text-foreground">
              <span className="material-symbols-outlined text-[13px] text-muted-foreground">toll</span>
              {Number(joyBalance ?? bio?.joyBalance ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
          <HubTabBar tab={tab} setTab={setTab} />
        </header>

        {/* Vùng nội dung dùng chung */}
        <div className="flex-1 min-h-0">
          {tab === "lessons" ? (
            <Suspense fallback={<HubLoading />}>
              <MemberIdeTab embedded onBack={onBack} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} urlLessonId={urlLessonId} />
            </Suspense>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-5">
                {tab === "videos" && <ResourceGrid type="video" />}
                {tab === "documents" && <ResourceGrid type="document" />}
                {tab === "manage" && <ManageTab bio={bio} onBioUpdate={onBioUpdate} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </FeatureGate>
  );
}

function HubLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function HubTabBar({ tab, setTab }) {
  return (
    <div className="flex gap-1 px-2 pb-2">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-black transition-all active:scale-[0.98] ${
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-tight text-center">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
