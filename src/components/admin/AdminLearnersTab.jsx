import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Search, Users } from "lucide-react";
import { notify } from "../../lib/notify";
import { CAPSTONE_TRACKS, getCapstoneTrack } from "../../../shared/capstoneTracks";

/**
 * Bảng theo dõi người học.
 *
 * Trước đây admin chỉ có trang duyệt đồ án, tức chỉ thấy người đã đi tới cuối.
 * Ai đang học dở, ai kẹt ở đâu, ai bỏ giữa chừng thì không có chỗ nào xem.
 *
 * Khối "bài đang chặn nhiều người nhất" đặt trên cùng vì nó là thứ hành động
 * được: ba người cùng kẹt ở một bài nghĩa là bài đó có vấn đề, không phải ba
 * người đó lười.
 */
const API = import.meta.env.VITE_API_URL || "/api";

const STAGE_LABEL = {
  basic: "Chặng 1 · Cơ bản",
  intermediate: "Chặng 2 · Kiến trúc",
  advanced: "Chặng 3 · Giải thuật",
  security: "Chặng 4 · Bảo mật",
  project: "Chặng 5 · Đồ án",
  devops: "Chặng 6 · DevOps",
};

const PROJECT_LABEL = {
  pending: { text: "Chờ duyệt", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  approved: { text: "Đã duyệt", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  rejected: { text: "Cần sửa", tone: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const authHeaders = () => {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const shortDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

export default function AdminLearnersTab() {
  const [learners, setLearners] = useState([]);
  const [stuck, setStuck] = useState([]);
  const [totalLearners, setTotalLearners] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25", status });
      if (query.trim()) params.set("q", query.trim());
      if (track) params.set("track", track);

      const [listRes, stuckRes] = await Promise.all([
        fetch(`${API}/admin/learners?${params}`, { headers: authHeaders(), credentials: "include" }),
        fetch(`${API}/admin/learners/stuck`, { headers: authHeaders(), credentials: "include" }),
      ]);
      if (!listRes.ok) throw new Error("Không tải được danh sách người học.");

      const list = await listRes.json();
      setLearners(list.learners || []);
      setPagination(list.pagination || { page: 1, pages: 1, total: 0 });

      if (stuckRes.ok) {
        const data = await stuckRes.json();
        setStuck(data.stuck || []);
        setTotalLearners(data.totalLearners || 0);
      }
    } catch (error) {
      notify.error(error.message || "Lỗi tải dữ liệu người học.");
    } finally {
      setLoading(false);
    }
  }, [query, track, status]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-black text-foreground">Người học</h2>
            <p className="text-xs text-muted-foreground">
              {totalLearners} người đã bắt đầu lộ trình Phát triển Web
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(pagination.page)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Tải lại
        </button>
      </header>

      {stuck.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Bài đang chặn nhiều người nhất
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Nhiều người cùng dừng ở một bài thường là dấu hiệu bài đó có vấn đề — đề mơ hồ,
            bộ chấm quá chặt, hoặc thiếu kiến thức dẫn nhập.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stuck.map((item) => (
              <span
                key={item.lesson}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-bold text-foreground"
              >
                Bài {item.lesson}
                <b className="text-primary">{item.learners}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên hoặc email"
            className="min-h-[38px] w-full bg-transparent text-xs text-foreground outline-none"
          />
        </label>
        <select
          value={track}
          onChange={(event) => setTrack(event.target.value)}
          aria-label="Lọc theo đề tài"
          className="min-h-[38px] rounded-lg border border-border bg-card px-3 text-xs text-foreground"
        >
          <option value="">Mọi đề tài</option>
          {CAPSTONE_TRACKS.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Lọc theo trạng thái đồ án"
          className="min-h-[38px] rounded-lg border border-border bg-card px-3 text-xs text-foreground"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="graduating">Đang chờ duyệt đồ án</option>
          <option value="graduated">Đã tốt nghiệp</option>
        </select>
      </section>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
      ) : learners.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card py-10 text-center text-xs text-muted-foreground">
          Không có người học nào khớp bộ lọc.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-black">Người học</th>
                <th className="px-3 py-3 font-black">Tiến độ</th>
                <th className="px-3 py-3 font-black">Đang kẹt</th>
                <th className="px-3 py-3 font-black">Đề tài</th>
                <th className="px-3 py-3 font-black">Bài đọc</th>
                <th className="px-3 py-3 font-black">Đồ án</th>
                <th className="px-4 py-3 font-black">Hồ sơ đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {learners.map((learner) => {
                const project = PROJECT_LABEL[learner.projectStatus];
                const trackInfo = getCapstoneTrack(learner.capstoneTrack);
                return (
                  <tr key={learner.email} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{learner.displayName || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{learner.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold tabular-nums text-foreground">{learner.lessonsDone}/100</p>
                      <p className="text-[10px] text-muted-foreground">
                        {STAGE_LABEL[learner.stageId] || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-foreground">
                      {learner.stuckAt ? `Bài ${learner.stuckAt}` : "Xong hết"}
                    </td>
                    <td className="px-3 py-3 text-foreground">{trackInfo?.title || "Chưa chọn"}</td>
                    <td className="px-3 py-3 tabular-nums text-foreground">{learner.readingsDone}</td>
                    <td className="px-3 py-3">
                      {project ? (
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${project.tone}`}>
                          {project.text}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Chưa nộp</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">
                      {shortDate(learner.profileUpdatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Trang {pagination.page}/{pagination.pages} · {pagination.total} người
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => load(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 font-bold text-foreground disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => load(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-border px-3 py-1.5 font-bold text-foreground disabled:opacity-40"
            >
              Sau
            </button>
          </span>
        </div>
      )}

      <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
        Cột &ldquo;Hồ sơ đổi&rdquo; là lần cuối bản ghi thành viên thay đổi vì bất kỳ lý do gì,
        không riêng việc học — đừng đọc nó như ngày học gần nhất.
      </p>
    </div>
  );
}
