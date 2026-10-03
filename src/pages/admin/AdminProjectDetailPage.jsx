import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { PROJECT_STATUSES } from "../../../shared/projectWorkflow";
import { getPackageFacts, marketOf } from "../../../shared/projectPackages";
import { phaseOf } from "../../../shared/projectPhases";
import { MoneySummary, MoneyTab, WorklogTab, HandoverTab, CareTab, ContractTab, TerminateTab, btn } from "../../components/admin/AdminProjectContractPanel";
import { PhaseStepper, PhaseWork, BriefView, HistoryList, ProjectChat } from "../../components/admin/AdminProjectWorkspace";

/**
 * Một dự án, một trục: ĐANG Ở ĐÂU → CẦN LÀM GÌ → TIỀN THẾ NÀO.
 *
 *   1. Đầu trang: khách, mã, gói, thị trường, giai đoạn.
 *   2. Tiền: tổng / đã thu / còn phải thu — luôn thấy, bấm vào là tới bảng tính.
 *   3. Thanh 7 giai đoạn (Waterfall).
 *   4. Thẻ "Việc giai đoạn này" là mặc định: điều kiện của bước hiện tại, nút
 *      sang bước sau (khoá tới khi đủ điều kiện), bảng Scrum khi đang phát triển.
 *      Các thẻ còn lại là chỗ làm những điều kiện đó (tiền, nhật ký, bàn giao…).
 *
 * Địa chỉ ghi nhớ thẻ đang mở (?tab=money) để tải lại trang không bị về đầu.
 */

const TABS = [
  ["work", "Việc giai đoạn này", "flag"],
  ["brief", "Yêu cầu & phạm vi", "assignment"],
  ["money", "Tiền & phát sinh", "payments"],
  ["log", "Nhật ký", "history_edu"],
  ["handover", "Bàn giao & bảo hành", "folder_zip"],
  ["care", "Duy trì", "event_repeat"],
  ["chat", "Trao đổi", "forum"],
  ["contract", "Hợp đồng", "contract"],
  ["terminate", "Chấm dứt", "gavel"],
];

export default function AdminProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([id]) => id === params.get("tab")) ? params.get("tab") : "work";
  const go = useCallback((id) => { setParams(id === "work" ? {} : { tab: id }, { replace: true }); }, [setParams]);
  const [project, setProject] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${projectId}`, { credentials: "include" });
      if (!res.ok) { notify.error("Không tìm thấy dự án"); navigate("/admin/projects"); return; }
      setProject(await res.json());
    } catch { notify.error("Không tải được dự án"); }
  }, [projectId, navigate]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!project?._id) return;
    fetch(`${API_BASE}/customer-projects/${project._id}/messages/unread-count`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { count: 0 })).then((d) => setUnread(d.count || 0)).catch(() => {});
  }, [project?._id]);

  if (!project) return <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">Đang tải dự án…</div>;

  const pkg = getPackageFacts(project.packageId);
  const status = PROJECT_STATUSES[project.status];
  const phase = phaseOf(project.status);
  const showCare = pkg?.id === "hugo-flow-plus" || project.maintenance?.active;
  const tabs = TABS.filter(([id]) => id !== "care" || showCare);
  const copyLink = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${project._id}/share`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await navigator.clipboard.writeText(`${window.location.origin}${data.path}`);
      notify.success("Đã sao chép link cổng dự án cho khách");
    } catch (err) { notify.error(err.message); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 text-foreground sm:px-6">
      {/* 1 — Đầu trang */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/admin/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <span aria-hidden className="material-symbols-outlined text-[18px]">arrow_back</span>Tất cả dự án
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.02em]">{project.customer?.fullName || project.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 font-mono font-semibold">{project.projectId}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{pkg?.label || project.packageId || "Chưa chọn gói"}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{marketOf(project.market).label} · {marketOf(project.market).currency.toUpperCase()}</span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ${["cancelled", "terminated"].includes(project.status) ? "bg-destructive/10 text-destructive" : "bg-hue-blue/10 text-hue-blue"}`}>
              {phase ? `Giai đoạn ${phase.no} · ` : ""}{status?.adminLabel || project.status}
            </span>
          </div>
        </div>
        <button type="button" onClick={copyLink} className={`${btn} border border-border`}>
          <span aria-hidden className="material-symbols-outlined text-[18px]">link</span>Link cho khách
        </button>
      </header>

      {/* 2 — Tiền */}
      <MoneySummary project={project} onGo={go} />

      {/* 3 — Giai đoạn */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <PhaseStepper project={project} />
      </div>

      {/* 4 — Thẻ */}
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {tabs.map(([id, label, icon]) => (
          <button key={id} type="button" onClick={() => go(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ${tab === id ? "bg-foreground text-background" : id === "terminate" ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:bg-muted"}`}>
            <span aria-hidden className="material-symbols-outlined text-[18px]">{icon}</span>{label}
            {id === "chat" && unread > 0 ? <span className="rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-white">{unread}</span> : null}
          </button>
        ))}
      </nav>

      <main>
        {tab === "work" && <PhaseWork project={project} onChange={setProject} onGo={go} onTransitioned={load} />}
        {tab === "brief" && <BriefView project={project} onChange={setProject} />}
        {tab === "money" && <MoneyTab project={project} onChange={setProject} />}
        {tab === "log" && (
          <div className="space-y-4">
            <WorklogTab project={project} onChange={setProject} defaultPhase={phase?.id === "test" ? "testing" : phase?.id === "handover" ? "handover" : "implementation"} />
            <HistoryList project={project} />
          </div>
        )}
        {tab === "handover" && <HandoverTab project={project} onChange={setProject} />}
        {tab === "care" && <CareTab project={project} onChange={setProject} />}
        {tab === "chat" && <ProjectChat project={project} onUnread={setUnread} />}
        {tab === "contract" && <ContractTab project={project} />}
        {tab === "terminate" && <TerminateTab project={project} onChange={setProject} />}
      </main>
    </div>
  );
}
