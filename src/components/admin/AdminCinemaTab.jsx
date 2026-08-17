import { useState, useEffect, useCallback } from "react";
import { getAdminToken } from "../../services/authSession";
import { notify } from "../../lib/notify";
import { CINEMA_CATEGORIES } from "../../../shared/cinemaCategories";

/**
 * Quản trị thư viện Chill Premium.
 *
 * Việc chính ở đây là bấm "Đồng bộ": máy chủ đọc danh sách phim công cộng đã
 * chọn tay (server/services/cinemaLibrary.js) rồi lấy metadata thật từ Internet
 * Archive. Form thêm phim là đường phụ, dành cho phim của chính Hugo Studio.
 *
 * Form cũ có ba ô mà không ai kiểm chứng được: điểm IMDb (mặc định 9.0), nhãn
 * MPAA (mặc định PG-13) và huy hiệu "4K Ultra HD". Cả ba đã bỏ cùng với các
 * trường tương ứng trong schema — thà thiếu một con số còn hơn bày một con số
 * bịa cho người xem.
 */

const CATEGORY_LABELS = {
  all: "Tất cả",
  classic: "Kinh điển",
  cartoon: "Hoạt hình",
  scifi: "Khoa học viễn tưởng",
  horror: "Kinh dị",
  shorts: "Phim ngắn 3D",
  doc: "Tài liệu",
};

const BLANK = {
  title: "",
  description: "",
  category: "classic",
  year: new Date().getFullYear(),
  creator: "",
  duration: "",
  durationSeconds: 0,
  license: "",
  sourceUrl: "",
  videoUrl: "",
  videoFallbackUrl: "",
  poster: "",
  preview: "",
};

export default function AdminCinemaTab({ showNotice }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  const headers = useCallback(() => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/cinema/admin/movies", { headers: headers(), credentials: "include" });
      const data = await res.json();
      if (data.success) setMovies(data.movies || []);
      else setErrorMsg(data.message || "Không tải được danh sách phim");
    } catch (err) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const legacyCount = movies.filter((m) => !m.source).length;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cinema/admin/sync", {
        method: "POST",
        headers: headers(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showNotice?.(data.message);
        notify.success(data.message);
        await fetchMovies();
      } else {
        notify.error(data.message || "Đồng bộ thất bại");
      }
    } catch (err) {
      notify.error(`Lỗi đồng bộ: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteLegacy = async () => {
    const ok = await notify.confirm({
      title: `Xoá ${legacyCount} bản ghi phim cũ?`,
      message: "Đây là các phim lưu trước lần đổi schema (còn điểm IMDb và dàn diễn viên mặc định do code cũ tự sinh).",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/cinema/admin/legacy", {
        method: "DELETE",
        headers: headers(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        notify.success(data.message);
        await fetchMovies();
      } else notify.error(data.message);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const openForm = (movie = null) => {
    if (movie) {
      setEditingId(movie.id);
      setForm({ ...BLANK, ...movie });
    } else {
      setEditingId(null);
      setForm(BLANK);
    }
    setShowForm(true);
  };

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.videoUrl || !form.poster) {
      notify.error("Tên phim, đường dẫn video và ảnh thumbnail là bắt buộc");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cinema/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        credentials: "include",
        body: JSON.stringify({ ...form, id: editingId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice?.(data.message);
        notify.success(data.message);
        setShowForm(false);
        await fetchMovies();
      } else notify.error(data.message || "Lưu phim thất bại");
    } catch (err) {
      notify.error(`Lỗi kết nối: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (movie) => {
    const ok = await notify.confirm({
      title: `Xoá "${movie.title}"?`,
      message: movie.source === "archive"
        ? "Phim này do đồng bộ tự thêm, lần đồng bộ sau sẽ quay lại. Muốn bỏ hẳn thì xoá id khỏi PUBLIC_DOMAIN_FILMS."
        : "Phim sẽ biến khỏi thư viện của thành viên.",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/cinema/admin/movies/${encodeURIComponent(movie.id)}`, {
        method: "DELETE",
        headers: headers(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        notify.success(data.message);
        await fetchMovies();
      } else notify.error(data.message);
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#141633] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <span className="material-symbols-outlined text-2xl text-rose-500">movie</span>
            Chill Premium — Thư viện phim
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {movies.length} phim trong MongoDB · {movies.filter((m) => m.source === "archive").length} phim công cộng đồng bộ từ Internet Archive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-rose-600 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${syncing ? "animate-spin" : ""}`}>sync</span>
            {syncing ? "Đang đồng bộ…" : "Đồng bộ phim công cộng"}
          </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm phim riêng
          </button>
        </div>
      </div>

      {legacyCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-amber-200">
            Có {legacyCount} bản ghi phim từ schema cũ (còn điểm IMDb, nhãn PG-13 và dàn diễn viên mặc định do code cũ sinh ra).
          </p>
          <button
            type="button"
            onClick={handleDeleteLegacy}
            className="shrink-0 rounded-2xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-100"
          >
            Xoá dữ liệu cũ
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-20 text-center text-sm font-semibold text-slate-400">Đang tải danh sách phim…</p>
      ) : errorMsg ? (
        <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-xs font-bold text-rose-400">{errorMsg}</p>
      ) : movies.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#141633] p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-500">movie_off</span>
          <h3 className="text-base font-black text-white">Thư viện đang trống</h3>
          <p className="mx-auto max-w-md text-xs text-slate-400">
            Bấm <strong>Đồng bộ phim công cộng</strong> để lấy toàn bộ phim public domain (Chaplin, Keaton,
            Night of the Living Dead, phim mở của Blender, tài liệu NASA…) kèm metadata thật từ Internet Archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {movies.map((movie) => (
            <div key={movie.id} className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#141633]">
              <div className="relative aspect-video bg-black/40">
                <img src={movie.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-xl bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase text-white">
                  {CATEGORY_LABELS[movie.category] || movie.category}
                </span>
                {movie.duration && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">
                    {movie.duration}
                  </span>
                )}
                {!movie.active && (
                  <span className="absolute right-3 top-3 rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    ĐANG ẨN
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div>
                  <h4 className="line-clamp-1 text-sm font-black text-white">{movie.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {[movie.year || null, movie.creator || null].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{movie.description || "Không có mô tả"}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-slate-400">
                      {movie.source === "archive" ? "Internet Archive" : movie.source === "admin" ? "Tự thêm" : "Dữ liệu cũ"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(movie)}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(movie)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 sm:items-center" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141633] p-6 text-xs sm:rounded-3xl"
          >
            <h3 className="text-base font-black text-white">{editingId ? "Sửa phim" : "Thêm phim riêng"}</h3>

            <Field label="Tên phim *" value={form.title} onChange={setField("title")} placeholder="Tên chính thức của bộ phim" />
            <Field label="Đường dẫn video (mp4 hoặc .m3u8) *" value={form.videoUrl} onChange={setField("videoUrl")} placeholder="https://…/phim.mp4" />
            <Field label="Video dự phòng" value={form.videoFallbackUrl} onChange={setField("videoFallbackUrl")} placeholder="Bản chất lượng cao hơn (không bắt buộc)" />
            <Field label="Ảnh thumbnail *" value={form.poster} onChange={setField("poster")} placeholder="https://…/thumbnail.jpg" />
            <Field label="Ảnh/GIF cho màn hero" value={form.preview} onChange={setField("preview")} placeholder="Ảnh lớn hoặc GIF động (không bắt buộc)" />

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-slate-300">Thể loại</span>
                <select
                  value={form.category}
                  onChange={setField("category")}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f26] px-3 py-2.5 text-white outline-none"
                >
                  {CINEMA_CATEGORIES.filter((item) => item.id !== "all").map((item) => (
                    <option key={item.id} value={item.id}>{CATEGORY_LABELS[item.id]}</option>
                  ))}
                </select>
              </label>
              <Field label="Năm" type="number" value={form.year} onChange={setField("year")} />
              <Field label="Tác giả / hãng phim" value={form.creator} onChange={setField("creator")} />
              <Field label="Thời lượng hiển thị" value={form.duration} onChange={setField("duration")} placeholder="1h 32m" />
              <Field label="Thời lượng (giây)" type="number" value={form.durationSeconds} onChange={setField("durationSeconds")} />
            </div>

            <Field label="Giấy phép (URL)" value={form.license} onChange={setField("license")} placeholder="https://creativecommons.org/…" />
            <Field label="Trang nguồn" value={form.sourceUrl} onChange={setField("sourceUrl")} placeholder="https://archive.org/details/…" />

            <label className="block">
              <span className="mb-1 block text-slate-300">Mô tả</span>
              <textarea
                value={form.description}
                onChange={setField("description")}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-[#0d0f26] px-3 py-2.5 text-white outline-none"
                placeholder="Nội dung bộ phim"
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 font-bold text-slate-300"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl bg-rose-500 py-3 font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Đang lưu…" : "Lưu phim"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#0d0f26] px-3 py-2.5 text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
