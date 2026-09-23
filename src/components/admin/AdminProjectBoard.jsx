import { useMemo, useState } from "react";
import {
  PROJECT_STATUSES, progressPercent,
  REQUIREMENT_SECTIONS, MOSCOW_LEVELS, MAX_CUSTOMER_EDITS,
} from "../../../shared/projectWorkflow";
import { notify } from "../../lib/notify";

/**
 * Một dự án, một màn hình.
 *
 * Nguyên tắc chống rối: màn này KHÔNG có ô chọn trạng thái. Nó chỉ hiện đúng
 * những bước máy trạng thái cho phép đi tiếp — thường là một hoặc hai nút. Cho
 * admin một danh sách 13 trạng thái để tự chọn là mời người ta bấm nhầm, và
 * mỗi lần bấm nhầm là một lá thư sai bay tới khách.
 *
 * Thứ tự khối theo đúng câu hỏi admin hỏi khi mở dự án lên: đang ở đâu → phải
 * làm gì tiếp → khách yêu cầu gì → đã xảy ra chuyện gì.
 */

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");


function Panel({ title, icon, children, tone = "" }) {
  return (
    <section className={`rounded-2xl border p-5 ${tone || "border-border bg-card"}`}>
      <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold">
        <span aria-hidden className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-muted text-[20px] text-foreground">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function AdminProjectBoard({ project, onTransition, onRefresh }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const status = PROJECT_STATUSES[project.status];
  const nextSteps = status?.next || [];

  const requirementLabels = useMemo(() => {
    const map = new Map();
    for (const section of REQUIREMENT_SECTIONS) {
      for (const field of section.fields) map.set(field.id, { ...field, section: section.title });
    }
    return map;
  }, []);

  const filledRequirements = useMemo(() => {
    const req = project.requirements || {};
    return Object.entries(req).filter(([, v]) =>
      v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && !v.length));
  }, [project.requirements]);

  const go = async (toStatus) => {
    const target = PROJECT_STATUSES[toStatus];
    const extra = target.requiresSourceZip
      ? " Bước này đòi đã tải tệp mã nguồn lên."
      : target.startsEstimate
        ? " Bước này KHOÁ phạm vi và bắt đầu tính ngày dự kiến."
        : "";
    const ok = await notify.confirm({
      title: `Chuyển sang "${target.adminLabel}"?`,
      message: (target.notify ? "Khách sẽ nhận một email báo trạng thái mới." : "Khách không nhận thông báo.") + extra,
      danger: toStatus === "cancelled",
    });
    if (!ok) return;
    setBusy(toStatus);
    try {
      await onTransition(project._id, toStatus, note.trim());
      setNote("");
      notify.success(`Đã chuyển sang "${target.adminLabel}".`);
      await onRefresh?.();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy("");
    }
  };

  const late = project.estimate?.dueAt && new Date(project.estimate.dueAt) < new Date()
    && !["closed", "cancelled"].includes(project.status);

  return (
    <div className="space-y-5">
      {/* ── Đang ở đâu ─────────────────────────────────────────────── */}
      <Panel title={`${project.projectId} · ${project.name}`} icon="folder_open">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">{status?.adminLabel}</span>
          <span className="text-sm text-muted-foreground">{progressPercent(project.status)}%</span>
          {project.estimate?.dueAt ? (
            <span className={`text-sm ${late ? "font-semibold text-rose-500" : "text-muted-foreground"}`}>
              Dự kiến xong {fmtDate(project.estimate.dueAt)}{late ? " · đã quá hạn" : ""}
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progressPercent(project.status)}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{status?.blurb}</p>
      </Panel>

      {/* ── Làm gì tiếp ────────────────────────────────────────────── */}
      <Panel title="Bước tiếp theo" icon="arrow_forward"
             tone={nextSteps.length ? "border-foreground/20 bg-muted/40" : ""}>
        {nextSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Dự án đã ở điểm cuối, không còn bước nào.</p>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ghi chú cho bước này (không bắt buộc) — sẽ lưu vào lịch sử dự án"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {nextSteps.map((id) => {
                const s = PROJECT_STATUSES[id];
                const danger = id === "cancelled";
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => go(id)}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                      danger ? "border border-border text-muted-foreground" : "bg-foreground text-background"
                    }`}
                  >
                    {busy === id ? "Đang xử lý…" : s.adminLabel}
                    {s.notify ? <span aria-hidden className="material-symbols-outlined ml-1.5 align-middle text-[15px]">mail</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Chỉ hiện những bước đi được từ trạng thái hiện tại. Biểu tượng thư nghĩa là khách sẽ nhận email.
            </p>
          </>
        )}
      </Panel>

      {/* ── Ngày dự kiến tính ra sao ───────────────────────────────── */}
      {project.estimate?.breakdown?.length ? (
        <Panel title={`Ngày dự kiến · ${project.estimate.workingDays} ngày làm việc`} icon="schedule">
          <ul className="space-y-2">
            {project.estimate.breakdown.map((b) => (
              <li key={b.id} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 font-semibold tabular-nums">+{b.days}</span>
                <span>
                  {b.label}
                  <span className="block text-xs text-muted-foreground">{b.note}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Chốt ngày {fmtDate(project.estimate.startedAt)} · hẹn ban đầu {fmtDate(project.estimate.originalDueAt)}
            {project.estimate.originalDueAt !== project.estimate.dueAt ? ` · hẹn hiện tại ${fmtDate(project.estimate.dueAt)}` : ""}
          </p>
        </Panel>
      ) : null}

      {/* ── Khách yêu cầu gì ───────────────────────────────────────── */}
      <Panel title="Phiếu yêu cầu" icon="assignment">
        {!project.requirementsSubmittedAt ? (
          <p className="text-sm text-muted-foreground">Khách chưa nộp phiếu.</p>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              Nộp {fmtDateTime(project.requirementsSubmittedAt)} · khách đã sửa {project.customerEditCount || 0}/{MAX_CUSTOMER_EDITS} lần
              {project.scopeLockedAt ? " · phạm vi đã khoá" : ""}
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {filledRequirements.map(([key, value]) => {
                const field = requirementLabels.get(key);
                const text = Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "object"
                    ? MOSCOW_LEVELS.map((l) => (value[l.id]?.length ? `${l.label}: ${value[l.id].join(", ")}` : null))
                        .filter(Boolean).join(" · ")
                    : String(value);
                return (
                  <div key={key} className="rounded-xl border border-border p-3">
                    <dt className="text-[0.7rem] text-muted-foreground">{field?.label || key}</dt>
                    <dd className="mt-0.5 text-sm">{text || "—"}</dd>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </Panel>

      {/* ── Đã xảy ra chuyện gì ────────────────────────────────────── */}
      <Panel title={`Lịch sử dự án · ${project.history?.length || 0} mục`} icon="history">
        <ol className="space-y-3">
          {[...(project.history || [])].reverse().map((h, i) => (
            <li key={`${h.at}-${i}`} className="flex gap-3 border-b border-border pb-3 text-sm last:border-b-0 last:pb-0">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{fmtDateTime(h.at)}</span>
              <span className="min-w-0">
                <span className="font-medium">{h.action}</span>
                {h.fromStatus && h.toStatus ? (
                  <span className="text-muted-foreground">
                    {" "}· {PROJECT_STATUSES[h.fromStatus]?.adminLabel} → {PROJECT_STATUSES[h.toStatus]?.adminLabel}
                  </span>
                ) : null}
                <span className="block text-xs text-muted-foreground">
                  {h.actor === "system" ? "Hệ thống" : h.actor === "admin" ? `Admin ${h.actorName || ""}` : "Khách"}
                  {h.note ? ` — ${h.note}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
