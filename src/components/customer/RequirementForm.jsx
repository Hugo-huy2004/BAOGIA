import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { REQUIREMENT_SECTIONS, MOSCOW_LEVELS, MAX_CUSTOMER_EDITS } from "../../../shared/projectWorkflow";
import { servicePackages } from "../../data/servicePackages";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { buildBrief } from "../../../shared/projectBrief";
import BriefDocument from "../contract/BriefDocument";

/**
 * Phiếu yêu cầu cho khách, dựng thẳng từ REQUIREMENT_SECTIONS — thêm câu hỏi ở
 * shared/projectWorkflow.js là form tự có, không sửa JSX.
 *
 * Mỗi kiểu ô lưu một dạng dữ liệu cố định, khớp với estimateProject():
 *   taglist → string[] · moscow → { must, should, could, wont } · colors → "#hex"[]
 *   references → { url, note }[] · package → id gói (hugo-one…) · còn lại → string
 */

const input = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-foreground/40";
const chip = (on) => `rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`;

function initialValues(saved) {
  const values = {};
  for (const section of REQUIREMENT_SECTIONS) {
    for (const f of section.fields) {
      if (saved?.[f.id] !== undefined) values[f.id] = saved[f.id];
      else if (f.default !== undefined) values[f.id] = f.default;
    }
  }
  return values;
}

function TagList({ field, value = [], onChange }) {
  const [draft, setDraft] = useState("");
  const toggle = (tag) => onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag]);
  const extra = value.filter((v) => !(field.suggestions || []).includes(v));
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {[...(field.suggestions || []), ...extra].map((tag) => (
          <button key={tag} type="button" className={chip(value.includes(tag))} onClick={() => toggle(tag)}>{tag}</button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className={input} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} className="shrink-0 rounded-xl border border-border px-4 text-sm font-medium">+</button>
      </div>
    </div>
  );
}

function Moscow({ field, value, onChange }) {
  const v = { must: [], should: [], could: [], wont: [], ...(value || {}) };
  const [draft, setDraft] = useState("");
  const all = [...new Set([...(field.suggestions || []), ...MOSCOW_LEVELS.flatMap((l) => v[l.id])])];
  const levelOf = (item) => MOSCOW_LEVELS.find((l) => v[l.id].includes(item))?.id || "";
  const set = (item, level) => {
    const next = Object.fromEntries(MOSCOW_LEVELS.map((l) => [l.id, v[l.id].filter((x) => x !== item)]));
    if (level) next[level] = [...next[level], item];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {all.map((item) => (
        <div key={item} className="flex flex-col gap-1.5 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm">{item}</span>
          <select className={`${input} sm:w-48`} value={levelOf(item)} onChange={(e) => set(item, e.target.value)}>
            <option value="">—</option>
            {MOSCOW_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      ))}
      <div className="flex gap-2">
        <input className={input} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { e.preventDefault(); set(draft.trim(), "should"); setDraft(""); } }} />
        <button type="button" onClick={() => { if (draft.trim()) { set(draft.trim(), "should"); setDraft(""); } }}
          className="shrink-0 rounded-xl border border-border px-4 text-sm font-medium">+</button>
      </div>
    </div>
  );
}

function Colors({ value = [], onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((c, i) => (
        <span key={i} className="flex items-center gap-1 rounded-full border border-border py-1 pr-2 pl-1">
          <input type="color" value={c} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            className="size-7 cursor-pointer rounded-full border-0 bg-transparent" />
          <span className="font-mono text-xs">{c}</span>
          <button type="button" aria-label="×" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground">×</button>
        </span>
      ))}
      {value.length < 6 ? (
        <button type="button" onClick={() => onChange([...value, "#4257d6"])} className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm">+</button>
      ) : null}
    </div>
  );
}

function References({ value = [], onChange, t }) {
  const rows = value.length ? value : [{ url: "", note: "" }];
  const update = (i, key, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-2">
          <input className={input} type="url" placeholder="https://" value={r.url} onChange={(e) => update(i, "url", e.target.value)} />
          <input className={input} placeholder={t("customerPortal.brief.refNote", "Bạn thích / không thích điều gì ở đó")} value={r.note} onChange={(e) => update(i, "note", e.target.value)} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { url: "", note: "" }])} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">+</button>
    </div>
  );
}

function PackagePicker({ value, onChange, t }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {servicePackages.map((p) => (
        <button key={p.id} type="button" onClick={() => onChange(p.id)}
          className={`rounded-xl border p-3.5 text-left transition-colors ${value === p.id ? "border-foreground bg-muted" : "border-border hover:border-foreground/40"}`}>
          <span className="block text-sm font-semibold">{p.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{t(`servicePkg.items.${p.id}.price.from`)}</span>
        </button>
      ))}
    </div>
  );
}

export default function RequirementForm({ project, onSaved }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => initialValues(project.requirements));
  const [saving, setSaving] = useState(false);
  const locked = Boolean(project.scopeLockedAt);
  const editsLeft = Math.max(0, MAX_CUSTOMER_EDITS - (project.customerEditCount || 0));
  const submitted = Boolean(project.requirementsSubmittedAt);
  const canEdit = !locked && (!submitted || editsLeft > 0);
  // Nộp xong thì xem dưới dạng Bảng yêu cầu A4; bấm "Sửa phiếu" mới mở lại form.
  const [editing, setEditing] = useState(!submitted);
  const brief = useMemo(() => (submitted ? buildBrief(project) : null), [submitted, project]);

  const missing = useMemo(() => REQUIREMENT_SECTIONS.flatMap((s) => s.fields)
    .filter((f) => f.required && (values[f.id] === undefined || values[f.id] === "" || (Array.isArray(values[f.id]) && !values[f.id].length)))
    .map((f) => f.label), [values]);

  const set = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (missing.length) {
      notify.warning(`${t("customerPortal.brief.missing", "Còn thiếu")}: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/customer-projects/me/requirements`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(t("customerPortal.brief.saved", "Đã gửi phiếu yêu cầu. Hugo Studio sẽ đọc và phản hồi sớm."));
      onSaved?.(data);
      setEditing(false);
    } catch (err) {
      notify.error(err.message || t("customerPortal.brief.error", "Chưa gửi được phiếu, bạn thử lại nhé."));
    } finally {
      setSaving(false);
    }
  };

  const render = (f) => {
    const v = values[f.id];
    switch (f.type) {
      case "textarea": return <textarea rows={4} className={input} value={v || ""} onChange={(e) => set(f.id, e.target.value)} />;
      case "select": return (
        <select className={input} value={v || ""} onChange={(e) => set(f.id, e.target.value)}>
          <option value="">—</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      case "taglist": return <TagList field={f} value={v} onChange={(x) => set(f.id, x)} />;
      case "moscow": return <Moscow field={f} value={v} onChange={(x) => set(f.id, x)} />;
      case "colors": return <Colors value={v} onChange={(x) => set(f.id, x)} />;
      case "references": return <References value={v} onChange={(x) => set(f.id, x)} t={t} />;
      case "package": return <PackagePicker value={v} onChange={(x) => set(f.id, x)} t={t} />;
      default: return (
        <input className={input} type={["email", "tel", "url", "date"].includes(f.type) ? f.type : "text"}
          placeholder={f.example || ""} value={v || ""} onChange={(e) => set(f.id, e.target.value)} />
      );
    }
  };

  if (submitted && !editing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
          <p className="min-w-0 flex-1">
            {locked
              ? t("customerPortal.brief.docLocked", "Đây là bảng yêu cầu Quý khách đã gửi. Phạm vi đã chốt; cần đổi gì, kính mời Quý khách nhắn ở mục Trao đổi.")
              : t("customerPortal.brief.docIntro", "Đây là bảng yêu cầu Quý khách đã gửi. Quý khách còn {{n}} lần tự sửa.", { n: editsLeft })}
          </p>
          {canEdit ? (
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background">
              <span aria-hidden className="material-symbols-outlined text-[18px]">edit</span>{t("customerPortal.brief.edit", "Sửa phiếu")}
            </button>
          ) : null}
        </div>
        <BriefDocument brief={brief} printLabel={t("customerPortal.brief.print", "In / lưu PDF")} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        {locked
          ? t("customerPortal.brief.locked", "Phạm vi đã chốt. Cần đổi gì, bạn nhắn Hugo Studio ở mục Trao đổi.")
          : submitted
            ? t("customerPortal.brief.editsLeft", "Bạn còn {{n}} lần tự sửa phiếu. Sau đó Hugo Studio sẽ chỉnh giúp.", { n: editsLeft })
            : t("customerPortal.brief.intro", "Điền càng rõ, Hugo Studio càng làm đúng ngay từ đầu. Chỉ vài ô có dấu * là bắt buộc.")}
      </div>

      <fieldset disabled={!canEdit || saving} className="space-y-10 disabled:opacity-70">
        {REQUIREMENT_SECTIONS.map((section, si) => (
          <section key={section.id}>
            <p className="text-xs font-semibold tracking-[.08em] text-muted-foreground uppercase">{si + 1} / {REQUIREMENT_SECTIONS.length}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-.02em]">{section.title}</h3>
            {section.intro ? <p className="mt-1 text-sm text-muted-foreground">{section.intro}</p> : null}
            <div className="mt-5 space-y-6">
              {section.fields.filter((f) => !f.showIf || values[f.showIf.field] === f.showIf.equals).map((f) => (
                <div key={f.id}>
                  <label className="block text-sm font-semibold">
                    {f.label}{f.required ? <span className="text-destructive"> *</span> : null}
                  </label>
                  {f.help ? <p className="mt-0.5 mb-2 text-xs leading-5 text-muted-foreground">{f.help}</p> : <div className="mb-2" />}
                  {render(f)}
                  {f.hint ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground italic">{f.hint}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </fieldset>

      {canEdit ? (
        <div className="sticky bottom-4 z-10">
          <button type="submit" disabled={saving} className="w-full rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-lg disabled:opacity-60">
            {saving ? t("customerPortal.brief.sending", "Đang gửi…") : submitted ? t("customerPortal.brief.update", "Cập nhật phiếu yêu cầu") : t("customerPortal.brief.submit", "Gửi phiếu yêu cầu")}
          </button>
        </div>
      ) : null}
    </form>
  );
}
