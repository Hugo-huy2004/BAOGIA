import { useState } from "react";
import { notify } from "../../lib/notify";
import { draftScope, openQuestions, scopeCompleteness, GOAL_EVENTS, MOSCOW_VI } from "../../../shared/projectScope";
import { Card, btn, field, fmtDT, useProjectCall } from "./AdminProjectContractPanel";

/**
 * Bàn làm việc của BA: phiếu khách kể → câu hỏi làm rõ → bản phạm vi hai bên ký.
 *
 *   1. Độ rõ: bản phạm vi đủ bao nhiêu phần, còn thiếu gì (cổng chốt phạm vi
 *      chỉ mở ở 100%).
 *   2. Câu hỏi còn mơ hồ: gửi thẳng vào khung trao đổi, khách trả lời thì ghi
 *      lại ở đây.
 *   3. Bản phạm vi: mục tiêu đo được, từng trang, từng tính năng kèm "nghiệm
 *      thu khi", danh sách KHÔNG làm. Lưu là thành Phụ lục A của hợp đồng.
 */

const EMPTY = { objective: "", kpis: [], persona: "", journey: "", pages: [], features: [], outOfScope: [], assumptions: [], risks: [], answers: {} };
const label = "mb-1 block text-xs font-medium text-muted-foreground";
const Lines = ({ value, onChange, disabled, placeholder }) => (
  <textarea className={`${field} min-h-[88px]`} disabled={disabled} placeholder={placeholder}
    value={(value || []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
);

function Rows({ title, hint, items, blank, render, onChange, disabled }) {
  const set = (i, patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div><p className="text-sm font-semibold">{title}</p>{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>
        {disabled ? null : <button type="button" className={`${btn} border border-border`} onClick={() => onChange([...items, blank])}>Thêm</button>}
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
            {render(it, (patch) => set(i, patch))}
            {disabled ? null : (
              <button type="button" className="justify-self-start text-xs text-muted-foreground hover:text-destructive sm:col-span-2" onClick={() => onChange(items.filter((_, j) => j !== i))}>Xoá dòng này</button>
            )}
          </div>
        ))}
        {!items.length ? <p className="text-sm text-muted-foreground">Chưa có dòng nào.</p> : null}
      </div>
    </div>
  );
}

export default function ScopeWorkbench({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const [draft, setDraft] = useState(() => (project.scope ? { ...EMPTY, ...project.scope } : null));
  const [extra, setExtra] = useState("");
  const locked = Boolean(project.scopeLockedAt);
  const put = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // Độ rõ tính trên bản đang sửa (chưa lưu thì vẫn thấy ngay mình đã đủ chưa).
  const live = draft ? { ...project, scope: { ...draft, savedAt: project.scope?.savedAt || "draft" } } : project;
  const completeness = scopeCompleteness(live);
  // Mọi câu hỏi mà phiếu còn mơ hồ — không lọc theo câu trả lời để ô không biến mất khi đang gõ.
  const questions = openQuestions({ ...project, scope: { answers: {} } });
  const answers = draft?.answers || project.scope?.answers || {};
  const unanswered = questions.filter((q) => !String(answers[q.id] || "").trim());
  const dirty = draft && JSON.stringify({ ...EMPTY, ...project.scope, savedAt: undefined, savedBy: undefined, contractVersion: undefined }) !== JSON.stringify({ ...draft, savedAt: undefined, savedBy: undefined, contractVersion: undefined });

  const makeDraft = async () => {
    if (draft && !(await notify.confirm({ message: "Dựng lại bản nháp từ phiếu? Những gì đang sửa (chưa lưu) sẽ mất." }))) return;
    setDraft({ ...draftScope(project), answers });
  };
  const save = async () => {
    const data = await call("/scope", { method: "PUT", body: draft });
    if (data) { setDraft({ ...EMPTY, ...data.project.scope }); notify.success(`Đã lưu. Hợp đồng lên phiên bản ${data.project.contract?.version}, chờ khách xác nhận.`); }
  };
  const ask = async () => {
    const data = await call("/scope/ask", { body: { ids: unanswered.map((q) => q.id), extra } });
    if (data) { setExtra(""); notify.success(`Đã gửi ${data.sent} câu hỏi vào khung Trao đổi.`); }
  };

  return (
    <div className="space-y-4">
      {/* 1 — Độ rõ */}
      <Card title="Độ rõ của phạm vi" icon="fact_check" right={<span className="text-sm font-semibold tabular-nums">{completeness.percent}%</span>}>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-foreground transition-[width]" style={{ width: `${completeness.percent}%` }} /></div>
        {completeness.missing.length ? (
          <ul className="mt-3 space-y-1 text-sm">{completeness.missing.map((m) => <li key={m} className="flex gap-2"><span aria-hidden className="material-symbols-outlined text-[18px] text-muted-foreground">radio_button_unchecked</span>{m}</li>)}</ul>
        ) : <p className="mt-3 text-sm">Đủ để chốt. Lưu bản phạm vi rồi chờ khách xác nhận hợp đồng.</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          {project.scope?.savedAt ? `Lưu lần cuối ${fmtDT(project.scope.savedAt)} · hợp đồng phiên bản ${project.scope.contractVersion}` : "Chưa lưu bản phạm vi."}
          {project.scope?.savedAt ? ((project.contract?.acceptedVersion || 0) >= project.scope.contractVersion ? " · khách đã xác nhận." : " · khách CHƯA xác nhận phiên bản này.") : ""}
          {locked ? ` · Phạm vi đã chốt ${fmtDT(project.scopeLockedAt)}; việc thêm ghi thành phát sinh.` : ""}
        </p>
      </Card>

      {/* 2 — Câu hỏi làm rõ */}
      {questions.length ? (
        <Card title={`Câu hỏi còn mơ hồ · ${unanswered.length}/${questions.length} chưa có trả lời`} icon="help">
          <p className="mb-3 text-xs text-muted-foreground">Phiếu khách để trống hoặc trả lời chung chung. Gửi cho khách, khách trả lời trong Trao đổi thì chép câu trả lời vào đây.</p>
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li key={q.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{i + 1}. {q.q}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Vì sao cần: {q.why}</p>
                <textarea className={`${field} mt-2 min-h-[64px]`} disabled={!draft || locked} placeholder={draft ? "Câu trả lời của khách" : "Tạo bản nháp phạm vi trước để ghi câu trả lời"}
                  value={answers[q.id] || ""} onChange={(e) => put({ answers: { ...answers, [q.id]: e.target.value } })} />
              </li>
            ))}
          </ol>
          {locked ? null : (
            <div className="mt-3 space-y-2">
              <textarea className={`${field} min-h-[64px]`} placeholder="Câu hỏi thêm của anh (không bắt buộc)" value={extra} onChange={(e) => setExtra(e.target.value)} />
              <button type="button" className={`${btn} bg-foreground text-background`} disabled={busy || (!unanswered.length && !extra.trim())} onClick={ask}>
                <span aria-hidden className="material-symbols-outlined text-[18px]">send</span>Gửi {unanswered.length} câu chưa trả lời cho khách
              </button>
            </div>
          )}
        </Card>
      ) : null}

      {/* 3 — Bản phạm vi */}
      <Card title="Bản phạm vi công việc (Phụ lục A)" icon="description"
        right={locked ? null : <button type="button" className={`${btn} border border-border`} onClick={makeDraft}>{draft ? "Dựng lại từ phiếu" : "Tạo bản nháp từ phiếu"}</button>}>
        {!draft ? <p className="text-sm text-muted-foreground">Hệ thống dựng sẵn bản nháp từ phiếu khách: mục tiêu, chỉ số đo, trang, tính năng kèm tiêu chí nghiệm thu. Anh chỉ cần sửa cho đúng.</p> : (
          <div className="space-y-5">
            <div>
              <label className={label}>Mục tiêu dự án — một câu, có hành động của khách</label>
              <textarea className={`${field} min-h-[64px]`} disabled={locked} value={draft.objective} onChange={(e) => put({ objective: e.target.value })} />
            </div>

            <Rows title="Chỉ số thành công (KPI)" hint="Con số hiện tại → mục tiêu → đo bằng sự kiện nào. Không có con số thì không biết web làm tốt hơn không."
              items={draft.kpis} blank={{ metric: "", baseline: "", target: "", measure: "" }} disabled={locked} onChange={(kpis) => put({ kpis })}
              render={(k, set) => (<>
                <div className="sm:col-span-2"><label className={label}>Chỉ số</label><input className={field} disabled={locked} value={k.metric} onChange={(e) => set({ metric: e.target.value })} /></div>
                <div><label className={label}>Hiện tại</label><input className={field} disabled={locked} placeholder="vd. 5 lượt/tháng" value={k.baseline} onChange={(e) => set({ baseline: e.target.value })} /></div>
                <div><label className={label}>Mục tiêu sau 3 tháng</label><input className={field} disabled={locked} placeholder="vd. 20 lượt/tháng" value={k.target} onChange={(e) => set({ target: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>Đo bằng</label><input className={field} disabled={locked} list="scope-events" value={k.measure} onChange={(e) => set({ measure: e.target.value })} /></div>
              </>)} />
            <datalist id="scope-events">{[...new Set(Object.values(GOAL_EVENTS).map((g) => g.event))].map((e) => <option key={e} value={`Sự kiện ${e} trong Google Analytics 4`} />)}</datalist>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={label}>Chân dung khách hàng — là ai, quyết định khi nào, do dự vì gì</label><textarea className={`${field} min-h-[96px]`} disabled={locked} value={draft.persona} onChange={(e) => put({ persona: e.target.value })} /></div>
              <div><label className={label}>Hành trình — nguồn khách → trang vào → hành động</label><textarea className={`${field} min-h-[96px]`} disabled={locked} value={draft.journey} onChange={(e) => put({ journey: e.target.value })} /></div>
            </div>

            <Rows title={`Trang · ${draft.pages.length}`} hint="Mỗi trang một mục đích, một hành động chính, và thế nào là xong."
              items={draft.pages} blank={{ name: "", purpose: "", primaryAction: "", acceptance: "" }} disabled={locked} onChange={(pages) => put({ pages })}
              render={(p, set) => (<>
                <div><label className={label}>Tên trang</label><input className={field} disabled={locked} value={p.name} onChange={(e) => set({ name: e.target.value })} /></div>
                <div><label className={label}>Hành động chính</label><input className={field} disabled={locked} value={p.primaryAction} onChange={(e) => set({ primaryAction: e.target.value })} /></div>
                <div><label className={label}>Mục đích</label><textarea className={`${field} min-h-[64px]`} disabled={locked} value={p.purpose} onChange={(e) => set({ purpose: e.target.value })} /></div>
                <div><label className={label}>Nghiệm thu khi</label><textarea className={`${field} min-h-[64px]`} disabled={locked} value={p.acceptance} onChange={(e) => set({ acceptance: e.target.value })} /></div>
              </>)} />

            <Rows title={`Tính năng · ${draft.features.length}`} hint="Tính năng Bắt buộc phải có tiêu chí nghiệm thu kiểm được."
              items={draft.features} blank={{ name: "", moscow: "should", acceptance: "" }} disabled={locked} onChange={(features) => put({ features })}
              render={(f, set) => (<>
                <div><label className={label}>Tính năng</label><input className={field} disabled={locked} value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
                <div><label className={label}>Mức ưu tiên</label>
                  <select className={field} disabled={locked} value={f.moscow} onChange={(e) => set({ moscow: e.target.value })}>
                    {Object.entries(MOSCOW_VI).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2"><label className={label}>Nghiệm thu khi</label><textarea className={`${field} min-h-[64px]`} disabled={locked} value={f.acceptance} onChange={(e) => set({ acceptance: e.target.value })} /></div>
              </>)} />

            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className={label}>KHÔNG thuộc phạm vi — mỗi dòng một ý</label><Lines disabled={locked} value={draft.outOfScope} onChange={(outOfScope) => put({ outOfScope })} /></div>
              <div><label className={label}>Giả định</label><Lines disabled={locked} value={draft.assumptions} onChange={(assumptions) => put({ assumptions })} /></div>
              <div><label className={label}>Rủi ro đã biết</label><Lines disabled={locked} value={draft.risks} onChange={(risks) => put({ risks })} /></div>
            </div>

            {locked ? null : (
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <button type="button" className={`${btn} bg-foreground text-background`} disabled={busy || !dirty} onClick={save}>Lưu bản phạm vi</button>
                <p className="text-xs text-muted-foreground">{dirty ? "Có thay đổi chưa lưu. Lưu là tạo hợp đồng phiên bản mới; khách phải xác nhận lại." : "Đã lưu."}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
