import { useCallback, useState } from "react";
import useVisiblePoll from "../../hooks/useVisiblePoll";
import { API_BASE } from "../../config/apiBase";
import { isValidDestination } from "./adminDestinations";

const TONE = {
  ok: { dot: "bg-emerald-500", icon: "check_circle", text: "text-emerald-700 dark:text-emerald-400" },
  warn: { dot: "bg-amber-500", icon: "schedule", text: "text-amber-700 dark:text-amber-400" },
  bad: { dot: "bg-red-500", icon: "priority_high", text: "text-red-700 dark:text-red-400" },
};

/**
 * Tổng quan = bản tin hôm nay (apps/server/services/adminBrief.js): một câu tóm tắt,
 * danh sách việc cần người làm (mỗi việc một nút tới đúng màn), và những gì hệ
 * thống đã tự xử lý. Thay cho 6 thẻ số + "terminal" gõ lệnh mà admin không đọc nổi;
 * lệnh bằng lời vẫn có ở bot Telegram (có nút duyệt).
 */
export default function AdminDashboard({ permissions = ["*"], onNavigate }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch(`${API_BASE}/admin/brief`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Lỗi ${r.status}`))))
      .then((data) => { setBrief(data); setError(""); })
      .catch((err) => setError(err.message));
  }, []);
  useVisiblePoll(load, 60_000);

  if (!brief) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{error ? `Chưa tải được bản tin (${error}).` : "Đang soạn bản tin…"}</p>;
  }
  const tone = TONE[brief.status];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden className={`material-symbols-outlined text-[28px] ${tone.text}`}>{tone.icon}</span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-.01em]">
              {brief.headline}
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {brief.numbers.members.toLocaleString("vi-VN")} thành viên · {brief.numbers.newMembers} người mới · {brief.numbers.activeToday} người dùng trong 24 giờ{brief.numbers.pushOpenRate != null && ` · ${brief.numbers.pushOpenRate}% quay lại nhờ thông báo`} · cập nhật {new Date(brief.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </section>

      {brief.items.length > 0 && (
        <section aria-labelledby="brief-todo">
          <h3 id="brief-todo" className="mb-2 px-1 text-sm font-medium text-muted-foreground">Việc cần bạn</h3>
          <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
            {brief.items.map((item) => (
              <li key={item.text} className="flex items-center gap-3 p-4">
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${TONE[item.level].dot}`} />
                <p className="min-w-0 flex-1 text-[15px]">{item.text}</p>
                {isValidDestination(item.tab, permissions) && (
                  <button type="button" onClick={() => onNavigate?.(item.tab)} className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium hover:bg-muted">Mở</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="brief-auto">
        <h3 id="brief-auto" className="mb-2 px-1 text-sm font-medium text-muted-foreground">Hệ thống đã tự xử lý trong 24 giờ</h3>
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
          {brief.auto.length ? brief.auto.map((a) => (
            <li key={a.text} className="flex items-center gap-3 p-4 text-[15px]">
              <span aria-hidden className="material-symbols-outlined text-[20px] text-muted-foreground">{a.icon}</span>{a.text}
            </li>
          )) : <li className="p-4 text-[15px] text-muted-foreground">Không có sự cố nào phải tự xử lý.</li>}
        </ul>
      </section>
    </div>
  );
}
