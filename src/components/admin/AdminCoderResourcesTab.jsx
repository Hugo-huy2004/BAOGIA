import { useEffect, useState } from "react";
import { notify } from "../../lib/notify";

const STAGE_OPTIONS = [
  { id: "all", label: "Mọi chặng" },
  { id: "basic", label: "Chặng 1: Phản Xạ Cơ Bản" },
  { id: "intermediate", label: "Chặng 2: Tư Duy Kiến Trúc" },
  { id: "advanced", label: "Chặng 3: CTDL & Giải Thuật" },
  { id: "security", label: "Chặng 4: Bảo Mật & AI" },
  { id: "project", label: "Chặng 5: Siêu Đồ Án" },
  { id: "devops", label: "Chặng 6: DevOps" }
];

// Nhận diện link YouTube để nhúng preview
export function toYouTubeEmbed(url) {
  const m = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/i
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Link Google Drive → chế độ preview nhúng được
export function toDrivePreview(url) {
  const m = String(url || "").match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

// Preview trực quan dùng chung (admin soạn + member xem)
export function ResourcePreview({ type, url, className = "" }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl text-muted-foreground text-xs ${className}`}>
        Dán URL để xem trước
      </div>
    );
  }
  const yt = toYouTubeEmbed(url);
  if (type === "video" && yt) {
    return <iframe src={yt} title="Xem trước video" allowFullScreen className={`rounded-xl border border-border bg-black ${className}`} />;
  }
  if (type === "video" && /\.(mp4|webm)(\?|$)/i.test(url)) {
    return <video src={url} controls className={`rounded-xl border border-border bg-black ${className}`} />;
  }
  const drive = toDrivePreview(url);
  if (type === "document" && (drive || /\.pdf(\?|$)/i.test(url))) {
    return <iframe src={drive || url} title="Xem trước tài liệu" className={`rounded-xl border border-border bg-background ${className}`} />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col items-center justify-center gap-1 bg-muted rounded-xl border border-border text-foreground ${className}`}
    >
      <span className="material-symbols-outlined text-2xl">open_in_new</span>
      <span className="text-[10px] font-bold px-3 text-center break-all line-clamp-2">{url}</span>
    </a>
  );
}

const EMPTY_FORM = { type: "video", title: "", description: "", url: "", stageId: "all", source: "", pinned: false };

export default function AdminCoderResourcesTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || "/api";

  const load = () => {
    fetch(`${apiBase}/coder-resources`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => notify.error("Không tải được danh sách học liệu."));
  };
  useEffect(load, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(
        editingId ? `${apiBase}/coder-resources/${editingId}` : `${apiBase}/coder-resources`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form)
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu học liệu.");
      notify.success(editingId ? "Đã cập nhật học liệu." : "Đã đăng học liệu mới.");
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    const ok = await notify.confirm({ title: "Gỡ học liệu", message: "Học viên sẽ không còn thấy mục này. Gỡ chứ?", danger: true });
    if (!ok) return;
    const res = await fetch(`${apiBase}/coder-resources/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      notify.success("Đã gỡ học liệu.");
      load();
    } else notify.error("Không gỡ được học liệu.");
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({ type: item.type, title: item.title, description: item.description, url: item.url, stageId: item.stageId, source: item.source, pinned: item.pinned });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-black text-foreground">Học liệu HugoCoder</h2>
        <p className="text-xs text-muted-foreground">Đăng video bài học và tài liệu học thuật — hiển thị ở tab Video / Tài liệu của học viên kèm preview trực quan.</p>
      </div>

      {/* Form soạn + preview song song */}
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 bg-card border border-border rounded-2xl p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            {["video", "document"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  form.type === t ? "bg-foreground text-background border-foreground" : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {t === "video" ? "Video bài học" : "Tài liệu học thuật"}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={set("title")} required maxLength={200} placeholder="Tiêu đề (vd: Flexbox toàn tập trong 20 phút)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.url} onChange={set("url")} required placeholder="URL — YouTube / mp4 / PDF / Google Drive / trang sách"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground font-mono" />
          <input value={form.source} onChange={set("source")} maxLength={200} placeholder="Nguồn học thuật (vd: MDN Web Docs, Eloquent JavaScript — Marijn Haverbeke)"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <textarea value={form.description} onChange={set("description")} rows={3} maxLength={2000} placeholder="Mô tả ngắn — học viên đọc gì, học được gì"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <div className="flex items-center gap-3">
            <select value={form.stageId} onChange={set("stageId")} className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground">
              {STAGE_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground select-none">
              <input type="checkbox" checked={form.pinned} onChange={set("pinned")} className="accent-current" /> Ghim đầu
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] transition-all">
              {editingId ? "Cập nhật học liệu" : "Đăng học liệu"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-4 py-2.5 rounded-xl bg-muted text-foreground border border-border text-xs font-black uppercase">
                Huỷ
              </button>
            )}
          </div>
        </div>

        {/* Preview trực quan realtime */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Xem trước như học viên thấy</span>
          <ResourcePreview type={form.type} url={form.url} className="w-full aspect-video" />
          {form.title && (
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-black text-foreground">{form.title}</p>
              {form.source && <p className="text-[10px] text-muted-foreground mt-0.5">Nguồn: {form.source}</p>}
              {form.description && <p className="text-xs text-muted-foreground mt-1 leading-5">{form.description}</p>}
            </div>
          )}
        </div>
      </form>

      {/* Danh sách đã đăng */}
      <div className="space-y-2">
        <h3 className="text-sm font-black text-foreground">Đã đăng ({items.length})</h3>
        {items.length === 0 && <p className="text-xs text-muted-foreground">Chưa có học liệu nào.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item._id} className="flex gap-3 bg-card border border-border rounded-2xl p-3">
              <span className="material-symbols-outlined shrink-0 w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center text-lg">
                {item.type === "video" ? "smart_display" : "menu_book"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground truncate">{item.pinned ? "[Ghim] " : ""}{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{STAGE_OPTIONS.find((s) => s.id === item.stageId)?.label} {item.source ? `• ${item.source}` : ""}</p>
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => startEdit(item)} className="text-[10px] font-black uppercase text-foreground underline underline-offset-2">Sửa</button>
                  <button onClick={() => remove(item._id)} className="text-[10px] font-black uppercase text-destructive underline underline-offset-2">Gỡ</button>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-muted-foreground underline underline-offset-2">Mở link</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
