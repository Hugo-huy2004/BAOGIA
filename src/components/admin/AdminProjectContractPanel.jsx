import { useMemo, useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { PROJECT_PACKAGE_GROUPS, PROJECT_UNIT_PRICES, listPrice, formatMoney, marketOf, getPackageFacts } from "../../../shared/projectPackages";
import { buildContract, ledgerTotals, warrantyItems, effectiveAmount } from "../../../shared/projectContract";
import ContractDocument from "../contract/ContractDocument";

/**
 * Các khối quản lý một dự án — trang chi tiết dự án ghép mỗi khối thành một
 * thẻ. Mọi thao tác gửi lên server (projectContractService): server ghi lịch sử
 * và tăng phiên bản hợp đồng; các khối ở đây chỉ gửi lệnh và vẽ lại.
 *
 * Nguyên tắc: admin KHÔNG phải tự biết "loại khoản" hay tự tính tiền. Mỗi việc
 * là một nút có tên rõ ("Thêm lần chỉnh sửa"), giá lấy từ bảng giá theo thị
 * trường dự án, lần chỉnh tự đánh số (2 lần đầu miễn phí), và form luôn hiện
 * trước "cộng thêm bao nhiêu → tổng mới bao nhiêu".
 */

export const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/40";
export const btn = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-50";
export const fmtDT = (d) => (d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const FREE_REVISIONS = 2;

export function Card({ title, icon, children, tone = "", right = null }) {
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${tone || "border-border bg-card"}`}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            {icon ? <span aria-hidden className="material-symbols-outlined text-[20px]">{icon}</span> : null}{title}
          </h4>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Gọi API của một dự án; trả dữ liệu hoặc null (đã báo lỗi nguyên văn). */
export function useProjectCall(project, onChange) {
  const [busy, setBusy] = useState(false);
  const call = async (path, { method = "POST", body, form } = {}) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${project._id}${path}`, {
        method, credentials: "include",
        ...(form ? { body: form } : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thực hiện được");
      onChange?.(data.project || data);
      return data;
    } catch (err) {
      notify.error(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { call, busy };
}

export const useMoney = (project) => {
  const currency = marketOf(project.market).currency;
  return (n) => formatMoney(n, currency);
};

// ── Tóm tắt tiền (luôn nằm trên cùng trang) ─────────────────────────────────
export function MoneySummary({ project, onGo }) {
  const money = useMoney(project);
  const totals = useMemo(() => ledgerTotals(project), [project]);
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
      {[["Tổng hợp đồng", totals.total, ""], ["Đã thu", totals.paid, ""], ["Còn phải thu", totals.due, totals.due > 0 ? "text-destructive" : "text-success"]].map(([k, v, tone]) => (
        <button key={k} type="button" onClick={() => onGo?.("money")} className="bg-card p-3 text-left hover:bg-muted/60 sm:p-4">
          <span className="block text-xs text-muted-foreground">{k}</span>
          <span className={`mt-1 block text-base font-semibold tabular-nums sm:text-xl ${tone}`}>{money(v)}</span>
        </button>
      ))}
    </div>
  );
}

// ── Tiền & phát sinh ─────────────────────────────────────────────────────────
const ACTIONS = [
  ["revision", "Thêm lần chỉnh sửa", "edit_note"],
  ["addon", "Thêm gói lẻ", "add_box"],
  ["unit", "Thêm trang / phần", "post_add"],
  ["discount", "Giảm giá", "sell"],
  ["payment", "Ghi nhận tiền đã nhận", "payments"],
];
const GROUPS = [
  ["Gói chính", (e) => e.kind === "package"],
  ["Phát sinh", (e) => ["addon", "unit", "revision", "maintenance"].includes(e.kind)],
  ["Giảm giá", (e) => e.kind === "adjustment"],
];

function Preview({ project, add }) {
  const money = useMoney(project);
  const totals = ledgerTotals(project);
  return (
    <div className="rounded-xl bg-muted px-4 py-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">{add < 0 ? "Trừ khỏi hợp đồng" : "Cộng vào hợp đồng"}</span><span className="font-semibold tabular-nums">{money(add)}</span></div>
      <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Tổng mới</span><span className="font-semibold tabular-nums">{money(totals.total + add)}</span></div>
      <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Còn phải thu sau đó</span><span className="font-semibold tabular-nums">{money(Math.max(0, totals.due + add))}</span></div>
    </div>
  );
}

function ActionForm({ kind, project, call, busy, onDone }) {
  const money = useMoney(project);
  const totals = ledgerTotals(project);
  const revCount = (project.ledger || []).filter((e) => e.kind === "revision" && !e.voided).length;
  const mainId = getPackageFacts(project.packageId)?.id;
  const addonOptions = PROJECT_PACKAGE_GROUPS.find((g) => g.id === "addon").options.filter((o) => !o.appliesTo || o.appliesTo.includes(mainId));
  const [s, setS] = useState(() => ({
    itemId: kind === "addon" ? addonOptions[0]?.id : kind === "unit" ? PROJECT_UNIT_PRICES[0].id : "",
    qty: 1, detail: "", free: kind === "revision" ? revCount + 1 <= FREE_REVISIONS : false,
    discount: "", amount: kind === "payment" ? String(totals.due || "") : "",
  }));
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const unitPrice = kind === "revision" ? listPrice("revision", project.packageId, project.market) : listPrice(s.itemId, project.packageId, project.market);
  const disc = Number(s.discount) || 0;

  let add = 0;
  if (kind === "revision") add = s.free ? 0 : unitPrice;
  if (kind === "addon") add = s.free ? 0 : Math.max(0, unitPrice - disc);
  if (kind === "unit") add = s.free ? 0 : unitPrice * (Number(s.qty) || 1);
  if (kind === "discount") add = -disc;

  const submit = async (e) => {
    e.preventDefault();
    let body;
    if (kind === "revision") body = { kind: "revision", itemId: "revision", title: `Lần chỉnh thứ ${revCount + 1}${revCount + 1 <= FREE_REVISIONS ? " (trong 2 lần miễn phí)" : ""}`, amount: unitPrice, free: s.free, detail: s.detail };
    if (kind === "addon") body = { kind: "addon", itemId: s.itemId, amount: unitPrice, discount: disc, free: s.free, detail: s.detail };
    if (kind === "unit") body = { kind: "unit", itemId: s.itemId, title: PROJECT_UNIT_PRICES.find((u) => u.id === s.itemId)?.label, amount: unitPrice, quantity: Number(s.qty) || 1, free: s.free, detail: s.detail };
    if (kind === "discount") body = { kind: "adjustment", title: "Giảm giá", discount: disc, detail: s.detail };
    if (kind === "payment") body = { kind: "payment", title: s.detail ? `Nhận tiền — ${s.detail.slice(0, 60)}` : "Nhận tiền", amount: Number(s.amount), detail: s.detail };
    if (await call("/ledger", { body })) { notify.success("Đã cập nhật hợp đồng"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-2xl border border-foreground/20 bg-background p-4">
      {kind === "revision" ? (
        <>
          <p className="text-sm">Đây là <strong>lần chỉnh thứ {revCount + 1}</strong>. {revCount + 1 <= FREE_REVISIONS ? "Nằm trong 2 lần miễn phí của gói." : `Đã quá 2 lần miễn phí — đơn giá ${money(unitPrice)}.`}</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.free} onChange={(e) => set("free", e.target.checked)} /> Miễn phí lần này</label>
          <label className="text-xs font-medium">Khách yêu cầu chỉnh gì (bắt buộc — ghi nguyên văn vào hợp đồng)
            <textarea rows={4} className={field} value={s.detail} onChange={(e) => set("detail", e.target.value)} required minLength={5} placeholder="Ví dụ: Đổi màu nút sang xanh đậm, tăng cỡ chữ tiêu đề trang chủ, thay ảnh bìa bằng ảnh khách gửi ngày 28/9." />
          </label>
        </>
      ) : null}
      {kind === "addon" ? (
        <>
          <label className="text-xs font-medium">Gói lẻ
            <select className={field} value={s.itemId} onChange={(e) => set("itemId", e.target.value)}>
              {addonOptions.map((o) => <option key={o.id} value={o.id}>{o.label} — {money(listPrice(o.id, project.packageId, project.market))}{o.recurring ? " / tháng" : ""}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium">Giảm cho khách (nếu có)
              <input className={field} type="number" min="0" step="any" value={s.discount} onChange={(e) => set("discount", e.target.value)} disabled={s.free} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={s.free} onChange={(e) => set("free", e.target.checked)} /> Tặng miễn phí</label>
          </div>
          <label className="text-xs font-medium">Ghi chú
            <textarea rows={2} className={field} value={s.detail} onChange={(e) => set("detail", e.target.value)} />
          </label>
          {s.itemId === "flow-care-plan" ? <p className="text-xs text-muted-foreground">Gói duy trì tính theo tháng: dòng này là tháng đầu. Bật và gia hạn các tháng sau ở thẻ Duy trì.</p> : null}
        </>
      ) : null}
      {kind === "unit" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
            <label className="text-xs font-medium">Hạng mục
              <select className={field} value={s.itemId} onChange={(e) => set("itemId", e.target.value)}>
                {PROJECT_UNIT_PRICES.filter((u) => u.id !== "revision").map((u) => <option key={u.id} value={u.id}>{u.label} — {money(listPrice(u.id, project.packageId, project.market))}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium">Số lượng
              <input className={field} type="number" min="1" value={s.qty} onChange={(e) => set("qty", e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.free} onChange={(e) => set("free", e.target.checked)} /> Miễn phí</label>
          <label className="text-xs font-medium">Khách yêu cầu thêm gì (bắt buộc)
            <textarea rows={3} className={field} value={s.detail} onChange={(e) => set("detail", e.target.value)} required minLength={5} placeholder="Ví dụ: Thêm trang Tuyển dụng, có form nộp CV." />
          </label>
        </>
      ) : null}
      {kind === "discount" ? (
        <>
          <label className="text-xs font-medium">Số tiền giảm cho cả hợp đồng
            <input className={field} type="number" min="1" step="any" value={s.discount} onChange={(e) => set("discount", e.target.value)} required />
          </label>
          <label className="text-xs font-medium">Lý do (ghi vào hợp đồng)
            <textarea rows={2} className={field} value={s.detail} onChange={(e) => set("detail", e.target.value)} required minLength={5} placeholder="Ví dụ: Khách quen, giới thiệu thêm một dự án." />
          </label>
          <p className="text-xs text-muted-foreground">Muốn miễn phí hẳn một khoản đã có: bấm "Huỷ" ở khoản đó trong bảng tính tiền rồi thêm lại với ô "Miễn phí".</p>
        </>
      ) : null}
      {kind === "payment" ? (
        <>
          <label className="text-xs font-medium">Số tiền đã nhận (khách đang nợ {money(totals.due)})
            <input className={field} type="number" min="1" step="any" value={s.amount} onChange={(e) => set("amount", e.target.value)} required />
          </label>
          <label className="text-xs font-medium">Ghi chú (đợt nào, mã giao dịch, ngày chuyển)
            <input className={field} value={s.detail} onChange={(e) => set("detail", e.target.value)} placeholder="Ví dụ: Cọc 50% — mã GD 123456" />
          </label>
          <div className="rounded-xl bg-muted px-4 py-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Còn phải thu sau khi ghi</span><span className="font-semibold tabular-nums">{money(Math.max(0, totals.due - (Number(s.amount) || 0)))}</span></div>
          </div>
        </>
      ) : <Preview project={project} add={add} />}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={`${btn} bg-foreground text-background`}>Lưu vào hợp đồng</button>
        <button type="button" onClick={onDone} className={`${btn} border border-border`}>Huỷ</button>
      </div>
    </form>
  );
}

export function MoneyTab({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const money = useMoney(project);
  const totals = useMemo(() => ledgerTotals(project), [project]);
  const [open, setOpen] = useState("");
  const ledger = project.ledger || [];
  const live = ledger.filter((e) => !e.voided && !e.pending);
  const pending = ledger.filter((e) => !e.voided && e.pending);
  const voided = ledger.filter((e) => e.voided);
  const hasPackage = live.some((e) => e.kind === "package");
  const mainFacts = getPackageFacts(project.packageId);

  const voidEntry = async (e) => {
    const reason = window.prompt(`Huỷ "${e.title}". Lý do (ghi vào hợp đồng):`);
    if (reason) await call(`/ledger/${e._id}`, { method: "PATCH", body: { void: true, reason } });
  };
  const confirmEntry = async (e, mode) => {
    if (mode === "free") return call(`/ledger/${e._id}`, { method: "PATCH", body: { confirm: true, free: true } });
    const input = mode === "discount" ? window.prompt(`Giảm bao nhiêu cho "${e.title}"?`, "0") : "0";
    if (input === null) return null;
    return call(`/ledger/${e._id}`, { method: "PATCH", body: { confirm: true, discount: Number(input) || 0 } });
  };

  const Line = ({ e }) => {
    const amt = effectiveAmount(e);
    return (
      <li className="flex items-start justify-between gap-3 py-2.5">
        <span className="min-w-0 text-sm">
          <span className="font-medium">{e.title}{e.quantity > 1 ? ` × ${e.quantity}` : ""}</span>
          {e.free ? <span className="ml-1.5 rounded bg-muted px-1.5 text-xs">miễn phí</span> : null}
          {e.discount && e.kind !== "adjustment" ? <span className="ml-1.5 text-xs text-muted-foreground">(giảm {money(e.discount)})</span> : null}
          {e.detail ? <span className="block text-xs leading-5 text-muted-foreground">{e.detail}</span> : null}
          <span className="block text-[11px] text-muted-foreground">{fmtDT(e.at)}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-sm font-semibold tabular-nums ${amt < 0 ? "text-success" : ""}`}>{money(amt)}</span>
          <button type="button" onClick={() => voidEntry(e)} className="text-[11px] text-muted-foreground hover:text-destructive">Huỷ</button>
        </span>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <Card title="Thêm vào hợp đồng" icon="add_circle">
        <div className="flex flex-wrap gap-2">
          {!hasPackage && mainFacts ? (
            <button type="button" disabled={busy} onClick={() => call("/ledger", { body: { kind: "package", itemId: mainFacts.id } })} className={`${btn} bg-foreground text-background`}>
              <span aria-hidden className="material-symbols-outlined text-[18px]">inventory_2</span>Thêm gói chính {mainFacts.label} ({money(listPrice(mainFacts.id, project.packageId, project.market))})
            </button>
          ) : null}
          {ACTIONS.map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => setOpen(open === id ? "" : id)}
              className={`${btn} ${open === id ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}>
              <span aria-hidden className="material-symbols-outlined text-[18px]">{icon}</span>{label}
            </button>
          ))}
        </div>
        {open ? <ActionForm key={open} kind={open} project={project} call={call} busy={busy} onDone={() => setOpen("")} /> : null}
      </Card>

      {pending.length ? (
        <Card title={`Khách chọn — chờ bạn xác nhận (${pending.length})`} icon="pending_actions" tone="border-foreground/30 bg-muted/40">
          <ul className="divide-y divide-border">
            {pending.map((e) => (
              <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span><span className="font-medium">{e.title}</span> · {money(e.amount)}</span>
                <span className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => confirmEntry(e)} className={`${btn} min-h-9 bg-foreground text-background`}>Xác nhận giá gốc</button>
                  <button type="button" disabled={busy} onClick={() => confirmEntry(e, "discount")} className={`${btn} min-h-9 border border-border`}>Xác nhận + giảm</button>
                  <button type="button" disabled={busy} onClick={() => confirmEntry(e, "free")} className={`${btn} min-h-9 border border-border`}>Tặng miễn phí</button>
                  <button type="button" disabled={busy} onClick={() => voidEntry(e)} className={`${btn} min-h-9 text-muted-foreground`}>Từ chối</button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Bảng tính tiền" icon="receipt_long" right={<span className="text-xs text-muted-foreground">{marketOf(project.market).label} · {marketOf(project.market).currency.toUpperCase()}</span>}>
        {GROUPS.map(([label, test]) => {
          const rows = live.filter(test);
          if (!rows.length) return null;
          return (
            <div key={label} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
              <ul className="divide-y divide-border">{rows.map((e) => <Line key={e._id} e={e} />)}</ul>
            </div>
          );
        })}
        {!live.some((e) => e.kind !== "payment") ? <p className="text-sm text-muted-foreground">Chưa có khoản nào. Gói chính tự vào đây khi dự án sang giai đoạn Phân tích, hoặc bấm "Thêm gói chính".</p> : null}

        <div className="mt-3 space-y-1.5 border-t-2 border-foreground/80 pt-3 text-sm">
          <div className="flex justify-between font-semibold"><span>Tổng hợp đồng</span><span className="tabular-nums">{money(totals.total)}</span></div>
          {totals.paidRevisions ? <div className="flex justify-between text-muted-foreground"><span>Trong đó chỉnh sửa tính phí</span><span className="tabular-nums">{money(totals.paidRevisions)}</span></div> : null}
          {totals.savings ? <div className="flex justify-between text-muted-foreground"><span>Khách đã được giảm / miễn phí</span><span className="tabular-nums">{money(totals.savings)}</span></div> : null}
        </div>
        {live.some((e) => e.kind === "payment") ? (
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Đã thu</p>
            <ul className="divide-y divide-border">
              {live.filter((e) => e.kind === "payment").map((e) => (
                <li key={e._id} className="flex justify-between gap-3 py-2 text-sm">
                  <span>{e.title}<span className="block text-[11px] text-muted-foreground">{fmtDT(e.at)}</span></span>
                  <span className="flex flex-col items-end">
                    <span className="font-semibold tabular-nums">−{money(e.amount)}</span>
                    <button type="button" onClick={() => voidEntry(e)} className="text-[11px] text-muted-foreground hover:text-destructive">Huỷ</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm font-semibold">Còn phải thu</span>
          <span className={`text-2xl font-semibold tabular-nums ${totals.due > 0 ? "text-destructive" : "text-success"}`}>{money(totals.due)}</span>
        </div>
      </Card>

      {voided.length ? (
        <details className="rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">Khoản đã huỷ ({voided.length})</summary>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {voided.map((e) => <li key={e._id}><span className="line-through">{e.title} · {money(effectiveAmount(e))}</span> — {e.voidReason}</li>)}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// ── Nhật ký ──────────────────────────────────────────────────────────────────
export const PHASES = [["implementation", "Thực hiện"], ["addition", "Nội dung thêm vào"], ["testing", "Kiểm thử"], ["revision", "Chỉnh sửa"], ["handover", "Bàn giao"], ["note", "Ghi chú nội bộ"]];

export function WorklogTab({ project, onChange, defaultPhase = "implementation" }) {
  const { call, busy } = useProjectCall(project, onChange);
  const empty = { phase: defaultPhase, title: "", detail: "", visibleToCustomer: defaultPhase !== "note" };
  const [form, setForm] = useState(empty);
  const submit = async (e) => {
    e.preventDefault();
    if (await call("/worklog", { body: form })) { setForm(empty); notify.success("Đã ghi nhật ký"); }
  };
  return (
    <div className="space-y-4">
      <Card title="Ghi việc vừa làm" icon="history_edu">
        <form onSubmit={submit} className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {PHASES.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setForm({ ...form, phase: id, visibleToCustomer: id !== "note" })}
                className={`${btn} min-h-9 ${form.phase === id ? "bg-foreground text-background" : "border border-border"}`}>{label}</button>
            ))}
          </div>
          <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} placeholder="Việc đã làm — ví dụ: Kiểm thử form liên hệ trên iPhone và Android" />
          <textarea rows={4} className={field} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Chi tiết: làm gì, thiết bị nào, kết quả ra sao, khách cần làm gì tiếp…" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visibleToCustomer} onChange={(e) => setForm({ ...form, visibleToCustomer: e.target.checked })} /> Khách nhìn thấy (in vào Phụ lục C của hợp đồng)</label>
          <div><button type="submit" disabled={busy} className={`${btn} bg-foreground text-background`}>Ghi nhật ký</button></div>
        </form>
      </Card>
      <Card title={`Nhật ký (${project.worklog?.length || 0})`} icon="list">
        {project.worklog?.length ? (
          <ol className="space-y-3">
            {project.worklog.slice().reverse().map((w) => (
              <li key={w._id} className="border-l-2 border-border pl-3">
                <p className="text-xs text-muted-foreground">{fmtDT(w.at)} · {PHASES.find((p) => p[0] === w.phase)?.[1]}{w.visibleToCustomer ? "" : " · nội bộ"}</p>
                <p className="text-sm font-semibold">{w.title}</p>
                {w.detail ? <p className="text-sm whitespace-pre-line text-muted-foreground">{w.detail}</p> : null}
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">Chưa có mục nào.</p>}
      </Card>
    </div>
  );
}

// ── Bàn giao & bảo hành ──────────────────────────────────────────────────────
export function HandoverTab({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState({ fileUrl: "", fileName: "", checksum: "" });
  const [desc, setDesc] = useState("");
  const src = project.sourceDelivery || {};
  const items = warrantyItems(project);
  const upload = async (e) => {
    e.preventDefault();
    if (file) {
      const form = new FormData();
      form.append("file", file);
      if (await call("/source", { form })) { setFile(null); notify.success("Đã tải bản bàn giao lên"); }
    } else if (await call("/source", { body: link })) notify.success("Đã ghi đường dẫn bản bàn giao");
  };
  const resolve = async (k, status) => {
    const resolution = window.prompt(status === "fixed" ? "Đã sửa gì? (ghi vào phiếu bảo hành)" : "Vì sao không thuộc bảo hành? (dẫn điều khoản)");
    if (resolution) await call(`/warranty/claims/${k._id}`, { method: "PATCH", body: { status, covered: status === "fixed", resolution } });
  };
  return (
    <div className="space-y-4">
      <Card title="Bản bàn giao (.zip)" icon="folder_zip">
        {src.fileUrl ? (
          <dl className="mb-3 grid gap-1 text-sm">
            <div><dt className="inline text-muted-foreground">Tệp: </dt><dd className="inline font-medium"><a className="underline" href={src.fileUrl} target="_blank" rel="noreferrer">{src.fileName}</a></dd></div>
            <div><dt className="inline text-muted-foreground">Tải lên: </dt><dd className="inline">{fmtDT(src.uploadedAt)}</dd></div>
            <div><dt className="inline text-muted-foreground">SHA-256: </dt><dd className="inline font-mono text-xs break-all">{src.checksum || "—"}</dd></div>
          </dl>
        ) : <p className="mb-3 text-sm text-muted-foreground">Chưa có. Dự án chỉ sang bàn giao khi đã có tệp này.</p>}
        <form onSubmit={upload} className="grid gap-3">
          <input type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          {!file ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <input className={field} placeholder="Hoặc dán đường dẫn https://…zip" value={link.fileUrl} onChange={(e) => setLink({ ...link, fileUrl: e.target.value })} />
              <input className={field} placeholder="Tên tệp" value={link.fileName} onChange={(e) => setLink({ ...link, fileName: e.target.value })} />
              <input className={field} placeholder="SHA-256 (nếu có)" value={link.checksum} onChange={(e) => setLink({ ...link, checksum: e.target.value })} />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">Mã SHA-256 tính trên máy chủ từ chính tệp — căn cứ đối chiếu "mã đã bị sửa" khi bảo hành.</p>
          <div><button type="submit" disabled={busy || (!file && !link.fileUrl)} className={`${btn} bg-foreground text-background`}>{busy ? "Đang tải…" : src.fileUrl ? "Thay bản bàn giao" : "Lưu bản bàn giao"}</button></div>
        </form>
      </Card>

      <Card title="Phiếu bảo hành" icon="verified_user">
        {project.warranty?.startsAt ? (
          <>
            <p className="text-xs text-muted-foreground">Bàn giao lúc {fmtDT(project.warranty.startsAt)} · SHA-256 {project.warranty.checksum ? `${project.warranty.checksum.slice(0, 16)}…` : "—"}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {items.map((w) => <li key={w.title}><span className="font-medium">{w.title}</span>: {w.lifetime ? "Trọn đời" : w.subscription ? "Trong thời gian đăng ký" : `tới ${fmtDT(w.endsAt)}`}{w.contentEditUntil ? ` · đổi chữ, ảnh tới ${fmtDT(w.contentEditUntil)}` : ""}</li>)}
            </ul>
            <form onSubmit={async (e) => { e.preventDefault(); if (await call("/warranty/claims", { body: { description: desc } })) setDesc(""); }} className="mt-4 grid gap-2">
              <textarea rows={2} className={field} value={desc} onChange={(e) => setDesc(e.target.value)} required minLength={10} placeholder="Ghi yêu cầu bảo hành khách báo qua kênh khác: trang nào, thiết bị, trình duyệt, lỗi ra sao" />
              <div><button type="submit" disabled={busy} className={`${btn} border border-border`}>Ghi yêu cầu bảo hành</button></div>
            </form>
          </>
        ) : <p className="text-sm text-muted-foreground">Bảo hành bắt đầu khi dự án sang giai đoạn Bàn giao.</p>}
      </Card>

      {project.warranty?.claims?.length ? (
        <Card title={`Các lần bảo hành (${project.warranty.claims.length})`} icon="build">
          <ul className="space-y-3">
            {project.warranty.claims.slice().reverse().map((k) => (
              <li key={k._id} className="rounded-xl border border-border p-3 text-sm">
                <p className="text-xs text-muted-foreground">{k.code} · báo lúc {fmtDT(k.reportedAt)} · {k.reportedBy === "admin" ? "admin ghi" : "khách báo"}</p>
                <p className="mt-1">{k.description}</p>
                {k.status === "open" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={() => resolve(k, "fixed")} className={`${btn} min-h-9 bg-foreground text-background`}>Đã sửa</button>
                    <button type="button" disabled={busy} onClick={() => resolve(k, "rejected")} className={`${btn} min-h-9 border border-border`}>Không thuộc bảo hành</button>
                  </div>
                ) : <p className="mt-1 text-xs text-muted-foreground">{k.status === "fixed" ? "Đã sửa" : "Từ chối"} lúc {fmtDT(k.resolvedAt)} — {k.resolution}</p>}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

// ── Duy trì ──────────────────────────────────────────────────────────────────
export function CareTab({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const money = useMoney(project);
  const m = project.maintenance || {};
  const fee = listPrice("flow-care-plan", project.packageId, project.market);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const periods = (project.ledger || []).filter((e) => e.kind === "maintenance" && !e.voided);
  return (
    <div className="space-y-4">
      <Card title="Gói duy trì hằng tháng" icon="event_repeat">
        <p className="text-sm">
          {m.active ? <>Đang dùng · {money(m.monthlyFee)} / tháng · đã trả tới <strong>{m.paidThrough ? new Date(m.paidThrough).toLocaleDateString("vi-VN") : "chưa có tháng nào"}</strong></> : "Chưa bật."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Chỉ gia hạn khi bạn xác nhận đã nhận phí — không tự trừ tiền. Mỗi lần xác nhận ghi một tháng vào Phụ lục E và bảng tính tiền.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!m.active ? (
            <button type="button" disabled={busy} onClick={() => call("/maintenance", { body: { action: "start" } })} className={`${btn} bg-foreground text-background`}>Bật gói duy trì ({money(fee)} / tháng)</button>
          ) : (
            <button type="button" disabled={busy} onClick={() => { const reason = window.prompt("Lý do dừng (khách báo trước 1 tháng…):"); if (reason) call("/maintenance", { body: { action: "stop", note: reason } }); }} className={`${btn} border border-border`}>Dừng gói duy trì</button>
          )}
        </div>
      </Card>
      {m.active ? (
        <Card title="Khách đã chuyển phí tháng mới?" icon="payments">
          <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
            <input className={field} type="number" min="0" step="any" placeholder={String(m.monthlyFee)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className={field} placeholder="Ghi chú (mã giao dịch, ngày chuyển…)" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" disabled={busy} onClick={async () => { if (await call("/maintenance", { body: { action: "verify", amount: amount === "" ? undefined : Number(amount), note } })) { setAmount(""); setNote(""); notify.success("Đã gia hạn thêm một tháng"); } }} className={`${btn} bg-foreground text-background`}>Xác nhận & gia hạn 1 tháng</button>
          </div>
        </Card>
      ) : null}
      <Card title="Các tháng đã ghi" icon="calendar_month">
        {periods.length ? <ul className="space-y-1 text-sm">{periods.slice().reverse().map((e) => <li key={e._id}>{e.period} · {money(e.amount)} · {fmtDT(e.at)}{e.detail ? ` — ${e.detail}` : ""}</li>)}</ul> : <p className="text-sm text-muted-foreground">Chưa có tháng nào.</p>}
      </Card>
    </div>
  );
}

// ── Hợp đồng ─────────────────────────────────────────────────────────────────
export function ContractTab({ project }) {
  const [lang, setLang] = useState(project.market === "international" ? "en" : "vi");
  const contract = useMemo(() => buildContract(project, { lang }), [project, lang]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {["vi", "en"].map((l) => (
          <button key={l} type="button" onClick={() => setLang(l)} className={`${btn} min-h-9 ${lang === l ? "bg-foreground text-background" : "border border-border"}`}>{l === "vi" ? "Tiếng Việt" : "English"}</button>
        ))}
        <button type="button" onClick={() => window.print()} className={`${btn} min-h-9 border border-border`}>
          <span aria-hidden className="material-symbols-outlined text-[18px]">download</span>Tải PDF
        </button>
        <span className="text-xs text-muted-foreground">
          v{project.contract?.version || 0} · {project.contract?.acceptedVersion ? `khách đã xác nhận v${project.contract.acceptedVersion} lúc ${fmtDT(project.contract.acceptedAt)}` : "khách chưa xác nhận"} · bản gốc: {project.market === "international" ? "tiếng Anh" : "tiếng Việt"}
        </span>
      </div>
      <ContractDocument contract={contract} />
    </div>
  );
}

// ── Chấm dứt ─────────────────────────────────────────────────────────────────
const CLAUSES = [
  ["11.2(a)", "Chậm thanh toán quá 15 ngày"],
  ["11.2(b)", "Dùng sản phẩm cho nội dung / mục đích vi phạm pháp luật"],
  ["11.2(c)", "Cung cấp thông tin sai sự thật"],
  ["11.2(d)", "Xúc phạm, đe doạ, quấy rối"],
  ["11.2(e)", "Sao chép, bán lại khung mã dùng chung"],
  ["11.2(f)", "Truy cập trái phép hệ thống, tài khoản"],
];

export function TerminateTab({ project, onChange }) {
  const { call, busy } = useProjectCall(project, onChange);
  const [clause, setClause] = useState(CLAUSES[0][0]);
  const [reason, setReason] = useState("");
  if (project.termination?.at) {
    return (
      <Card tone="border-destructive/40 bg-destructive/5" title="Hợp đồng đã chấm dứt" icon="gavel">
        <p className="text-sm">Hiệu lực lúc {fmtDT(project.termination.at)} · căn cứ {project.termination.clause}</p>
        <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{project.termination.reason}</p>
      </Card>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    const ok = await notify.confirm({
      title: "Chấm dứt hợp đồng ngay?",
      message: `Căn cứ ${clause}. Có hiệu lực ngay; thông báo được đăng vào cổng dự án (và email nếu đã cấu hình). Việc và duy trì dừng; không gia hạn, không mở lại. Bảo hành phần khách đã trả đủ vẫn giữ, trừ khoản (b), (e), (f).`,
      confirmText: "Chấm dứt", danger: true,
    });
    const res = ok ? await call("/terminate", { body: { clause, reason } }) : null;
    if (res) {
      if (res.notice?.email) notify.success("Đã chấm dứt. Thông báo đã gửi qua cổng dự án và email.");
      else notify.warning("Đã chấm dứt. Thông báo đã đăng vào cổng dự án, nhưng email CHƯA gửi được — hãy gửi thêm qua email/Zalo để đủ căn cứ đã thông báo.");
    }
  };
  return (
    <Card tone="border-destructive/40 bg-card" title="Chấm dứt hợp đồng do khách vi phạm (Điều 11.2)" icon="gavel">
      <form onSubmit={submit} className="grid gap-3">
        <select className={field} value={clause} onChange={(e) => setClause(e.target.value)}>
          {CLAUSES.map(([id, label]) => <option key={id} value={id}>{id} — {label}</option>)}
        </select>
        <textarea rows={4} className={field} value={reason} onChange={(e) => setReason(e.target.value)} required
          placeholder="Hành vi vi phạm cụ thể, thời điểm, bằng chứng trên cổng dự án (tin nhắn, nhật ký, bản ZIP đối chiếu)…" />
        <p className="text-xs text-muted-foreground">Chỉ dùng khi có bằng chứng. Điều 428 BLDS yêu cầu thông báo ngay cho bên kia: hệ thống đăng thông báo vào cổng dự án và gửi email nếu đã cấu hình. Khoản khách còn nợ vẫn phải thanh toán.</p>
        <div><button type="submit" disabled={busy || reason.trim().length < 20} className={`${btn} bg-destructive text-destructive-foreground`}>Chấm dứt hợp đồng</button></div>
      </form>
    </Card>
  );
}
