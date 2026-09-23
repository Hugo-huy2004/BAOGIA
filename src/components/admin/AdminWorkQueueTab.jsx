import { useCallback, useEffect, useState } from "react";
import { adminBrainApi } from "../../services/api/modules/adminBrainApi";
import { notify } from "../../lib/notify";

/**
 * Hàng đợi việc chờ người duyệt — toàn hệ thống.
 *
 * Vì sao màn này tồn tại: hồ sơ 360° chỉ trả lời "người NÀY đang chờ gì", mà
 * admin không ngồi mở từng hồ sơ để dò. Trước đó đơn kháng nghị mở khoá và
 * giao dịch JOY bị giữ nằm chờ vô thời hạn chỉ vì không màn hình nào liệt kê.
 *
 * Xếp CŨ TRƯỚC và hiện rõ số ngày đã chờ: thứ treo lâu nhất là thứ đáng lo
 * nhất, không phải thứ mới nhất.
 *
 * CỐ Ý CHƯA CÓ lịch hẹn và dự án khách hàng — hai phần đó sắp đổi hẳn cấu trúc.
 */

const daysWaiting = (iso) => {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return Number.isFinite(days) ? days : null;
};

function Waited({ since }) {
  const days = daysWaiting(since);
  if (days === null) return null;
  const tone = days >= 7 ? "text-rose-500" : days >= 3 ? "text-amber-500" : "text-muted-foreground";
  return (
    <span className={`text-[0.7rem] font-semibold ${tone}`}>
      {days === 0 ? "hôm nay" : `đã chờ ${days} ngày`}
    </span>
  );
}

function Card({ title, subtitle, since, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Waited since={since} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Section({ icon, title, items, empty, children }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
        <span aria-hidden className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-muted text-[20px] text-foreground">
          {icon}
        </span>
        {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{items.length}</span>
      </h3>
      {items.length ? <div className="space-y-3">{children}</div>
        : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

export default function AdminWorkQueueTab({ onOpenUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  // Bộ quét gian lận đã có đủ backend + audit từ lâu nhưng CHƯA TỪNG được nối
  // vào màn hình nào, nên chưa ai bấm lần nào. Nó nằm ở đây vì kết quả quét là
  // một dạng việc chờ người quyết, đúng chỗ của hàng đợi.
  const [risks, setRisks] = useState(null);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminBrainApi.getWorkQueue(100));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (key, run, question, danger = false) => {
    if (!(await notify.confirm({ title: "Xác nhận", message: question, danger }))) return;
    setBusy(key);
    try {
      await run();
      notify.success("Đã xử lý.");
      await load();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy("");
    }
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const result = await adminBrainApi.runAutoModerationScan();
      setRisks(result?.flags || result?.risks || []);
      notify.success(`Quét xong: ${(result?.flags || result?.risks || []).length} dấu hiệu.`);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Đang gom việc đang chờ…</p>;
  if (!data) return null;

  const { queue, counts, failed } = data;
  const btn = "rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50";
  const solid = `${btn} bg-foreground text-background`;
  const ghost = `${btn} border border-border`;

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-.02em]">Việc đang chờ duyệt</h2>
          <p className="text-sm text-muted-foreground">
            {counts.total === 0 ? "Không còn việc nào tồn đọng." : `${counts.total} việc đang chờ người quyết.`}
          </p>
        </div>
        <button type="button" onClick={load} className={ghost}>Tải lại</button>
      </div>

      {/* Mảng nào hỏng phải nói ra: danh sách rỗng vì lỗi trông y hệt danh sách
          rỗng vì đã xử lý hết. */}
      {failed?.length ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">{failed.length} mảng chưa đọc được — danh sách dưới đây CHƯA đầy đủ:</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {failed.map((f) => <li key={f.section}>· {f.section}: {f.error}</li>)}
          </ul>
        </div>
      ) : null}

      <Section icon="gavel" title="Kháng nghị mở khoá" items={queue.appeals}
               empty="Không có đơn kháng nghị nào đang chờ.">
        {queue.appeals.map((appeal) => (
          <Card key={appeal._id} title={appeal.email || "(không rõ email)"}
                subtitle={`Mã vụ ${appeal.caseId || "—"}${appeal.lat ? ` · vị trí ${appeal.lat}, ${appeal.lng}` : ""}`}
                since={appeal.createdAt}>
            {appeal.imageUrl ? (
              <a href={appeal.imageUrl} target="_blank" rel="noreferrer" className={ghost}>Xem ảnh</a>
            ) : null}
            <button type="button" disabled={!appeal.userId || busy === appeal._id} className={solid}
              onClick={() => act(appeal._id,
                () => adminBrainApi.reviewAppeal(appeal.userId, appeal._id, "approve"),
                `Duyệt đơn của ${appeal.email} và GỠ KHOÁ tài khoản?`)}>
              Duyệt và gỡ khoá
            </button>
            <button type="button" disabled={!appeal.userId || busy === appeal._id} className={ghost}
              onClick={() => act(appeal._id,
                () => adminBrainApi.reviewAppeal(appeal.userId, appeal._id, "reject"),
                `Từ chối đơn của ${appeal.email}?`, true)}>
              Từ chối
            </button>
            {appeal.userId ? (
              <button type="button" className={ghost} onClick={() => onOpenUser?.(appeal.userId)}>Mở hồ sơ</button>
            ) : (
              <span className="self-center text-xs text-muted-foreground">Email không còn hồ sơ — không thao tác được</span>
            )}
          </Card>
        ))}
      </Section>

      <Section icon="account_balance_wallet" title="Giao dịch JOY bị giữ" items={queue.heldTransfers}
               empty="Không có giao dịch nào bị giữ.">
        {queue.heldTransfers.map((tx) => (
          <Card key={tx._id}
                title={`${Number(tx.numAmount || 0).toLocaleString("vi-VN")} JOY · ${tx.fromEmail || "?"} → ${tx.toEmail || "?"}`}
                subtitle={`Mã ${tx.txCode || "—"}${tx.feeAmount ? ` · phí ${Number(tx.feeAmount).toLocaleString("vi-VN")}` : ""}`}
                since={tx.createdAt}>
            <button type="button" disabled={!tx.userId || busy === tx._id} className={solid}
              onClick={() => act(tx._id,
                () => adminBrainApi.reviewHeldTransfer(tx.userId, tx._id, "release"),
                `Thả giao dịch ${tx.txCode} cho đi tiếp?`)}>
              Thả giao dịch
            </button>
            <button type="button" disabled={!tx.userId || busy === tx._id} className={ghost}
              onClick={() => act(tx._id,
                () => adminBrainApi.reviewHeldTransfer(tx.userId, tx._id, "block"),
                `Chặn hẳn giao dịch ${tx.txCode}?`, true)}>
              Chặn
            </button>
            {tx.userId ? (
              <button type="button" className={ghost} onClick={() => onOpenUser?.(tx.userId)}>Mở hồ sơ người gửi</button>
            ) : null}
          </Card>
        ))}
      </Section>

      <Section icon="block" title="Nợ JOY chờ duyệt cấm vĩnh viễn" items={queue.joylater || []}
               empty="Không có hồ sơ nợ nào chờ duyệt.">
        {(queue.joylater || []).map((c) => (
          <Card key={c._id} title={`Hồ sơ ${c.caseId} · còn nợ ${Number(c.outstanding || 0).toLocaleString("vi-VN")} JOY`}
                subtitle={`Quá hạn ${c.daysOverdue || 0} ngày${c.note ? ` · ${c.note}` : ""}`}
                since={c.createdAt}>
            {/* Sổ đen chỉ lưu BĂM email, cố ý không tra ngược ra người dùng —
                nên mục này không có nút "mở hồ sơ" như các mục khác. */}
            <button type="button" disabled={busy === c._id} className={ghost}
              onClick={() => act(c._id,
                () => adminBrainApi.reviewJoyLaterCase(c.caseId, "ban"),
                `CẤM VĨNH VIỄN theo email và số điện thoại của hồ sơ ${c.caseId}? Thao tác thường không gỡ lại được.`,
                true)}>
              Duyệt cấm vĩnh viễn
            </button>
            <button type="button" disabled={busy === c._id} className={solid}
              onClick={() => act(c._id,
                () => adminBrainApi.reviewJoyLaterCase(c.caseId, "skip"),
                `Bỏ qua hồ sơ ${c.caseId}, không ghi lệnh cấm nào?`)}>
              Bỏ qua
            </button>
          </Card>
        ))}
      </Section>

      <section>
        <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
          <span aria-hidden className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-muted text-[20px] text-foreground">
            radar
          </span>
          Quét rủi ro gian lận
          <button type="button" onClick={runScan} disabled={scanning}
            className={`${ghost} ml-auto`}>{scanning ? "Đang quét…" : "Chạy quét"}</button>
        </h3>
        {risks === null ? (
          <p className="text-sm text-muted-foreground">
            Quét biến động ví và dấu hiệu an ninh bất thường. Chạy khi cần, không tự chạy nền.
          </p>
        ) : risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không thấy dấu hiệu bất thường nào.</p>
        ) : (
          <div className="space-y-3">
            {risks.map((r, i) => (
              <Card key={r.userId || r._id || i} title={r.displayName || r.email || "(không rõ)"}
                    subtitle={r.reason || r.detail || r.note} since={r.createdAt}>
                <button type="button" disabled={!r.userId || busy === r.userId} className={ghost}
                  onClick={() => act(r.userId,
                    () => adminBrainApi.resolveRiskFlag(r.userId, true, "FREEZE"),
                    `Đóng băng ví JOY của ${r.email || "người này"}?`, true)}>
                  Đóng băng ví
                </button>
                <button type="button" disabled={!r.userId || busy === r.userId} className={solid}
                  onClick={() => act(r.userId,
                    () => adminBrainApi.resolveRiskFlag(r.userId, false, "DISMISS"),
                    "Bỏ qua cảnh báo này?")}>
                  Bỏ qua
                </button>
                {r.userId ? (
                  <button type="button" className={ghost} onClick={() => onOpenUser?.(r.userId)}>Mở hồ sơ</button>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Section icon="support_agent" title="Phiếu hỗ trợ đang mở" items={queue.tickets}
               empty="Không có phiếu hỗ trợ nào đang mở.">
        {queue.tickets.map((ticket) => (
          <Card key={ticket._id} title={ticket.subject || "(không có tiêu đề)"}
                subtitle={ticket.email} since={ticket.createdAt}>
            {ticket.userId ? (
              <button type="button" className={ghost} onClick={() => onOpenUser?.(ticket.userId)}>Mở hồ sơ</button>
            ) : null}
          </Card>
        ))}
      </Section>
    </div>
  );
}
