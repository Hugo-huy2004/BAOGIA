import { useCallback, useEffect, useMemo, useState } from "react";
import { adminBrainApi } from "../../services/api/modules/adminBrainApi";
import { notify } from "../../lib/notify";

/**
 * Hồ sơ 360° của một người dùng.
 *
 * Trước đây màn hình quản trị chỉ hiện Bio + 20 dòng ví + vài phiếu hỗ trợ.
 * Những thứ CẦN admin bấm nút mới đi tiếp được — đơn kháng nghị mở khoá, giao
 * dịch JOY bị giữ — không hiện ở đâu cả, nên chúng nằm chờ vĩnh viễn.
 *
 * Bố cục: một dải số liệu để liếc, rồi các nhóm gập lại theo domain. Nhóm nào
 * ĐANG CHỜ NGƯỜI DUYỆT thì mở sẵn và đánh dấu — admin mở hồ sơ lên là thấy ngay
 * việc phải làm, không phải đi tìm.
 */

const fmt = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "boolean") return value ? "Có" : "Không";
  const asDate = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
  return asDate ? new Date(value).toLocaleString("vi-VN") : String(value);
};

const count = (list) => (Array.isArray(list) ? list.length : 0);

function Stat({ icon, label, value, tone = "" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span aria-hidden className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-muted text-[20px] text-foreground">
        {icon}
      </span>
      <p className="mt-3 text-[0.7rem] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tracking-[-.02em] ${tone}`}>{value}</p>
    </div>
  );
}

/** Nhóm gập. `urgent` = có việc chờ duyệt → mở sẵn và gắn dấu. */
function Group({ icon, title, badge, urgent, children }) {
  return (
    <details
      open={Boolean(urgent)}
      className={`group overflow-hidden rounded-xl border ${urgent ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-card"}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[20px] text-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          {badge ? <span className="block text-xs text-muted-foreground">{badge}</span> : null}
        </span>
        {urgent ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-600 dark:text-amber-400">
            Chờ duyệt
          </span>
        ) : null}
        <span aria-hidden className="material-symbols-outlined shrink-0 text-[22px] text-muted-foreground transition-transform group-open:rotate-180">
          expand_more
        </span>
      </summary>
      <div className="border-t border-border p-4">{children}</div>
    </details>
  );
}

/** Bảng gọn cho một danh sách bản ghi; tự bỏ cột rỗng để khỏi nhìn một rừng "—". */
function MiniTable({ rows, columns, empty = "Chưa có dữ liệu." }) {
  if (!count(rows)) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const used = columns.filter(([key]) => rows.some((r) => r?.[key] !== undefined && r?.[key] !== null && r?.[key] !== ""));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            {used.map(([key, label]) => <th key={key} className="pb-2 pr-4 font-medium">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row?._id || i} className="border-t border-border">
              {used.map(([key]) => <td key={key} className="py-2 pr-4 align-top">{fmt(row?.[key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminUserOverview({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminBrainApi.getUserOverview(userId));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const pendingAppeals = useMemo(
    () => (data?.security?.appeals || []).filter((a) => !a.status || a.status === "pending"),
    [data],
  );
  const heldTransfers = useMemo(
    () => (data?.wallet?.heldTransfers || []).filter((t) => !t.status || ["pending", "held", "review"].includes(t.status)),
    [data],
  );

  const act = async (key, run, question) => {
    const confirmed = await notify.confirm({ title: "Xác nhận", message: question });
    if (!confirmed) return;
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

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Đang dựng hồ sơ…</p>;
  if (!data) return null;

  const { bio, wallet, commerce, security, devices, learning, play, social, failed } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-[-.02em]">{bio?.displayName || bio?.name || bio?.email}</h3>
          <p className="truncate text-sm text-muted-foreground">{bio?.email}</p>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">
            Đóng
          </button>
        ) : null}
      </div>

      {/* Truy vấn hỏng thì nói ra. Một ô trống vì lỗi trông y hệt một ô trống vì
          người dùng sạch — admin không được phép nhầm hai thứ đó. */}
      {count(failed) ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">Có {failed.length} mảng chưa đọc được — phần hiển thị bên dưới CHƯA đầy đủ:</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {failed.map((f) => <li key={f.section}>· {f.section}: {f.error}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="account_balance_wallet" label="Số dư JOY" value={fmt(bio?.joyBalance ?? bio?.joy ?? 0)} />
        <Stat icon="gavel" label="Sự kiện an ninh" value={fmt(security?.eventCount ?? 0)}
              tone={security?.eventCount ? "text-amber-600 dark:text-amber-400" : ""} />
        <Stat icon="pending_actions" label="Chờ admin duyệt"
              value={fmt(pendingAppeals.length + heldTransfers.length)}
              tone={pendingAppeals.length + heldTransfers.length ? "text-amber-600 dark:text-amber-400" : ""} />
        <Stat icon="event" label="Lịch hẹn dịch vụ" value={fmt(count(commerce?.bookings))} />
      </div>

      <Group icon="pending_actions" title="Việc đang chờ người duyệt"
             badge={`${pendingAppeals.length} kháng nghị · ${heldTransfers.length} giao dịch bị giữ`}
             urgent={pendingAppeals.length + heldTransfers.length > 0}>
        {pendingAppeals.length + heldTransfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có gì chờ xử lý.</p>
        ) : (
          <div className="space-y-4">
            {pendingAppeals.map((appeal) => (
              <div key={appeal._id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">Kháng nghị mở khoá · {fmt(appeal.createdAt)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{appeal.reason || appeal.message || "Không có lời nhắn."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy === appeal._id}
                    onClick={() => act(appeal._id,
                      () => adminBrainApi.reviewAppeal(userId, appeal._id, "approve"),
                      "Duyệt đơn này và GỠ KHOÁ tài khoản?")}
                    className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">
                    Duyệt và gỡ khoá
                  </button>
                  <button type="button" disabled={busy === appeal._id}
                    onClick={() => act(appeal._id,
                      () => adminBrainApi.reviewAppeal(userId, appeal._id, "reject"),
                      "Từ chối đơn kháng nghị này?")}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50">
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
            {heldTransfers.map((tx) => (
              <div key={tx._id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">
                  Giao dịch bị giữ · {fmt(tx.numAmount)} JOY → {fmt(tx.toEmail)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Mã {fmt(tx.txCode)} · {fmt(tx.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy === tx._id}
                    onClick={() => act(tx._id,
                      () => adminBrainApi.reviewHeldTransfer(userId, tx._id, "release"),
                      `Thả giao dịch ${tx.txCode} cho đi tiếp?`)}
                    className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">
                    Thả giao dịch
                  </button>
                  <button type="button" disabled={busy === tx._id}
                    onClick={() => act(tx._id,
                      () => adminBrainApi.reviewHeldTransfer(userId, tx._id, "block"),
                      `Chặn hẳn giao dịch ${tx.txCode}?`)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50">
                    Chặn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Group>

      <Group icon="account_balance_wallet" title="Ví và tín dụng"
             badge={`${count(wallet?.ledger)} giao dịch · ${count(wallet?.defaults)} lần trễ hạn`}>
        <div className="space-y-5">
          {wallet?.credit ? (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">JOY Gối Đầu</p>
              <p className="mt-1 text-muted-foreground">
                Hạn mức {fmt(wallet.credit.limit)} · đang nợ {fmt(wallet.credit.outstanding)} · bậc chế tài {fmt(wallet.credit.tier)}
              </p>
            </div>
          ) : null}
          <MiniTable rows={wallet?.ledger} columns={[["createdAt", "Thời điểm"], ["type", "Loại"], ["amount", "Số JOY"], ["description", "Diễn giải"]]} />
          {count(wallet?.defaults) ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">Lịch sử trễ hạn</p>
              <MiniTable rows={wallet.defaults} columns={[["createdAt", "Thời điểm"], ["tier", "Bậc"], ["amount", "Số nợ"], ["note", "Ghi chú"]]} />
            </div>
          ) : null}
        </div>
      </Group>

      <Group icon="storefront" title="Lịch hẹn, dự án và đơn hàng"
             badge={`${count(commerce?.bookings)} lịch hẹn · ${count(commerce?.orders)} đơn · ${count(commerce?.tickets)} phiếu hỗ trợ`}>
        <div className="space-y-5">
          <MiniTable rows={commerce?.bookings} empty="Chưa đặt lịch dịch vụ nào."
            columns={[["createdAt", "Gửi lúc"], ["status", "Trạng thái"], ["packageId", "Gói"], ["phone", "Liên hệ"], ["note", "Nội dung"]]} />
          <MiniTable rows={commerce?.orders} empty="Chưa có đơn hàng."
            columns={[["createdAt", "Thời điểm"], ["status", "Trạng thái"], ["productName", "Sản phẩm"], ["total", "Tổng"]]} />
          <MiniTable rows={commerce?.tickets} empty="Chưa gửi phiếu hỗ trợ."
            columns={[["createdAt", "Thời điểm"], ["status", "Trạng thái"], ["subject", "Tiêu đề"]]} />
        </div>
      </Group>

      <Group icon="shield" title="An ninh và thiết bị"
             badge={`${fmt(security?.eventCount)} sự kiện · ${count(security?.passkeys)} passkey · ${count(devices?.nativePush) + count(devices?.webPush)} thiết bị`}>
        <div className="space-y-5">
          <MiniTable rows={security?.blocks} empty="Chưa từng bị khoá."
            columns={[["createdAt", "Thời điểm"], ["active", "Còn hiệu lực"], ["reason", "Lý do"], ["scope", "Phạm vi"]]} />
          <MiniTable rows={security?.passkeys} empty="Chưa đăng ký passkey."
            columns={[["createdAt", "Tạo lúc"], ["deviceName", "Thiết bị"], ["lastUsedAt", "Dùng lần cuối"]]} />
          <MiniTable rows={devices?.nativePush} empty="Không có thiết bị nhận thông báo."
            columns={[["createdAt", "Đăng ký"], ["platform", "Nền tảng"], ["locale", "Ngôn ngữ"]]} />
        </div>
      </Group>

      <Group icon="school" title="Học tập và sức khoẻ"
             badge={`${count(learning?.evidence)} minh chứng · ${count(learning?.sleep)} bản ghi giấc ngủ · ${count(learning?.surveys)} khảo sát`}>
        <div className="space-y-5">
          <MiniTable rows={learning?.evidence} empty="Chưa có minh chứng học tập."
            columns={[["createdAt", "Thời điểm"], ["type", "Loại"], ["sourceApp", "Từ app"]]} />
          <MiniTable rows={learning?.surveys} empty="Chưa trả lời khảo sát nào."
            columns={[["createdAt", "Thời điểm"], ["questionId", "Câu hỏi"], ["answer", "Trả lời"]]} />
        </div>
      </Group>

      <Group icon="sports_esports" title="Trò chơi, sàn ảo và xã hội"
             badge={`${count(play?.stockPositions)} vị thế · ${count(play?.arcadeScores)} điểm · ${count(social?.friends)} quan hệ bạn bè`}>
        <div className="space-y-5">
          <MiniTable rows={play?.stockPositions} empty="Không giữ vị thế nào."
            columns={[["symbol", "Mã"], ["quantity", "Số lượng"], ["avgPrice", "Giá vốn"]]} />
          <MiniTable rows={play?.arcadeScores} empty="Chưa chơi game nào."
            columns={[["gameId", "Trò chơi"], ["score", "Điểm"], ["createdAt", "Thời điểm"]]} />
        </div>
      </Group>
    </div>
  );
}
