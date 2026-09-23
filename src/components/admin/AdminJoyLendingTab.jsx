import { useCallback, useEffect, useState } from "react";
import { adminBrainApi } from "../../services/api/modules/adminBrainApi";
import { notify } from "../../lib/notify";

/**
 * Quyền của admin với việc cho vay JOY.
 *
 * Trước màn này, admin gần như không có quyền gì: thuật toán chấm hạn mức hằng
 * tuần, còn người thì chỉ được duyệt lệnh cấm vĩnh viễn. Không xem được đang
 * cho vay bao nhiêu, không sửa được hạn mức của một người cụ thể, và không có
 * nút dừng khi có chuyện.
 *
 * Ba mức can thiệp, từ nhẹ tới nặng:
 *   1. Đặt hạn mức tay cho một người — thuật toán vẫn chấm, số này đứng trên.
 *   2. Tạm dừng một người vay.
 *   3. Dừng cho vay toàn hệ thống.
 */

const n = (v) => Number(v || 0).toLocaleString("vi-VN");

function Stat({ icon, label, value, sub, tone = "" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span aria-hidden className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-muted text-[20px] text-foreground">
        {icon}
      </span>
      <p className="mt-3 text-[0.7rem] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tracking-[-.02em] ${tone}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export default function AdminJoyLendingTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminBrainApi.getJoyLending()); }
    catch (error) { notify.error(error.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); notify.success("Đã cập nhật."); await load(); }
    catch (error) { notify.error(error.message); }
    finally { setBusy(""); }
  };

  /**
   * Ép chấm lại ngay. Thuật toán vốn chỉ chạy 17:00 thứ Bảy, nên khi thu nhập
   * của một người vừa đổi thì phải đợi tới cuối tuần — nút này bỏ qua chỗ đợi
   * đó. Nó KHÔNG đụng tới hạn mức tay: `effectiveLimit` vẫn ưu tiên ghi đè.
   */
  const reviewAll = async () => {
    const ok = await notify.confirm({
      title: "Xét lại hạn mức của tất cả?",
      message: "Chấm lại mọi hồ sơ đã nộp, ngay bây giờ. Ai đổi hạn mức sẽ nhận thông báo.",
    });
    if (!ok) return;
    return run("review", async () => {
      const r = await adminBrainApi.forceJoyReview();
      notify.info(`Đã xét ${r.scanned} hồ sơ · ${r.changed?.length || 0} hồ sơ đổi hạn mức.`);
    });
  };

  const reviewOne = (profile) => run(profile.email, async () => {
    const r = await adminBrainApi.forceJoyReview(profile.email);
    const change = r.changed?.[0];
    notify.info(change
      ? `${profile.email}: ${n(change.from)} → ${n(change.to)} JOY`
      : `${profile.email}: hạn mức không đổi.`);
  });

  const setLimit = async (profile) => {
    const raw = window.prompt(
      `Hạn mức tay cho ${profile.email}\n\nThuật toán đang chấm ${n(profile.autoLimit)} JOY.\nĐể trống rồi OK = gỡ hạn mức tay.`,
      profile.override?.limit ?? "",
    );
    if (raw === null) return;
    if (raw.trim() === "") {
      return run(profile.email, () => adminBrainApi.setJoyLimit({ email: profile.email, limit: null }));
    }
    const reason = window.prompt("Lý do (bắt buộc — số này đứng trên thuật toán):", profile.override?.reason || "");
    if (!reason?.trim()) return notify.error("Phải ghi lý do.");
    return run(profile.email, () => adminBrainApi.setJoyLimit({
      email: profile.email, limit: Number(raw), reason: reason.trim(), days: 90,
    }));
  };

  const toggleSuspend = async (profile) => {
    const suspend = !profile.suspendedAt;
    const reason = suspend ? window.prompt(`Lý do tạm dừng cho ${profile.email}:`) : "";
    if (suspend && !reason?.trim()) return;
    return run(profile.email, () => adminBrainApi.suspendJoyBorrower({
      email: profile.email, suspend, reason: reason?.trim() || "",
    }));
  };

  const togglePause = async () => {
    const paused = data.lending?.enabled !== false;
    const ok = await notify.confirm({
      title: paused ? "Dừng cho vay toàn hệ thống?" : "Mở lại cho vay?",
      message: paused
        ? "Không ai mở được lượt vay mới. Khoản đang chạy vẫn phải trả như thường."
        : "Mọi người đủ điều kiện sẽ vay được trở lại.",
      danger: paused,
    });
    if (!ok) return;
    const reason = paused ? window.prompt("Lý do dừng cho vay:") : "";
    if (paused && !reason?.trim()) return;
    return run("global", () => adminBrainApi.pauseJoyLending({ paused, reason: reason?.trim() || "" }));
  };

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Đang tính dư nợ…</p>;
  if (!data) return null;

  const { totals, loans, profiles, lending } = data;
  const paused = lending?.enabled === false;
  const btn = "rounded-full px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-.02em]">Cho vay JOY</h2>
          <p className="text-sm text-muted-foreground">
            {paused ? "Đang TẠM DỪNG cho vay toàn hệ thống." : "Đang mở cho vay."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reviewAll} disabled={busy === "review"}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {busy === "review" ? "Đang xét lại…" : "Xét lại tất cả"}
        </button>
        <button type="button" onClick={togglePause} disabled={busy === "global"}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${paused ? "bg-foreground text-background" : "border border-destructive/40 text-destructive"}`}>
          {paused ? "Mở lại cho vay" : "Dừng cho vay"}
        </button>
        </div>
      </div>

      {paused ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-semibold">Cho vay đang tạm dừng.</p>
          <p className="mt-1 text-muted-foreground">
            Lý do: {lending.pausedReason || "—"} · {lending.pausedBy || "?"} ·{" "}
            {lending.pausedAt ? new Date(lending.pausedAt).toLocaleString("vi-VN") : "—"}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="payments" label="Đang cho vay" value={`${n(totals.outstanding)} JOY`}
              sub={`${totals.borrowers} người đang nợ`} />
        <Stat icon="running_with_errors" label="Đang trễ hạn" value={`${n(totals.overdueAmount)} JOY`}
              sub={`${totals.overdue} người`} tone={totals.overdue ? "text-rose-500" : ""} />
        <Stat icon="account_balance" label="Hạn mức đã cấp chưa dùng" value={`${n(totals.headroom)} JOY`}
              sub="Rủi ro chưa phát sinh" />
        <Stat icon="block" label="Đã ghi sổ đen" value={n(totals.barred)}
              sub={`${totals.approved} hồ sơ đang được duyệt`} />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Khoản đang nợ · trễ hạn xếp trước</h3>
        {!loans.length ? <p className="text-sm text-muted-foreground">Không ai đang nợ.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead><tr className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Người vay</th>
                <th className="pb-2 pr-4 font-medium">Còn nợ</th>
                <th className="pb-2 pr-4 font-medium">Đã trả</th>
                <th className="pb-2 pr-4 font-medium">Hạn</th>
                <th className="pb-2 pr-4 font-medium">Trễ</th>
              </tr></thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.email} className="border-t border-border">
                    <td className="py-2 pr-4">{l.displayName || l.email}<span className="block text-xs text-muted-foreground">{l.email}</span></td>
                    <td className="py-2 pr-4 font-semibold tabular-nums">{n(l.outstanding)}</td>
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">{n(l.paid)}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{l.dueAt ? new Date(l.dueAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td className={`py-2 pr-4 font-semibold ${l.daysOverdue >= 21 ? "text-rose-500" : l.daysOverdue ? "text-amber-500" : "text-muted-foreground"}`}>
                      {l.daysOverdue ? `${l.daysOverdue} ngày` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold">Hạn mức từng người</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Thuật toán chấm lại mỗi thứ Bảy. Hạn mức tay đứng trên nó và tự hết hiệu lực sau 90 ngày —
          quyền ghi đè vĩnh viễn là thứ người ta đặt một lần rồi quên.
        </p>
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.email} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.email}</span>
                <span className="block text-xs text-muted-foreground">
                  máy chấm {n(p.autoLimit)} · đang dùng <strong className="text-foreground">{n(p.limit)}</strong>
                  {" · "}{p.source === "override" ? `admin đặt: ${p.reason}` : p.reason}
                  {p.loansDefaulted ? ` · quỵt ${p.loansDefaulted} lần` : ""}
                </span>
              </span>
              <button type="button" disabled={busy === p.email} onClick={() => reviewOne(p)}
                className={`${btn} border border-border`}>Xét lại</button>
              <button type="button" disabled={busy === p.email} onClick={() => setLimit(p)}
                className={`${btn} border border-border`}>Đặt hạn mức</button>
              <button type="button" disabled={busy === p.email} onClick={() => toggleSuspend(p)}
                className={`${btn} ${p.suspendedAt ? "bg-foreground text-background" : "border border-border"}`}>
                {p.suspendedAt ? "Mở lại" : "Tạm dừng"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
