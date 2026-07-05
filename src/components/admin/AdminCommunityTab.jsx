import React, { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../../services/api/BaseApi";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";

// Admin community moderation tab.
// Design goals: feels like the member feed preview, but with instant moderator
// power — click a post's delete button, optionally give a reason, and the
// author is notified. Kept deliberately light: one fetch on mount (no polling),
// memoised cards, optimistic updates, lazy avatars.

const av = (url) => optimizeCloudinaryUrl(url || "/image/avt1.png", 96);

const READ_FONT = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };

const STATUS_META = {
  approved: { label: "Đã duyệt", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pending: { label: "Chờ duyệt", cls: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  rejected: { label: "Bị từ chối", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "approved", label: "Đã duyệt" },
  { id: "pending", label: "Chờ duyệt" },
  { id: "rejected", label: "Từ chối" },
  { id: "bot", label: "Bot" },
];

const timeAgo = (dateStr) => {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

// Memoised card — the list re-renders only the rows that actually change.
const PostCard = React.memo(function PostCard({ post, onDelete }) {
  const meta = STATUS_META[post.status] || STATUS_META.approved;
  const isAnon = post.anonymous || post.senderName === "Người ẩn danh";
  return (
    <div className="bg-white p-3.5 dark:bg-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {isAnon ? (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: post.anonColor || "#6366f1" }}>
              <span className="material-symbols-outlined text-[19px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
          ) : (
            <img src={av(post.senderAvatar)} loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-foreground">
              {post.senderName}
              {post.isBot && <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">BOT</span>}
            </p>
            {/* Admin sees the real identity even behind anonymity */}
            <p className="truncate text-[10.5px] text-muted-foreground">{post.senderEmail} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
          <button
            onClick={() => onDelete(post)}
            title="Xóa bài viết"
            className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 transition-colors hover:bg-rose-500/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-[19px]">delete</span>
          </button>
        </div>
      </div>

      <p style={READ_FONT} className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/95">{post.message}</p>

      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span>{post.likes?.length || 0}</span>
        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mode_comment</span>{post.comments?.length || 0}</span>
        {post.category && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] uppercase dark:bg-slate-800">{post.category}</span>}
        {post.anonymous && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9.5px] uppercase text-violet-600 dark:text-violet-400">Ẩn danh</span>}
      </div>
    </div>
  );
});

export default function AdminCommunityTab({ showNotification }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Admin composer
  const [composeText, setComposeText] = useState("");
  const [posting, setPosting] = useState(false);

  // Delete-with-reason modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/community/posts");
      if (data.success) setPosts(data.posts);
    } catch (err) {
      showNotification?.("Không tải được danh sách bài viết", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = posts;
    if (filter === "bot") list = list.filter((p) => p.isBot);
    else if (filter !== "all") list = list.filter((p) => p.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.message, p.senderName, p.senderEmail].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, filter, search]);

  const handlePost = async () => {
    const message = composeText.trim();
    if (!message || posting) return;
    setPosting(true);
    try {
      const data = await api.post("/admin/community/posts", { message });
      if (data.success) {
        setPosts((prev) => [data.post, ...prev]);
        setComposeText("");
        showNotification?.("Đã đăng bài với tư cách Hugo Studio", "success");
      }
    } catch (err) {
      showNotification?.(err?.error || "Không đăng được bài", "error");
    } finally {
      setPosting(false);
    }
  };

  const openDelete = useCallback((post) => {
    setDeleteTarget(post);
    setDeleteReason("");
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const target = deleteTarget;
    // Optimistic: remove immediately, restore on failure.
    setPosts((prev) => prev.filter((p) => p._id !== target._id));
    setDeleteTarget(null);
    try {
      await api.delete(`/admin/community/posts/${target._id}`, { reason: deleteReason.trim() });
      showNotification?.(
        target.isBot ? "Đã xóa bài bot" : "Đã xóa bài viết và gửi thông báo đến người dùng",
        "success"
      );
    } catch (err) {
      setPosts((prev) => [target, ...prev]);
      showNotification?.("Xóa thất bại, thử lại nhé", "error");
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => ({
    total: posts.length,
    pending: posts.filter((p) => p.status === "pending").length,
    bot: posts.filter((p) => p.isBot).length,
  }), [posts]);

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tổng bài viết", value: stats.total, icon: "forum" },
          { label: "Chờ duyệt", value: stats.pending, icon: "hourglass_top" },
          { label: "Bài bot", value: stats.bot, icon: "smart_toy" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-3.5 dark:bg-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="material-symbols-outlined text-[17px]">{s.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="mt-1 text-2xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Admin composer — posts instantly as the verified Hugo Studio identity */}
      <div className="rounded-xl border border-border bg-white p-3.5 dark:bg-card">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
          <span className="material-symbols-outlined text-[15px] text-[#0095f6]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          Đăng với tư cách Hugo Studio
        </p>
        <textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          rows={2}
          placeholder="Thông báo, chia sẻ đến cộng đồng..."
          style={READ_FONT}
          className="w-full resize-none rounded-lg bg-slate-100 px-3 py-2.5 text-[13.5px] text-foreground outline-none ring-1 ring-inset ring-transparent transition focus:ring-indigo-500/40 dark:bg-slate-800"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handlePost}
            disabled={!composeText.trim() || posting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-[12px] font-black text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-40"
          >
            {posting && <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>}
            {posting ? "Đang đăng..." : "Đăng ngay"}
          </button>
        </div>
      </div>

      {/* Search + filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 dark:bg-card">
          <span className="material-symbols-outlined text-[16px] text-muted-foreground">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, tên, email..."
            className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition-colors ${filter === f.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-muted-foreground hover:bg-slate-100 dark:bg-card dark:hover:bg-slate-800"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={load} title="Tải lại" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-muted-foreground transition hover:text-foreground dark:bg-card">
          <span className={`material-symbols-outlined text-[17px] ${loading ? "animate-spin" : ""}`}>refresh</span>
        </button>
      </div>

      {/* Feed preview — square flush cards, same look members see */}
      {loading && posts.length === 0 ? (
        <div className="flex flex-col gap-px">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 dark:bg-card">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-foreground/10" />
                <div className="h-3 w-32 animate-pulse rounded bg-foreground/10" />
              </div>
              <div className="mt-3 h-12 animate-pulse rounded bg-foreground/[0.06]" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center bg-white py-14 text-center dark:bg-card">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/40">forum</span>
          <p className="mt-2 text-[13px] font-bold text-foreground">Không có bài viết nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px overflow-hidden rounded-xl border border-border">
          {filtered.map((post) => (
            <PostCard key={post._id} post={post} onDelete={openDelete} />
          ))}
        </div>
      )}

      {/* Delete confirmation with optional reason → notified to the author */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl dark:bg-card">
            <h3 className="flex items-center gap-2 text-[15px] font-black text-foreground">
              <span className="material-symbols-outlined text-[20px] text-rose-500">delete_forever</span>
              Xóa bài viết?
            </h3>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Bài của <b className="text-foreground">{deleteTarget.senderName}</b> ({deleteTarget.senderEmail}) sẽ bị xóa vĩnh viễn.
              {!deleteTarget.isBot && " Người dùng sẽ nhận được thông báo kèm lý do."}
            </p>
            <p style={READ_FONT} className="mt-2 line-clamp-3 rounded-lg bg-slate-100 px-3 py-2 text-[12px] leading-snug text-foreground/80 dark:bg-slate-800">
              {deleteTarget.message}
            </p>
            {!deleteTarget.isBot && (
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Lý do xóa (gửi đến người dùng — để trống sẽ dùng lý do mặc định)"
                className="mt-3 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-[12.5px] text-foreground outline-none focus:border-rose-400"
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg px-4 py-2 text-[12.5px] font-bold text-muted-foreground transition hover:bg-slate-100 dark:hover:bg-slate-800">
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-[12.5px] font-black text-white transition hover:bg-rose-600 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Xóa & gửi thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
