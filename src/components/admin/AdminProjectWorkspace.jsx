import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { PROJECT_STATUSES, PROJECT_STATUS_ORDER, MOSCOW_LEVELS, MAX_CUSTOMER_EDITS } from "../../../shared/projectWorkflow";
import { PHASES, phaseOf, gateStatus, scrumSummary, SPRINT_CAPACITY } from "../../../shared/projectPhases";
import { Card, btn, field, fmtDT, useProjectCall } from "./AdminProjectContractPanel";
import ScopeWorkbench from "./AdminProjectScope";
import BriefDocument from "../contract/BriefDocument";
import { buildBrief } from "../../../shared/projectBrief";
import { scopeCompleteness } from "../../../shared/projectScope";

/**
 * Không gian làm việc theo GIAI ĐOẠN — admin chỉ thấy việc của bước hiện tại,
 * làm đủ điều kiện thì nút sang bước sau mới mở (server cũng chặn y hệt, xem
 * shared/projectPhases.js). Giai đoạn Phát triển có bảng Scrum.
 */

const TAB_LABEL = { work: "Việc giai đoạn này", brief: "Yêu cầu & phạm vi", money: "Tiền & phát sinh", log: "Nhật ký", handover: "Bàn giao & bảo hành", chat: "Trao đổi", contract: "Hợp đồng" };
const MOSCOW_LABEL = Object.fromEntries(MOSCOW_LEVELS.map((l) => [l.id, l.label]));

// ── Thanh 7 giai đoạn ────────────────────────────────────────────────────────
export function PhaseStepper({ project }) {
  const current = phaseOf(project.status);
  const ended = ["cancelled", "terminated"].includes(project.status);
  return (
    <ol className="grid grid-cols-7 gap-1">
      {PHASES.map((p) => {
        const state = ended ? "ended" : !current ? "todo" : p.no < current.no ? "done" : p.no === current.no ? "now" : "todo";
        return (
          <li key={p.id} className="min-w-0 text-center">
            <span className={`mx-auto grid size-8 place-items-center rounded-full text-sm font-semibold ${
              state === "done" ? "bg-foreground text-background" : state === "now" ? "bg-hue-blue text-background ring-4 ring-hue-blue/25" : "bg-muted text-muted-foreground"}`}>
              {state === "done" ? <span aria-hidden className="material-symbols-outlined text-[18px]">check</span> : p.no}
            </span>
            <span className={`mt-1.5 hidden text-[11px] leading-4 sm:block ${state === "now" ? "font-semibold" : "text-muted-foreground"}`}>{p.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Việc của giai đoạn hiện tại ──────────────────────────────────────────────
/** Bước tiến chính = trạng thái kế tiếp xa nhất theo thứ tự quy trình. */
function forwardSteps(status) {
  const next = (PROJECT_STATUSES[status]?.next || []).filter((s) => !["cancelled", "terminated"].includes(s));
  const idx = (s) => PROJECT_STATUS_ORDER.indexOf(s);
  return next.sort((a, b) => idx(b) - idx(a));
}

/** Vì sao điều kiện tự động chưa xong — để admin biết phải làm gì, không đoán. */
function autoHint(id, project) {
  const c = project.contract || {};
  if (id === "scopeReady") {
    const s = scopeCompleteness(project);
    return `Bản phạm vi mới đủ ${s.percent}%${s.missing[0] ? ` — còn thiếu: ${s.missing[0]}` : ""}`;
  }
  if (id === "contractAccepted") {
    if (!project.scope?.savedAt) return "Lưu bản phạm vi trước, rồi gửi link để khách xác nhận hợp đồng";
    return `Khách mới xác nhận phiên bản ${c.acceptedVersion || 0}; cần phiên bản ${project.scope.contractVersion} trở lên`;
  }
  if (id === "depositPaid") return "Ghi khoản khách đã chuyển (loại \"Đã thanh toán\") ở thẻ Tiền & phát sinh — đủ 50% gói chính là tự xong";
  return "Hệ thống tự đánh dấu khi dữ liệu đủ";
}

function Checklist({ project, toStatus, onGo, call, busy }) {
  const gate = gateStatus(project, toStatus);
  if (!gate.items.length) return <p className="text-sm text-muted-foreground">Bước này không cần điều kiện.</p>;
  return (
    <ul className="space-y-2">
      {gate.items.map((it) => {
        const autoOk = it.auto && it.auto(project);
        const canTick = it.manual && !autoOk;
        // Điều kiện tự động chưa xong: không phải ô tích — cả dòng là lối tắt tới thẻ cần làm.
        if (!it.done && !canTick) {
          const target = it.where && it.where !== "work" ? it.where : null;
          return (
            <li key={it.id}>
              <button type="button" disabled={!target} onClick={() => target && onGo(target)}
                className="flex w-full items-start gap-3 rounded-xl border border-dashed border-border p-3 text-left hover:bg-muted/50 disabled:hover:bg-transparent">
                <span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-muted-foreground">hourglass_empty</span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{it.label}</span>
                  <span className="block text-xs text-muted-foreground">{autoHint(it.id, project)}</span>
                </span>
                {target ? <span className="shrink-0 self-center text-xs font-semibold text-hue-blue">Mở thẻ {TAB_LABEL[target]} →</span> : null}
              </button>
            </li>
          );
        }
        return (
          <li key={it.id} className={`flex items-start gap-3 rounded-xl border p-3 ${it.done ? "border-success/30 bg-success/5" : "border-border"}`}>
            {canTick ? (
              <input type="checkbox" className="mt-0.5 size-5 shrink-0" disabled={busy} checked={it.done}
                onChange={(e) => call("/checklist", { body: { itemId: it.id, done: e.target.checked } })} />
            ) : (
              <span aria-hidden className={`material-symbols-outlined mt-0.5 shrink-0 text-[20px] ${it.done ? "text-success" : "text-muted-foreground"}`}>{it.done ? "check_circle" : "radio_button_unchecked"}</span>
            )}
            <span className="min-w-0 flex-1 text-sm">
              <span className={it.done ? "" : "font-medium"}>{it.label}</span>
              <span className="block text-xs text-muted-foreground">
                {it.done ? "Đã xong" : it.auto ? "Hệ thống tự đánh dấu khi xong" : "Bạn tự tích khi đã làm"}
                {!it.done && it.where && it.where !== "work" ? <> · <button type="button" onClick={() => onGo(it.where)} className="font-semibold text-hue-blue">Làm ở thẻ {TAB_LABEL[it.where]}</button></> : null}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PhaseWork({ project, onChange, onGo, onTransitioned }) {
  const { call, busy } = useProjectCall(project, onChange);
  const [note, setNote] = useState("");
  const phase = phaseOf(project.status);
  const status = PROJECT_STATUSES[project.status];
  const steps = forwardSteps(project.status);
  const [target, setTarget] = useState(steps[0] || "");
  useEffect(() => { setTarget(forwardSteps(project.status)[0] || ""); }, [project.status]);

  const move = async (toStatus) => {
    const s = PROJECT_STATUSES[toStatus];
    const ok = await notify.confirm({
      title: `Chuyển sang "${s.adminLabel}"?`,
      message: s.locksScope ? "Bước này KHOÁ phạm vi và bắt đầu tính ngày dự kiến." : "Nội dung bạn ghi sẽ in vào Phụ lục C của hợp đồng.",
      danger: toStatus === "cancelled",
    });
    if (!ok) return;
    const res = await call("", { method: "PUT", body: { status: toStatus, note } });
    if (res) { setNote(""); notify.success(`Đã sang "${s.adminLabel}"`); onTransitioned?.(); }
  };

  if (!phase) {
    return <Card title={status?.adminLabel || project.status} icon="block"><p className="text-sm text-muted-foreground">{status?.blurb}</p></Card>;
  }
  const gate = target ? gateStatus(project, target) : { ok: true, items: [] };

  return (
    <div className="space-y-4">
      <Card tone="border-hue-blue/30 bg-card">
        <p className="text-xs font-semibold text-hue-blue uppercase">Giai đoạn {phase.no}/7 · {status.adminLabel}</p>
        <h3 className="mt-1 text-lg font-semibold">{phase.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{phase.goal}</p>
      </Card>

      {phase.id === "build" ? <ScrumBoard project={project} onChange={onChange} /> : null}
      {phase.id === "intake" ? <ShareLinkCard project={project} /> : null}

      {steps.length ? (
        <Card title="Để sang bước tiếp theo" icon="flag">
          {steps.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {steps.map((s) => (
                <button key={s} type="button" onClick={() => setTarget(s)} className={`${btn} min-h-9 ${target === s ? "bg-foreground text-background" : "border border-border"}`}>
                  {PROJECT_STATUSES[s].adminLabel}
                </button>
              ))}
            </div>
          ) : null}
          <Checklist project={project} toStatus={target} onGo={onGo} call={call} busy={busy} />
          <label className="mt-4 block text-xs font-medium">Nội dung chi tiết của bước này (bắt buộc — in vào hợp đồng)
            <textarea rows={3} className={field} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Đã làm gì, bàn giao gì, khách cần làm gì tiếp. Ví dụ: Đã gửi bản thiết kế trang chủ v1 qua Zalo, chờ khách duyệt." />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy || !gate.ok || note.trim().length < 10} onClick={() => move(target)} className={`${btn} bg-foreground text-background`}>
              Chuyển sang "{PROJECT_STATUSES[target]?.adminLabel}"
              <span aria-hidden className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            {!gate.ok ? <span className="text-xs text-muted-foreground">Còn {gate.missing.length} điều kiện chưa xong.</span>
              : note.trim().length < 10 ? <span className="text-xs text-muted-foreground">Ghi nội dung chi tiết (ít nhất một câu).</span> : null}
          </div>
        </Card>
      ) : (
        <Card title="Đã tới bước cuối" icon="task_alt"><p className="text-sm text-muted-foreground">Dự án đã đóng. Bảo hành và duy trì vẫn quản lý ở các thẻ tương ứng.</p></Card>
      )}

      {(status?.next || []).includes("cancelled") ? (
        <details className="rounded-2xl border border-border p-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground">Khách muốn dừng dự án?</summary>
          <p className="mt-2 text-muted-foreground">Ghi lý do ở ô nội dung phía trên rồi bấm. Phần đã làm được giao lại tương ứng số tiền đã trả; khoản cọc không hoàn.</p>
          <button type="button" disabled={busy || note.trim().length < 10} onClick={() => move("cancelled")} className={`${btn} mt-2 border border-destructive/50 text-destructive`}>Dừng dự án</button>
        </details>
      ) : null}
    </div>
  );
}

function ShareLinkCard({ project }) {
  const copy = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${project._id}/share`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await navigator.clipboard.writeText(`${window.location.origin}${data.path}`);
      notify.success("Đã sao chép link cổng dự án — gửi cho khách qua Zalo hoặc email.");
    } catch (err) { notify.error(err.message); }
  };
  return (
    <Card title="Link cổng dự án cho khách" icon="link">
      <p className="text-sm text-muted-foreground">Khách bấm link là vào thẳng cổng dự án, điền phiếu yêu cầu, xem hợp đồng — không phải nhập mã.</p>
      <button type="button" onClick={copy} className={`${btn} mt-3 bg-foreground text-background`}><span aria-hidden className="material-symbols-outlined text-[18px]">content_copy</span>Sao chép link</button>
    </Card>
  );
}

// ── Scrum ────────────────────────────────────────────────────────────────────
const COLUMNS = [["todo", "Cần làm"], ["doing", "Đang làm"], ["review", "Chờ duyệt"], ["done", "Xong"]];

function ScrumBoard({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const [form, setForm] = useState({ title: "", moscow: "should", points: 2 });
  const [showAll, setShowAll] = useState(false);
  const sum = scrumSummary(project);
  const backlog = project.backlog || [];
  const visible = showAll ? backlog : backlog.filter((t) => t.sprint === sum.current);

  if (!backlog.length) {
    return (
      <Card title="Backlog" icon="view_kanban">
        <p className="text-sm text-muted-foreground">Hệ thống chia việc từ phiếu yêu cầu: mỗi trang, mỗi tính năng thành một việc theo mức khách chọn (Bắt buộc / Nên có / Có thì tốt), rồi xếp vào các sprint không quá {SPRINT_CAPACITY} điểm — vừa sức một người trong một tuần.</p>
        <button type="button" disabled={busy} onClick={() => call("/backlog/generate")} className={`${btn} mt-3 bg-foreground text-background`}>
          <span aria-hidden className="material-symbols-outlined text-[18px]">auto_awesome</span>Chia việc tự động
        </button>
      </Card>
    );
  }
  return (
    <Card title={`Sprint ${sum.current}/${Math.max(sum.lastSprint, sum.current)} · ${sum.sprintPoints} điểm`} icon="view_kanban"
      right={<span className="text-xs text-muted-foreground">Tổng tiến độ {sum.donePoints}/{sum.totalPoints} điểm</span>}>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${sum.totalPoints ? Math.round((sum.donePoints / sum.totalPoints) * 100) : 0}%` }} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {COLUMNS.map(([col, label]) => (
          <div key={col} className="rounded-xl bg-muted/50 p-2">
            <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground uppercase">{label} ({visible.filter((t) => t.state === col).length})</p>
            <ul className="space-y-2">
              {visible.filter((t) => t.state === col).map((t) => {
                const i = COLUMNS.findIndex((c) => c[0] === col);
                return (
                  <li key={t._id} className="rounded-lg border border-border bg-card p-2.5 text-sm">
                    <p className="font-medium leading-5">{t.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{MOSCOW_LABEL[t.moscow]} · {t.points} điểm{showAll ? ` · sprint ${t.sprint}` : ""}{t.visibleToCustomer ? "" : " · nội bộ"}</p>
                    <div className="mt-2 flex gap-1">
                      {i > 0 ? <button type="button" disabled={busy} onClick={() => call(`/backlog/${t._id}`, { method: "PATCH", body: { state: COLUMNS[i - 1][0] } })} className="rounded-md border border-border px-2 py-1 text-xs">←</button> : null}
                      {i < COLUMNS.length - 1 ? <button type="button" disabled={busy} onClick={() => call(`/backlog/${t._id}`, { method: "PATCH", body: { state: COLUMNS[i + 1][0] } })} className="flex-1 rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background">{COLUMNS[i + 1][1]} →</button> : null}
                      {col !== "done" ? <button type="button" disabled={busy} title="Bỏ việc" onClick={async () => { if (await notify.confirm({ title: "Bỏ việc này khỏi backlog?", message: t.title })) call(`/backlog/${t._id}`, { method: "PATCH", body: { remove: true } }); }} className="rounded-md px-1.5 text-xs text-muted-foreground">×</button> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`${btn} min-h-9 border border-border`}>{showAll ? "Chỉ sprint hiện tại" : "Xem toàn bộ backlog"}</button>
        <button type="button" disabled={busy} onClick={async () => {
          const ok = await notify.confirm({ title: `Đóng sprint ${sum.current}?`, message: sum.sprintDone ? "Mọi việc của sprint đã xong." : "Việc chưa xong sẽ dời sang sprint sau." });
          if (ok) call("/sprint/next");
        }} className={`${btn} min-h-9 ${sum.sprintDone ? "bg-foreground text-background" : "border border-border"}`}>Đóng sprint {sum.current} → sprint {sum.current + 1}</button>
      </div>
      <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_9rem_6rem_auto]" onSubmit={async (e) => { e.preventDefault(); if (await call("/backlog", { body: form })) setForm({ title: "", moscow: "should", points: 2 }); }}>
        <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Thêm việc (việc phát sinh trong phạm vi)" required minLength={3} />
        <select className={field} value={form.moscow} onChange={(e) => setForm({ ...form, moscow: e.target.value })}>
          {["must", "should", "could"].map((m) => <option key={m} value={m}>{MOSCOW_LABEL[m]}</option>)}
        </select>
        <input className={field} type="number" min="1" max="8" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} title="Điểm" />
        <button type="submit" disabled={busy} className={`${btn} border border-border`}>Thêm</button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">Việc ngoài phạm vi đã chốt thì thêm ở thẻ Tiền & phát sinh (tính phí), đừng thêm lặng lẽ vào đây.</p>
    </Card>
  );
}

// ── Yêu cầu khách ────────────────────────────────────────────────────────────
export function BriefView({ project, onChange }) {
  const c = project.customer || {};
  return (
    <div className="space-y-4">
      <Card title="Khách hàng" icon="person">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[["Họ tên", c.fullName || project.name], ["Tổ chức", c.orgName], ["Email", c.email], ["Điện thoại", c.phone]].map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
          ))}
        </dl>
      </Card>
      {project.estimate?.breakdown?.length ? (
        <Card title={`Ngày dự kiến · ${project.estimate.workingDays} ngày làm việc · xong ${project.estimate.dueAt ? new Date(project.estimate.dueAt).toLocaleDateString("vi-VN") : "—"}`} icon="schedule">
          <ul className="space-y-1.5 text-sm">{project.estimate.breakdown.map((b) => <li key={b.id} className="flex gap-3"><span className="w-10 shrink-0 font-semibold tabular-nums">+{b.days}</span><span>{b.label}</span></li>)}</ul>
        </Card>
      ) : null}
      {project.requirementsSubmittedAt ? <ScopeWorkbench project={project} onChange={onChange} /> : null}
      <Card title="Bảng yêu cầu của khách (A4)" icon="assignment">
        {!project.requirementsSubmittedAt ? <p className="text-sm text-muted-foreground">Khách chưa nộp phiếu. Gửi link cổng dự án ở thẻ Việc giai đoạn này.</p> : (
          <details open>
            <summary className="cursor-pointer text-sm font-medium">Nộp {fmtDT(project.requirementsSubmittedAt)} · khách đã sửa {project.customerEditCount || 0}/{MAX_CUSTOMER_EDITS} lần{project.scopeLockedAt ? " · phạm vi đã khoá" : ""}</summary>
            <div className="mt-3"><BriefDocument brief={buildBrief(project)} /></div>
          </details>
        )}
      </Card>
    </div>
  );
}

// ── Lịch sử trạng thái ───────────────────────────────────────────────────────
export function HistoryList({ project }) {
  return (
    <Card title={`Lịch sử dự án (${project.history?.length || 0})`} icon="history">
      <ol className="space-y-2.5">
        {[...(project.history || [])].reverse().map((h, i) => (
          <li key={`${h.at}-${i}`} className="flex gap-3 border-b border-border pb-2.5 text-sm last:border-0">
            <span className="w-28 shrink-0 text-xs text-muted-foreground">{fmtDT(h.at)}</span>
            <span className="min-w-0">
              <span className="font-medium">{h.action}</span>
              {h.fromStatus && h.toStatus ? <span className="text-muted-foreground"> · {PROJECT_STATUSES[h.fromStatus]?.adminLabel} → {PROJECT_STATUSES[h.toStatus]?.adminLabel}</span> : null}
              <span className="block text-xs text-muted-foreground">{h.actor === "system" ? "Hệ thống" : h.actor === "admin" ? "Admin" : "Khách"}{h.note ? ` — ${h.note}` : ""}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ── Trao đổi ─────────────────────────────────────────────────────────────────
export function ProjectChat({ project, onUnread }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${project._id}/messages`, { credentials: "include" });
      if (res.ok) setMessages(await res.json());
      await fetch(`${API_BASE}/customer-projects/${project._id}/messages/read`, { method: "PUT", credentials: "include" });
      onUnread?.(0);
    } catch { /* thử lại lần sau */ }
  }, [project._id, onUnread]);
  useEffect(() => { load(); }, [load]);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch(`${API_BASE}/customer-projects/${project._id}/messages`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }),
    });
    if (res.ok) { setText(""); load(); } else notify.error((await res.json().catch(() => ({}))).error || "Chưa gửi được");
  };
  return (
    <Card title="Trao đổi với khách" icon="forum">
      <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl bg-muted/50 p-3">
        {messages.length ? messages.map((m) => (
          <div key={m._id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.sender === "admin" ? "bg-foreground text-background" : "border border-border bg-card"}`}>
              <p className="whitespace-pre-wrap">{m.message}</p>
              <p className="mt-1 text-right text-[10px] opacity-60">{fmtDT(m.createdAt)}</p>
            </div>
          </div>
        )) : <p className="py-8 text-center text-sm text-muted-foreground">Chưa có tin nhắn.</p>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className={field} value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhắn cho khách…" />
        <button type="submit" disabled={!text.trim()} className={`${btn} shrink-0 bg-foreground text-background`}>Gửi</button>
      </form>
    </Card>
  );
}
