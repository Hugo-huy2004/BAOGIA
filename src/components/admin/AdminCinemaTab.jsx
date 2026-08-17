import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAdminToken } from "../../services/authSession";

export default function AdminCinemaTab({ showNotice }) {
  const { t } = useTranslation();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("classic");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFallbackUrl, setVideoFallbackUrl] = useState("");
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [director, setDirector] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [badge, setBadge] = useState("4K Ultra HD");
  const [mpaaRating, setMpaaRating] = useState("PG-13");
  const [imdbRating, setImdbRating] = useState("9.0");
  const [joyReward, setJoyReward] = useState(100);
  const [autoDurationStatus, setAutoDurationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = () => {
    const token = getAdminToken();
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Lấy danh sách phim Admin từ backend MongoDB
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/cinema/admin/movies", {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMovies(data.movies || []);
      } else {
        setErrorMsg(data.message || "Không thể tải danh sách phim từ MongoDB");
      }
    } catch (err) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Tự động lấy thời lượng (Duration) từ file/đường dẫn video URL
  const handleAutoExtractDuration = (url) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    setAutoDurationStatus("Đang kiểm tra và trích xuất thời lượng video...");

    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = cleanUrl;

    v.onloadedmetadata = () => {
      const sec = Math.round(v.duration);
      if (!isNaN(sec) && sec > 0) {
        setDurationSeconds(sec);
        const mins = Math.floor(sec / 60);
        const hours = Math.floor(mins / 60);
        const remMins = mins % 60;
        const formatted = hours > 0 ? `${hours}h ${remMins}m` : `${mins} phút`;
        setDuration(formatted);
        setAutoDurationStatus(`✨ Đã tự động nhận diện thời lượng: ${formatted} (${sec} giây)`);
      } else {
        setAutoDurationStatus("💡 Bạn có thể tự nhập thời lượng (ví dụ: 68 phút)");
      }
    };

    v.onerror = () => {
      setAutoDurationStatus("💡 Nguồn video bảo mật CDN. Bạn có thể tự nhập thời lượng bên dưới (Ví dụ: 68 phút).");
    };
  };

  // Mở Form thêm / sửa phim
  const handleOpenForm = (movie = null) => {
    if (movie) {
      setEditingMovie(movie);
      setTitle(movie.title || "");
      setTagline(movie.tagline || "");
      setDescription(movie.description || "");
      setCategory(movie.category || "classic");
      setVideoUrl(movie.videoUrl || "");
      setVideoFallbackUrl(movie.videoFallbackUrl || "");
      setPoster(movie.poster || "");
      setBackdrop(movie.backdrop || "");
      setDirector(movie.director || "");
      setYear(movie.year || new Date().getFullYear());
      setDuration(movie.duration || "");
      setDurationSeconds(movie.durationSeconds || 0);
      setBadge(movie.badge || "4K Ultra HD");
      setMpaaRating(movie.mpaaRating || "PG-13");
      setImdbRating(movie.imdbRating || "9.0");
      setJoyReward(movie.joyReward || 100);
    } else {
      setEditingMovie(null);
      setTitle("");
      setTagline("");
      setDescription("");
      setCategory("classic");
      setVideoUrl("");
      setVideoFallbackUrl("");
      setPoster("");
      setBackdrop("");
      setDirector("");
      setYear(new Date().getFullYear());
      setDuration("");
      setDurationSeconds(0);
      setBadge("4K Ultra HD");
      setMpaaRating("PG-13");
      setImdbRating("9.0");
      setJoyReward(100);
    }
    setAutoDurationStatus("");
    setShowModal(true);
  };

  // Lưu thông tin phim vào MongoDB
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !videoUrl) {
      alert("Vui lòng điền đầy đủ Tiêu đề Phim và Đường dẫn Video!");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        id: editingMovie ? editingMovie.id : `movie-${Date.now()}`,
        title,
        tagline,
        description,
        category,
        videoUrl,
        videoFallbackUrl: videoFallbackUrl || videoUrl,
        poster: poster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80",
        backdrop: backdrop || poster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&auto=format&fit=crop&q=80",
        director: director || "Admin",
        year: parseInt(year, 10) || new Date().getFullYear(),
        duration: duration || "120 phút",
        durationSeconds: parseInt(durationSeconds, 10) || 7200,
        badge,
        mpaaRating,
        imdbRating,
        joyReward: parseInt(joyReward, 10) || 100,
        active: true,
      };

      const res = await fetch("/api/cinema/admin/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showNotice?.(`Đã lưu phim "${title}" vào MongoDB thành công!`);
        setShowModal(false);
        fetchMovies();
      } else {
        alert(data.message || "Lỗi lưu phim vào cơ sở dữ liệu MongoDB.");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa 1 bộ phim
  const handleDeleteMovie = async (movie) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phim "${movie.title}" khỏi MongoDB?`)) return;
    try {
      const res = await fetch(`/api/cinema/admin/movies/${movie.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showNotice?.(`Đã xóa phim thành công!`);
        fetchMovies();
      } else {
        alert(data.message || "Không thể xóa phim.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Xóa SẠCH TOÀN BỘ phim trong MongoDB
  const handlePurgeAll = async () => {
    if (!window.confirm("⚠️ BẠN CÓ CHẮC MUỐN XÓA SẠCH TOÀN BỘ DỮ LIỆU PHIM TRONG MONGODB?\nHành động này không thể hoàn tác!")) return;
    try {
      const res = await fetch("/api/cinema/admin/purge-all", {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showNotice?.(data.message || "Đã xóa sạch dữ liệu phim thành công!");
        fetchMovies();
      } else {
        alert(data.message || "Xóa thất bại.");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141633] p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-2xl">movie</span>
            Quản Lý Phim Hugo Cinema (MongoDB)
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Admin trực tiếp thêm phim thật. Hệ thống tự động nhận diện thời lượng & nâng cấp chất lượng hình ảnh HD/4K.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePurgeAll}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">delete_sweep</span>
            Xóa Sạch Dữ Liệu Phim
          </button>
          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 hover:scale-105 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm Phim Mới
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <p className="animate-pulse text-sm font-semibold">Đang tải danh sách phim từ MongoDB...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
          {errorMsg}
        </div>
      ) : movies.length === 0 ? (
        <div className="p-12 text-center bg-[#141633] rounded-3xl border border-white/10 space-y-4">
          <span className="material-symbols-outlined text-6xl text-slate-500">movie_off</span>
          <h3 className="text-base font-black text-white">Chưa có bộ phim nào trong cơ sở dữ liệu MongoDB</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hệ thống đã xóa toàn bộ dữ liệu cũ. Nhấn nút <strong>"Thêm Phim Mới"</strong> ở phía trên để đưa bộ phim chính thức của bạn vào ứng dụng!
          </p>
          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-bold text-xs shadow-xl hover:bg-rose-600 transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Thêm Phim Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((m) => (
            <div key={m.id} className="bg-[#141633] rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col group">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={m.backdrop || m.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80"}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141633] via-transparent to-black/40" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase">
                  {m.category}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                  ⏱ {m.duration}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-black text-white line-clamp-1">{m.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{m.description}</p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-bold">⭐ {m.imdbRating || "9.0"}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenForm(m)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMovie(m)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL THÊM / SỬA PHIM */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141633] w-full max-w-2xl rounded-3xl border border-white/20 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">movie_edit</span>
                {editingMovie ? "Chỉnh Sửa Bộ Phim" : "Thêm Bộ Phim Mới Cho Cinema"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              {/* Tên Phim */}
              <div>
                <label className="block text-slate-300 mb-1">Tên Phim (Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên phim chính thức..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Đường Dẫn Video */}
              <div>
                <label className="block text-slate-300 mb-1">Đường Dẫn Video (URL File MP4 / HLS .m3u8) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://domain-cua-ban.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setVideoUrl(url);
                    handleAutoExtractDuration(url);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                />
                {autoDurationStatus && (
                  <p className="text-[11px] text-emerald-400 mt-1">{autoDurationStatus}</p>
                )}
              </div>

              {/* Thời Lượng & Thể Loại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Thời Lượng (Tự Động Trích Xuất Hoặc Tự Nhập)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 120 phút"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Thể Loại Phim</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="classic">Hài Sạc Lô & Kinh Điển</option>
                    <option value="shorts">Phim Ngắn 3D</option>
                    <option value="scifi">Khoa Học Viễn Tưởng</option>
                    <option value="horror">Kinh Dị Public Domain</option>
                    <option value="doc">Tài Liệu Vũ Trụ</option>
                    <option value="action">Võ Thuật & Hành Động</option>
                  </select>
                </div>
              </div>

              {/* Poster & Backdrop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Ảnh Poster Đứng (URL Image)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ảnh Backdrop Ngang (URL Image)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={backdrop}
                    onChange={(e) => setBackdrop(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tagline & Mô Tả */}
              <div>
                <label className="block text-slate-300 mb-1">Khẩu Hiệu Phim (Tagline)</label>
                <input
                  type="text"
                  placeholder="Nhập khẩu hiệu chính thức của bộ phim..."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nội Dung Mô Tả Phim (Synopsis)</label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả tóm tắt nội dung bộ phim..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-rose-500 focus:outline-none resize-none"
                />
              </div>

              {/* Nút Submit */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/30 hover:scale-105 transition-all"
                >
                  {submitting ? "Đang Lưu..." : "Lưu Phim Vào MongoDB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
