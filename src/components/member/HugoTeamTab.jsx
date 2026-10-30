import { lazy, Suspense, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProgressBar, Segmented, Button, Sheet } from "../demos/iosKit";
import AppFrame from "./os/AppFrame";
import LazyBoundary from "./os/LazyBoundary";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/api/core/authSession";
import { API_BASE } from "../../config/apiBase";
import { localeForLanguage, languageCode } from "../../i18n/languages";
import { canTranslate, guessLanguage, translateText } from "../../lib/textTranslator";
import "../../styles/hugoTeam.css";

const HugoCoderHub = lazy(() => import("./hugoCoder/HugoCoderHub"));

const fetchHugoTeamRead = async (url) => {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url);
    if (![502, 503, 504].includes(response.status) || attempt === 2) return response;
    await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
  }
  return response;
};

/**
 * Quy chế làm việc của Hugo Team. Nội dung nằm trong i18n (memberPortal.team.rules)
 * nên nó theo ngôn ngữ đang chọn như mọi phần khác, và mỗi điều đều bám đúng cơ
 * chế hệ thống đang chạy — bốn trạng thái task, luật ghi giờ, mốc 500 giờ.
 */
function TeamRulesSheet({ open, onClose }) {
  const { t } = useTranslation();
  const sections = t("memberPortal.team.rules.sections", { returnObjects: true });

  return (
    <Sheet open={open} onClose={onClose} title={t("memberPortal.team.rules.title")}>
      <p className="pb-1 text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
        {t("memberPortal.team.rules.intro")}
      </p>
      <div className="space-y-5 pt-3">
        {(Array.isArray(sections) ? sections : []).map((section) => (
          <section key={section.title}>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{section.title}</h3>
            <ul className="mt-2 space-y-2">
              {section.items.map((item, index) => (
                <li key={index} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
                  <span className="mt-[0.55em] size-[3px] shrink-0 rounded-full" style={{ background: "var(--ios-label-2)" }} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

/** Vỏ app: NavBar cố định + vùng cuộn riêng. Lối ra duy nhất là nút back trên
 *  NavBar — tab-bar của portal đã ẩn khi Hugo Team mở (MemberUtilitiesTab). */
/**
 * Vỏ của Hugo Team.
 *
 * Trước đây file này TỰ DỰNG lại đúng những gì `AppFrame` làm: một `IosApp`, bảng
 * `--ios-*` trỏ về token portal, `NavBar` tiêu đề lớn, `Scroll`, cộng `mr-11`
 * đoán tay để né nút X, và một MutationObserver riêng để dò dark mode. Nay chỉ
 * còn khai báo phần KHÁC BIỆT của app này.
 *
 * `paletteVars` giữ nguyên chủ ý cũ: trang tuyển dụng bên trong viết bằng token
 * portal (`bg-card`, `text-foreground`), nên vỏ phải cùng hệ màu đó chứ không
 * lấy tint riêng như các app khác.
 */
function TeamShell({ onBack, children }) {
  const { t } = useTranslation();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <AppFrame
      appId="team"
      title="Hugo Team"
      contentMaxWidth="1180px"
      onBack={onBack}
      paletteVars={{
        "--ios-bg": "hsl(var(--background))",
        "--ios-elevated": "hsl(var(--card))",
        "--ios-surface": "hsl(var(--card))",
        "--ios-surface-2": "hsl(var(--muted))",
        "--ios-label": "hsl(var(--foreground))",
        "--ios-label-2": "hsl(var(--muted-foreground))",
        "--ios-sep": "hsl(var(--border))",
        "--ios-fill": "hsl(var(--muted))",
        "--ios-fill-2": "hsl(var(--muted))",
        "--ios-chrome": "hsl(var(--background) / .82)",
      }}
      actions={(
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          aria-label={t("memberPortal.team.rules.title")}
          title={t("memberPortal.team.rules.title")}
          className="grid h-11 w-11 place-items-center rounded-full text-[17px] font-bold"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
        >
          !
        </button>
      )}
    >
      <div className="hugo-team">
        <LazyBoundary resetKey="hugoteam" onBack={onBack}>{children}</LazyBoundary>
      </div>
      <TeamRulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </AppFrame>
  );
}

function CodingStageDashboard({ onBack, reload, bio, onBioUpdate }) {
  const [selectedStep, setSelectedStep] = useState(null);
  // Cùng một nguồn với ứng dụng Coding: số step đã xong ở đây = ở Coding.
  const hub = (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Đang tải bài học Hugo Team…</div>}>
      <HugoCoderHub bio={bio} onBioUpdate={onBioUpdate} onBack={() => setSelectedStep(null)} urlLessonId={selectedStep} framed={!selectedStep} program="hugoteam" programProgress={bio?.completedLessons || []} onLessonChange={setSelectedStep} onProgramProgress={reload} />
    </Suspense>
  );
  // Đang học một step: trình phát chiếm trọn màn, KHÔNG nằm trong TeamShell —
  // nếu không, Sheet quy chế và nút của khung sẽ đè lên bài học.
  if (selectedStep) return hub;
  return <TeamShell onBack={onBack}>{hub}</TeamShell>;
}

function StageCard({ title, eyebrow, children }) {
  return <div className="ht-stage-card"><p>{eyebrow}</p><h2>{title}</h2>{children}</div>;
}

function TeamInvitation({ me, onBack, reload }) {
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/invitation/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể chấp nhận lời mời");
      notify.success("Đã chấp nhận lời mời tham gia Hugo Team");
      await reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };
  return <TeamShell onBack={onBack}><StageCard eyebrow="HUGO TEAM · LỜI MỜI" title={`Chúc mừng ${me?.name || "bạn"}!`}><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Bạn đã hoàn tất toàn bộ chương trình. Hugo Team mời bạn tham gia giai đoạn Mentor và làm việc cùng đội ngũ.</p><button type="button" onClick={accept} disabled={busy} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? "Đang xử lý…" : "Chấp nhận lời mời"}</button></StageCard></TeamShell>;
}

function MentorMonthDashboard({ me }) {
  const remaining = me?.mentorEndsAt ? Math.max(0, Math.ceil((new Date(me.mentorEndsAt) - Date.now()) / 86400000)) : 30;
  return <div className="space-y-5"><StageCard eyebrow="MENTOR · 30 NGÀY" title="Chặng đồng hành và dự án cuối"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Bạn có một Mentor đồng hành liên tục trong tháng đầu. Dự án cuối được thực hiện ở giai đoạn này, không còn là điều kiện hoàn tất chương trình Coding HugoTeam.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{remaining}</p><p className="text-sm text-muted-foreground">ngày còn lại</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">{me?.mentor?.name || "Đang phân công"}</p><p className="text-sm text-muted-foreground">Mentor của bạn</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{me?.contributionScore || 0}</p><p className="text-sm text-muted-foreground">điểm đóng góp</p></div></div><div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground"><b className="text-foreground">Dự án cuối:</b> Mentor giao phạm vi, tiêu chí và hình thức phối hợp. HugoTeam ghi nhận nhiệm vụ, phản hồi và điểm đóng góp.</div></StageCard><StageCard eyebrow="CHECK-IN" title="Nhật ký phát triển"><div className="mt-4 space-y-3"><div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 text-sm"><span>Mentor đã được kết nối</span><span className="font-semibold text-emerald-600">{me?.mentor?.email || "Chờ phân công"}</span></div><div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 text-sm"><span>Trạng thái chuyển tiếp</span><span className="font-semibold text-primary">Sau khi đủ 30 ngày và hoàn tất dự án</span></div></div></StageCard></div>;
}

function TeamDashboard({ me }) {
  const [team, setTeam] = useState(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => { fetch(`${API_BASE}/hugoteam/team/dashboard`).then((res) => res.ok && res.json()).then(setTeam).catch(() => {}); }, []);
  const createTask = async () => { if (!title || !target) return; await fetch(`${API_BASE}/hugoteam/team/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, email: target }) }); setTitle(""); setTarget(""); };
  return <div className="space-y-5"><StageCard eyebrow="TEAMWORK" title={`Team ${team?.teamId || me?.teamId || "đang chuẩn bị"}`}><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Team tối đa 10 thành viên. Các bạn tự chủ động giao tiếp và phối hợp bên ngoài; hệ thống giữ vai trò minh bạch hóa thành viên, nhiệm vụ và đóng góp.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{team?.members?.length || 0}/10</p><p className="text-sm text-muted-foreground">thành viên</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">{team?.members?.filter((item) => item.teamRole === "teamlead").length || 0}</p><p className="text-sm text-muted-foreground">Teamlead</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{team?.members?.reduce((sum, item) => sum + item.openTasks, 0) || 0}</p><p className="text-sm text-muted-foreground">nhiệm vụ mở</p></div></div></StageCard><StageCard eyebrow="MEMBERS" title="Những người cùng team"><div className="mt-4 grid gap-3 sm:grid-cols-2">{(team?.members || []).map((member) => <div key={member.email} className="flex items-center justify-between rounded-2xl border border-border/60 p-4"><div><p className="font-semibold text-foreground">{member.name}</p><p className="text-sm text-muted-foreground">{member.teamRole === "teamlead" ? "Teamlead" : "Member"}</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm">{member.contributionScore}/100</span></div>)}</div>{team?.members?.some((member) => member.email === me?.email && member.teamRole === "teamlead") && <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên nhiệm vụ" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><select value={target} onChange={(event) => setTarget(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm"><option value="">Chọn thành viên</option>{team.members.map((member) => <option key={member.email} value={member.email}>{member.name}</option>)}</select><button type="button" onClick={createTask} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Giao</button></div>}</StageCard></div>;
}

function MentorDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(80);
  const [note, setNote] = useState("");
  const load = () => fetch(`${API_BASE}/hugoteam/mentor/dashboard`).then((res) => res.ok && res.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => { if (!selected) return; await fetch(`${API_BASE}/hugoteam/mentor/mentees/${encodeURIComponent(selected)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, note }) }); setSelected(null); setNote(""); load(); };
  return <TeamShell onBack={onBack}><div className="space-y-5"><StageCard eyebrow="MENTOR CONSOLE" title="Dashboard Mentor"><p className="mt-3 text-sm text-muted-foreground">Theo dõi nhịp đồng hành, phản hồi định kỳ và sức chứa tối đa 100 mentee trong một đợt.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{data?.capacity?.used || 0}/{data?.capacity?.max || 100}</p><p className="text-sm text-muted-foreground">sức chứa</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{data?.mentees?.filter((item) => item.contributionScore >= 70).length || 0}</p><p className="text-sm text-muted-foreground">đang tiến triển tốt</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">30 ngày</p><p className="text-sm text-muted-foreground">mỗi chu kỳ</p></div></div></StageCard><StageCard eyebrow="MENTEES" title="Danh sách đồng hành"><div className="mt-4 space-y-3">{(data?.mentees || []).map((mentee) => <div key={mentee.email} className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">{mentee.name}</p><p className="text-sm text-muted-foreground">{mentee.openTasks} nhiệm vụ mở · {mentee.approvedHours} giờ được ghi nhận</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{mentee.contributionScore}/100</span><button type="button" onClick={() => setSelected(mentee.email)} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Đánh giá</button></div></div>)}</div></StageCard></div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-3xl bg-card p-6"><h3 className="text-lg font-bold text-foreground">Cập nhật đóng góp</h3><input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} className="mt-5 w-full" /><p className="mt-2 text-center text-2xl font-bold text-primary">{score}/100</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhận xét ngắn" className="mt-4 min-h-24 w-full rounded-2xl border border-border bg-background p-3 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-xl px-4 py-2 text-sm">Huỷ</button><button type="button" onClick={save} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Lưu</button></div></div></div>}</TeamShell>;
}

export default function HugoTeamTab({ onBack, bio, onBioUpdate }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [me, setMe] = useState(null); // GET /me payload — status + dashboard data
  const [meLoaded, setMeLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const userStatus = me?.status ?? null;

  useEffect(() => { loadMe(); }, []);

  const loadMe = async () => {
    try {
      const session = getMemberSession();
      if (!session?.email) return;
      const res = await fetchHugoTeamRead(`${API_BASE}/hugoteam/me`);
      if (res.ok) setMe(await res.json());
    } catch (error) {
      console.error("Failed to load hugoteam profile:", error);
    } finally {
      setMeLoaded(true);
    }
  };

  useEffect(() => {
    if (!meLoaded || starting || (me?.assessmentStage && !["none", "in_progress"].includes(me.assessmentStage))) return;
    let active = true;
    setStarting(true);
    Promise.resolve(getMemberSession()).then((session) => fetch(`${API_BASE}/hugoteam/learning/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: session?.displayName || session?.name || "" }),
    })).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể mở bài học");
      if (active) {
        setStarting(false);
        await loadMe();
      }
    }).catch((error) => {
      if (active) {
        setStartError(error.message);
        setStarting(false);
      }
    });
    return () => { active = false; };
    // `starting` chỉ là trạng thái hiển thị; thêm nó vào deps sẽ huỷ request vừa bắt đầu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoaded, me?.assessmentStage]);

  if (!meLoaded || starting) return <TeamShell onBack={onBack}><p className="py-16 text-center text-sm text-muted-foreground">Đang mở bài học Hugo Team…</p></TeamShell>;
  if (startError) return <TeamShell onBack={onBack}><p className="py-16 text-center text-sm text-destructive">{startError}</p></TeamShell>;
  // Học xong mới nhận lời mời; chấp nhận xong mới vào Mentor/Team.
  if (me?.role === "mentor") return <MentorDashboard onBack={onBack} />;
  if (me?.assessmentStage === "coding") return <CodingStageDashboard onBack={onBack} reload={loadMe} bio={bio} onBioUpdate={onBioUpdate} />;
  if (me?.assessmentStage === "passed") return <TeamInvitation me={me} onBack={onBack} reload={loadMe} />;
  if (me?.assessmentStage === "mentor") return <TeamShell onBack={onBack}><MentorMonthDashboard me={me} /></TeamShell>;
  if (me?.assessmentStage === "team") return <TeamShell onBack={onBack}><TeamDashboard me={me} /></TeamShell>;
  if (userStatus === "approved") {
    const membershipEnd = me?.membershipEnd ? new Date(me.membershipEnd) : null;
    const daysRemaining = membershipEnd ? Math.ceil((membershipEnd - new Date()) / (24 * 60 * 60 * 1000)) : null;
    return (
      <TeamShell onBack={onBack}>
        {/* Dải VVIP: một dòng chữ, không khung — khung chỉ để trang trí. */}
        <p className="flex items-baseline justify-between gap-3 pb-3 pt-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          <span>{t("memberPortal.team.membershipEnds", { date: membershipEnd?.toLocaleDateString(locale), days: daysRemaining })}</span>
          <span className="shrink-0 font-bold" style={{ color: "var(--ax)" }}>VVIP</span>
        </p>
        <DevWorkspace me={me} reload={loadMe} locale={locale} />
      </TeamShell>
    );
  }

  return <TeamShell onBack={onBack}><div className="py-16 text-center"><p className="text-sm text-muted-foreground">Không thể xác định trạng thái Hugo Team.</p><button type="button" onClick={loadMe} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Tải lại</button></div></TeamShell>;
}

/* ───────────────────────── Dev Workspace (đã được duyệt) ───────────────────────── */

// Nhãn trạng thái đi bằng khoá, màu đi bằng class: bảng này nằm ngoài
// component nên không gọi được hook dịch, còn StatusChip thì gọi được.
const TASK_STATUS_META = {
  assigned:  { key: "statusAssigned",  cls: "bg-info/10 text-info" },
  doing:     { key: "statusDoing",     cls: "bg-warning/10 text-warning" },
  submitted: { key: "statusSubmitted", cls: "bg-primary/10 text-primary" },
  done:      { key: "statusDone",      cls: "bg-success/10 text-success" },
  cancelled: { key: "statusCancelled", cls: "bg-muted text-muted-foreground" },
};

const LOG_STATUS_META = {
  pending:  { key: "logPending",  cls: "bg-warning/10 text-warning" },
  approved: { key: "logApproved", cls: "bg-success/10 text-success" },
  rejected: { key: "logRejected", cls: "bg-destructive/10 text-destructive" },
};

// Ngày tháng cũng là ngôn ngữ: "vi-VN" cứng trong hàm này khiến người đọc
// tiếng Nhật thấy 13/08/2026 thay vì 2026/08/13.
const fmtDate = (d, locale) => (d ? new Date(d).toLocaleDateString(locale) : "—");

function StatusChip({ meta }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-bold ${meta.cls}`}>
      {t(`memberPortal.team.${meta.key}`)}
    </span>
  );
}

/**
 * Bảng làm việc: hàng đợi việc ở trên, dòng thời gian ở dưới.
 *
 * Bản cũ chia ba tab rời (Việc / Giờ / Trao đổi) nên muốn biết "hôm nay có gì"
 * phải mở lần lượt cả ba, và số việc đang mở bị lặp ở hai khối thống kê khác
 * nhau. Ở đây mọi thứ nằm trên một màn: việc cần tay mình thì nổi lên trên,
 * còn lại chảy xuống một dòng sự kiện lọc được.
 */
function DevWorkspace({ me, reload, locale }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState(null); // null | "message" | "hours"
  const stats = me?.stats || {};
  const goal = 500;
  const approved = stats.approvedHours || 0;
  const progress = Math.min(100, (approved / goal) * 100);
  const isMilestone = approved >= goal;

  const tasks = me.tasks || [];
  const openTasks = tasks.filter((task) => ["assigned", "doing", "submitted"].includes(task.status));

  // Mở bảng = đã đọc tin của admin. Trước đây phải bấm sang tab Trao đổi mới
  // đánh dấu, nên huy hiệu đỏ bám dai dù người dùng đã thấy nội dung.
  useEffect(() => {
    if ((me.messages || []).some((m) => m.from === "admin" && !m.readByDev)) {
      fetch(`${API_BASE}/hugoteam/me/messages/read`, { method: "POST" }).then(reload).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feed = buildFeed(me, t);
  const shown = filter === "all" ? feed : feed.filter((item) => item.kind === filter);

  const FILTERS = [
    { id: "all", label: t("memberPortal.team.filterAll") },
    { id: "task", label: t("memberPortal.team.sectionTasks") },
    { id: "hours", label: t("memberPortal.team.sectionHours") },
    { id: "message", label: t("memberPortal.team.sectionChat") },
  ];

  return (
    <div className="space-y-5">
      {/* Dải trạng thái: lời chào, membership và tiến độ giờ gộp trong một thẻ */}
      <section className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">
          {t("memberPortal.team.greeting", { name: me.name })}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[34px] font-bold leading-none tracking-[-0.02em]" style={{ color: isMilestone ? "#30D158" : "var(--ax)" }}>
            {approved}h
          </span>
          <span className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>/ {goal}h</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t-[0.5px] pt-3.5" style={{ borderColor: "var(--ios-sep)" }}>
          {[
            { value: openTasks.length, label: t("memberPortal.team.statOpenTasks") },
            { value: stats.doneTasks || 0, label: t("memberPortal.team.statDoneTasks") },
            { value: `${stats.pendingHours || 0}h`, label: t("memberPortal.team.pendingApproval") },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="text-[20px] font-semibold leading-none">{stat.value}</dd>
              <dt className="mt-1.5 text-[13px] leading-tight" style={{ color: "var(--ios-label-2)" }}>{stat.label}</dt>
            </div>
          ))}
        </dl>

        {isMilestone && (
          <p className="mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-semibold" style={{ background: "rgba(48,209,88,.12)", color: "#30D158" }}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">military_tech</span>
            {t("memberPortal.team.milestoneTitle")}
          </p>
        )}
      </section>

      {/* Hàng đợi: chỉ việc còn cần tay mình, mỗi thẻ đúng một hành động chính */}
      <section aria-labelledby="team-todo">
        <h2 id="team-todo" className="px-4 pb-1.5 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>
          {t("memberPortal.team.boardTodo")} · {openTasks.length}
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.allClear")}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {openTasks.map((task, index) => (
              <li key={task._id}>
                <TaskCard task={task} reload={reload} locale={locale} last={index === openTasks.length - 1} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Soạn: nhắn tin hoặc ghi giờ, mở ngay tại chỗ thay vì đổi tab */}
      <section>
        {composer === null ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="gray" size="md" full onClick={() => setComposer("hours")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
              {t("memberPortal.team.composerHours")}
            </Button>
            <Button variant="gray" size="md" full onClick={() => setComposer("message")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>
              {t("memberPortal.team.composerMessage")}
            </Button>
          </div>
        ) : (
          <div className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
            {composer === "hours"
              ? <HourForm tasks={tasks} reload={reload} onClose={() => setComposer(null)} />
              : <MessageForm reload={reload} onClose={() => setComposer(null)} />}
          </div>
        )}
      </section>

      {/* Dòng thời gian: việc, giờ và tin nhắn trộn chung theo thời gian */}
      <section aria-labelledby="team-feed">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <h2 id="team-feed" className="w-full px-4 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.boardFeed")}</h2>
          <Segmented items={FILTERS} value={filter} onChange={setFilter} className="w-full" />
        </div>

        {shown.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.feedEmpty")}
          </p>
        ) : (
          <ol className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {shown.map((item, index) => (
              <FeedRow key={item.id} item={item} locale={locale} reload={reload} last={index === shown.length - 1} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/** Trộn ba nguồn thành một danh sách sự kiện, mới nhất lên đầu. */
function buildFeed(me, t) {
  const events = [];
  for (const task of me.tasks || []) {
    events.push({
      id: `task-${task._id}`,
      kind: "task",
      at: task.assignedAt,
      icon: task.status === "done" ? "task_alt" : "assignment",
      title: task.title,
      detail: t(`memberPortal.team.${(TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned).key}`),
    });
  }
  for (const log of me.hourLogs || []) {
    events.push({
      id: `hours-${log._id}`,
      kind: "hours",
      at: log.date,
      icon: "schedule",
      title: t("memberPortal.team.eventHours", { hours: log.hours }),
      detail: log.note || t(`memberPortal.team.${(LOG_STATUS_META[log.status] || LOG_STATUS_META.pending).key}`),
      log,
    });
  }
  for (const message of me.messages || []) {
    events.push({
      id: `msg-${message._id}`,
      kind: "message",
      translatable: message.from === "admin",
      at: message.at,
      icon: "forum",
      title: message.from === "admin" ? t("memberPortal.team.eventMessageAdmin") : t("memberPortal.team.eventMessageDev"),
      detail: message.text,
    });
  }
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function FeedRow({ item, locale, reload, last }) {
  const { t, i18n } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [busy, setBusy] = useState(false);

  // Admin soạn bằng tiếng Việt hoặc tiếng Anh. Chỉ mời dịch khi ngôn ngữ Dev
  // đang chọn khác ngôn ngữ của tin — cùng thứ tiếng thì nút chỉ tổ vướng.
  const uiLanguage = languageCode(i18n.resolvedLanguage || i18n.language);
  const sourceLanguage = item.translatable ? guessLanguage(item.detail) : null;
  const offerTranslation = Boolean(item.translatable && canTranslate() && sourceLanguage !== uiLanguage);

  const toggleTranslation = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    setBusy(true);
    try {
      setTranslated(await translateText(item.detail, { from: sourceLanguage, to: uiLanguage }));
    } catch (error) {
      notify.error(t(error.message === "unavailable"
        ? "memberPortal.team.translateUnavailable"
        : "memberPortal.team.translateError"));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const ok = await notify.confirm({
      title: t("memberPortal.team.confirmWithdrawTitle"),
      message: t("memberPortal.team.confirmWithdrawDesc"),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours/${item.log._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastError"));
      notify.success(t("memberPortal.team.toastWithdrawn"));
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <li className="flex items-start gap-3 px-4">
      <span className="material-symbols-outlined mt-3.5 text-[18px]" style={{ color: "var(--ios-label-2)" }} aria-hidden="true">{item.icon}</span>
      <div className={`min-w-0 flex-1 py-3 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
        <p className="text-[15px] font-semibold leading-snug">{item.title}</p>
        {item.detail && (
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
            {translated ?? item.detail}
          </p>
        )}
        {item.translatable && offerTranslation && (
          <button
            type="button"
            onClick={toggleTranslation}
            disabled={busy}
            className="mt-1.5 text-[13px] font-semibold disabled:opacity-60"
            style={{ color: "var(--ax)" }}
          >
            {busy
              ? t("memberPortal.team.translating")
              : translated
                ? t("memberPortal.team.showOriginal")
                : t("memberPortal.team.translate")}
          </button>
        )}
        <p className="mt-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>{fmtDate(item.at, locale)}</p>
      </div>
      {item.log?.status === "pending" && (
        <button
          type="button"
          onClick={withdraw}
          aria-label={t("memberPortal.team.withdraw")}
          className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--ios-label-2)" }}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
        </button>
      )}
    </li>
  );
}

function TaskCard({ task, reload, locale, last }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState(task.devNote || "");

  const updateTask = async (body) => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastTaskUpdateError"));
      notify.success(body.status === "submitted" ? t("memberPortal.team.toastTaskSubmitted") : t("memberPortal.team.toastTaskUpdated"));
      setSubmitting(false);
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <article className={`px-4 py-3.5 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{task.title}</h3>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.assignedOn", { date: fmtDate(task.assignedAt, locale) })}
            {task.deadline && (
              <> {t("memberPortal.team.han")} <span className="font-semibold text-foreground">{fmtDate(task.deadline, locale)}</span></>
            )}
          </p>
        </div>
        <StatusChip meta={TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned} />
      </div>

      {task.guide && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-muted-foreground">{t("memberPortal.team.huongDanTuAdmin")}</summary>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">{task.guide}</p>
        </details>
      )}
      {task.adminNote && (
        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-primary/20 bg-primary/5 p-3 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">{t("memberPortal.team.nhanXetNghiemThu")} </span>
          {task.adminNote}
        </p>
      )}

      {task.status === "assigned" && (
        <Button variant="filled" size="sm" onClick={() => updateTask({ status: "doing" })} className="mt-3">
          {t("memberPortal.team.batDauThucHien")}
        </Button>
      )}

      {task.status === "doing" && (submitting ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("memberPortal.team.moTaNganNhung")}
            rows={3}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
          <div className="flex gap-2">
            <Button variant="filled" size="sm" onClick={() => updateTask({ status: "submitted", devNote: note })}>
              {t("memberPortal.team.xacNhanNop")}
            </Button>
            <Button variant="gray" size="sm" onClick={() => setSubmitting(false)}>
              {t("memberPortal.team.huy")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="filled" size="sm" onClick={() => setSubmitting(true)} className="mt-3">
          {t("memberPortal.team.nopTask")}
        </Button>
      ))}

      {task.status === "submitted" && task.devNote && (
        <p className="mt-3 text-[13px] italic text-muted-foreground">{t("memberPortal.team.ghiChuCuaBan")} {task.devNote}</p>
      )}
    </article>
  );
}

function HourForm({ tasks, reload, onClose }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, hours: "", note: "", taskId: "" });
  const [saving, setSaving] = useState(false);
  const linkable = tasks.filter((task) => ["doing", "submitted", "done"].includes(task.status));

  const submit = async () => {
    const hours = Number(form.hours);
    if (!form.date || !Number.isFinite(hours) || hours <= 0) {
      notify.error(t("memberPortal.team.toastInvalidHours"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours, taskId: form.taskId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastLogError"));
      notify.success(t("memberPortal.team.toastLogged"));
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.logHoursTitle")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldDate")}</span>
          <input
            type="date"
            max={today}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldHours")}</span>
          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={form.hours}
            onChange={(event) => setForm({ ...form, hours: event.target.value })}
            placeholder={t("memberPortal.team.hoursPlaceholder")}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
      </div>
      {linkable.length > 0 && (
        <label className="block space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldTask")}</span>
          <select
            value={form.taskId}
            onChange={(event) => setForm({ ...form, taskId: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          >
            <option value="">{t("memberPortal.team.noTask")}</option>
            {linkable.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
          </select>
        </label>
      )}
      <label className="block space-y-1.5 text-[13px]">
        <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldWhat")}</span>
        <input
          value={form.note}
          maxLength={500}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          placeholder={t("memberPortal.team.whatPlaceholder")}
          className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
        />
      </label>
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={submit} disabled={saving}>
          {saving ? t("memberPortal.team.saving") : t("memberPortal.team.logHours")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}

function MessageForm({ reload, onClose }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastSendError"));
      setText("");
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.composerMessage")}</p>
      <textarea
        value={text}
        maxLength={2000}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("memberPortal.team.chatPlaceholder")}
        className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
      />
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={send} disabled={sending || !text.trim()}>
          {sending ? t("memberPortal.team.saving") : t("memberPortal.team.send")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}
