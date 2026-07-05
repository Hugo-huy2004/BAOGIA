import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useArcadeSound } from "../../hooks/useArcadeSound";
import { useKeyboardInset } from "../../hooks/useKeyboardVisible";
import { notify } from "../../lib/notify";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";

// Small avatar → Cloudinary f_auto,q_auto,w_96 (skips non-Cloudinary URLs).
const av = (url, fallback = "/image/avt1.png") => optimizeCloudinaryUrl(url || fallback, 96);

// HugoCommunication — student community feed.
// Members post under one of two tags: "Chia sẻ" (share) or "Câu hỏi" (question),
// so the space works both as a place to broadcast and a place to ask & answer.
// Styling follows the rest of the portal (brand CSS vars, neon cards, material
// symbols) rather than the old Instagram-clone black screen.

const OWNER_EMAIL = "huylggcs230377@fpt.edu.vn";

// Tag identities — one accent each, kept consistent across composer/badge/filter.
const TAGS = {
  "chia sẻ": {
    key: "chia sẻ",
    label: "Chia sẻ",
    icon: "tips_and_updates",
    dot: "bg-indigo-500",
    badge: "border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  },
  "câu hỏi": {
    key: "câu hỏi",
    label: "Câu hỏi",
    icon: "help",
    dot: "bg-amber-500",
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
};
const tagOf = (c) => TAGS[c] || TAGS["chia sẻ"];

// Single-colour (đơn sắc) brand accent for primary action buttons.
const BRAND = "#6366f1";

// Diacritic-insensitive normalize so search matches "cau hoi" ↔ "câu hỏi" etc.
const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export default function CommunityTab({ memberSession, bio }) {
  const { playBeep, playMove } = useArcadeSound();
  const keyboardInset = useKeyboardInset();
  const sheetDrag = useDragControls();
  const navigate = useNavigate();

  const openBio = (slug) => { if (slug) { playBeep(); navigate(`/bio/${slug}`); } };

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState("checking");
  const [search, setSearch] = useState("");

  // Composer (AI assigns the tag after moderation — the author no longer picks)
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const postInputRef = useRef(null);

  // Comments sheet
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  const [activeMenu, setActiveMenu] = useState(null);

  // Tell the portal to hide the bottom tab-bar while a full sheet is open.
  useEffect(() => {
    const open = isComposerOpen || !!activeCommentPostId;
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [isComposerOpen, activeCommentPostId]);

  // ── Geolocation (only needed for the POST payload) + initial fetch ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("fallback");
      fetchPosts(null, null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("active");
        fetchPosts(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationStatus("fallback");
        fetchPosts(null, null);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (locationStatus === "checking") return;
    const interval = setInterval(() => fetchPosts(coords.lat, coords.lng, false), 8000);
    return () => clearInterval(interval);
  }, [locationStatus, coords]);

  const fetchPosts = async (lat, lng, showLoading = true) => {
    try {
      if (showLoading) setPostsLoading(true);
      let url = "/api/bios/community/chat";
      if (lat !== null && lng !== null) url += `?lat=${lat}&lng=${lng}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.messages) setPosts(data.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setPostsLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return "";
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const formatted = escaped
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, "<strong>$1</strong>")
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, "<em>$1</em>")
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span style="text-decoration: underline;">$1</span>')
      .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, "<del>$1</del>")
      .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, '<code class="bg-foreground/[0.07] px-1 py-0.5 rounded text-[12px] font-mono text-pink-600 dark:text-pink-400">$1</code>');
    return <span className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const getWordCount = (str) => (str.trim() ? str.trim().split(/\s+/).length : 0);

  const insertFormat = (tag) => {
    const input = postInputRef.current;
    if (!input) return;
    const start = input.selectionStart, end = input.selectionEnd, text = newPostText;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + `<${tag}>` + selected + `</${tag}>` + text.substring(end);
    setNewPostText(newText);
    setTimeout(() => {
      input.focus();
      const pos = start + tag.length * 2 + 5 + selected.length;
      input.setSelectionRange(pos, pos);
    }, 50);
  };

  const openComposer = (post = null) => {
    playBeep();
    setErrorMsg("");
    setEditingPostId(post?._id || null);
    setNewPostText(post?.message || "");
    setActiveMenu(null);
    setIsComposerOpen(true);
  };

  const handlePublishPost = async () => {
    if (!newPostText.trim()) return;
    if (getWordCount(newPostText) > 350) return setErrorMsg("Quá dài (tối đa 350 từ)");
    setComposerSubmitting(true);
    setErrorMsg("");
    playBeep();
    const editing = !!editingPostId;
    try {
      const res = await fetch(editing ? `/api/bios/community/chat/${editingPostId}` : "/api/bios/community/chat", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newPostText.trim(),
          lat: coords.lat || 10.8,
          lng: coords.lng || 106.6,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Post comes back as 'pending' — the AI queue publishes it shortly.
        setPosts((prev) => (editing ? prev.map((p) => (p._id === editingPostId ? data.message : p)) : [data.message, ...prev]));
        setNewPostText("");
        setEditingPostId(null);
        setIsComposerOpen(false);
        playMove();
        notify.success(editing ? "Đã cập nhật — AI đang kiểm duyệt lại" : "Đã gửi — AI đang kiểm duyệt bài của bạn");
      } else {
        setErrorMsg(data.error || "Lỗi đăng bài");
        notify.error(data.error || "Không thể đăng bài");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối");
      notify.error("Lỗi kết nối, thử lại nhé");
    } finally {
      setComposerSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes: data.likes } : p)));
    } catch (err) {}
  };

  const handleAddComment = async () => {
    if (!activeCommentPostId || !commentInput.trim()) return;
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${activeCommentPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => (p._id === activeCommentPostId ? { ...p, comments: data.comments } : p)));
        setCommentInput("");
        playMove();
      }
    } catch (err) {}
  };

  const handleDeletePost = async (postId) => {
    setActiveMenu(null);
    const ok = await notify.confirm({ title: "Xóa bài viết?", message: "Bài viết sẽ bị xóa vĩnh viễn.", confirmText: "Xóa", cancelText: "Hủy", danger: true });
    if (!ok) return;
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        notify.success("Đã xóa bài viết");
      } else notify.error("Không thể xóa bài");
    } catch (err) {
      notify.error("Lỗi kết nối");
    }
  };

  const getIgTime = (dateStr) => {
    const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const isUnanswered = (p) => p.category === "câu hỏi" && !(p.comments?.length) && !p.resolved;

  const filteredPosts = useMemo(() => {
    let list = [...posts];
    // Smart search: diacritic-insensitive, every token must appear somewhere in
    // the post's content — message, author, tag, and AI glossary terms.
    const q = normalize(search.trim());
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = normalize(
          [p.message, p.senderName, p.category, ...(p.glossary || []).flatMap((g) => [g.term, g.definition])].join(" ")
        );
        return tokens.every((tk) => hay.includes(tk));
      });
    }
    // Everything mixed together, newest first. Filtering is done via search.
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [posts, search]);

  const activePost = posts.find((p) => p._id === activeCommentPostId);

  const handleToggleResolve = async (postId) => {
    playBeep();
    setActiveMenu(null);
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}/resolve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, resolved: data.resolved } : p)));
        notify.success(data.resolved ? "Đã đánh dấu đã giải đáp" : "Đã bỏ đánh dấu");
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-2.5 animate-fadeIn">
      {/* ── Search + compose (sticky, follows scroll) ── */}
      <div className="sticky top-1 z-30 -mx-1 flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-1.5 py-1.5 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-zinc-900/55">
        <div className="flex h-9 flex-1 items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2.5">
          <span className="material-symbols-outlined text-[15px] text-muted-foreground">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full bg-transparent text-[11.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => openComposer()}
          aria-label="Đăng bài"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white shadow-md shadow-black/20 transition active:scale-90"
          style={{ background: BRAND }}
        >
          <span className="material-symbols-outlined text-[18px]">edit_square</span>
        </button>
      </div>

      {/* AI moderation notice for the author's own in-review posts */}
      {posts.some((p) => p.senderEmail === memberSession?.email && p.status === "pending") && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] px-3.5 py-2.5">
          <span className="material-symbols-outlined animate-spin text-[18px] text-indigo-500">progress_activity</span>
          <p className="text-[11.5px] font-semibold text-foreground">
            Bài của bạn đang được <b>AI kiểm duyệt</b> theo hàng đợi — sẽ tự đăng khi duyệt xong.
          </p>
        </div>
      )}

      {/* ── Feed ── */}
      {postsLoading && posts.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-foreground/10" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-foreground/10" />
                  <div className="h-2 w-16 animate-pulse rounded bg-foreground/10" />
                </div>
              </div>
              <div className="mt-4 h-16 w-full animate-pulse rounded bg-foreground/[0.06]" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/50">forum</span>
          <p className="mt-3 text-sm font-black text-foreground">Chưa có bài viết nào</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Hãy là người đầu tiên khởi đầu cuộc trò chuyện!</p>
          <button
            type="button"
            onClick={() => openComposer()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-[12px] font-black text-white transition hover:bg-indigo-600"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>Đăng bài
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-2.5 md:grid-cols-2">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes?.includes(memberSession?.email);
            const repliesCount = post.comments?.length || 0;
            const tag = tagOf(post.category);
            const isOwn = post.senderEmail === memberSession?.email;
            const isPending = post.status === "pending";
            const isRejected = post.status === "rejected";
            const isLive = !isPending && !isRejected;
            return (
              <div key={post._id} className={`relative flex flex-col rounded-2xl border bg-white/55 p-3 shadow-sm backdrop-blur-xl backdrop-saturate-150 transition-shadow hover:shadow-md dark:bg-zinc-900/45 ${isPending ? "border-indigo-500/30" : isRejected ? "border-rose-500/30" : "border-white/40 dark:border-white/10"}`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBio(post.senderSlug)}
                      disabled={!post.senderSlug}
                      className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-400 via-fuchsia-500 to-amber-400 p-[1.5px] transition active:scale-90 disabled:cursor-default"
                      aria-label={`Xem trang bio của ${post.senderName}`}
                    >
                      <img src={av(post.senderAvatar)} loading="lazy" className="h-full w-full rounded-full border-2 border-card object-cover" alt="" />
                    </button>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openBio(post.senderSlug)}
                        disabled={!post.senderSlug}
                        className="flex items-center gap-1 text-left disabled:cursor-default"
                      >
                        <span className="truncate text-[12.5px] font-black leading-tight text-foreground hover:underline">{post.senderName}</span>
                        {post.senderEmail === OWNER_EMAIL && (
                          <span className="material-symbols-outlined text-[12px] text-[#0095f6]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                      </button>
                      <span className="block text-[9.5px] uppercase tracking-wide text-muted-foreground">{getIgTime(post.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                        <span className="material-symbols-outlined animate-spin text-[11px]">progress_activity</span>Đang xét duyệt
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-300">
                        <span className="material-symbols-outlined text-[11px]">block</span>Bị từ chối
                      </span>
                    ) : (
                      <>
                        {post.category === "câu hỏi" && post.resolved && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>Đã giải đáp
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${tag.badge}`}>
                          <span className="material-symbols-outlined text-[11px]">{tag.icon}</span>
                          {tag.label}
                        </span>
                      </>
                    )}
                    <div className="relative">
                      <button onClick={() => { playBeep(); setActiveMenu(activeMenu === post._id ? null : post._id); }} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.06]">
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>
                      {activeMenu === post._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
                            {isOwn && post.category === "câu hỏi" && (
                              <button onClick={() => handleToggleResolve(post._id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-bold text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-[16px]">{post.resolved ? "remove_done" : "task_alt"}</span>
                                {post.resolved ? "Bỏ đã giải đáp" : "Đã giải đáp"}
                              </button>
                            )}
                            {isOwn ? (
                              <>
                                <button onClick={() => openComposer(post)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-bold text-foreground hover:bg-foreground/[0.06]">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>Chỉnh sửa
                                </button>
                                <button onClick={() => handleDeletePost(post._id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-bold text-rose-500 hover:bg-rose-500/10">
                                  <span className="material-symbols-outlined text-[16px]">delete</span>Xóa bài
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setActiveMenu(null)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-bold text-rose-500 hover:bg-rose-500/10">
                                <span className="material-symbols-outlined text-[16px]">flag</span>Báo cáo
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unanswered hint — nudge the community to help */}
                {isLive && isUnanswered(post) && (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[14px]">contact_support</span>
                    Chưa có lời giải — giúp bạn ấy nhé!
                  </div>
                )}

                {/* Body */}
                <div className={`mt-2 leading-snug ${post.isBot ? "font-display text-[14.5px] font-semibold tracking-tight" : "text-[13.5px]"} ${isLive ? "text-foreground/90" : "text-foreground/60"}`}>{formatText(post.message)}</div>

                {/* AI glossary — explains jargon for HSSV */}
                {isLive && post.glossary?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] p-2.5">
                    <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                      <span className="material-symbols-outlined text-[13px]">menu_book</span>Giải thích thuật ngữ (AI)
                    </p>
                    <div className="space-y-1">
                      {post.glossary.map((g, i) => (
                        <p key={i} className="text-[11.5px] leading-snug text-foreground/80">
                          <b className="text-foreground">{g.term}:</b> {g.definition}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending / rejected states */}
                {isPending && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-2.5 py-1.5 text-[10.5px] font-semibold text-foreground/80">
                    <span className="material-symbols-outlined animate-spin text-[14px] text-indigo-500">progress_activity</span>
                    AI đang kiểm duyệt & tự gắn thẻ — bài sẽ hiển thị công khai khi duyệt xong.
                  </div>
                )}
                {isRejected && (
                  <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-2.5 py-1.5 text-[10.5px] font-semibold text-rose-600 dark:text-rose-300">
                    Bài bị từ chối{post.rejectReason ? `: ${post.rejectReason}` : " do không phù hợp tiêu chuẩn cộng đồng."}
                  </div>
                )}

                {/* Action bar (only for published posts) */}
                {isLive && (
                  <>
                    <div className="mt-2 flex items-center gap-1 border-t border-border pt-1.5">
                      <button
                        onClick={() => handleToggleLike(post._id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold transition active:scale-95 ${hasLiked ? "text-rose-500" : "text-muted-foreground hover:bg-foreground/[0.05]"}`}
                      >
                        <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: hasLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        {post.likes?.length || 0}
                      </button>
                      <button
                        onClick={() => { playBeep(); setActiveCommentPostId(post._id); }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-muted-foreground transition hover:bg-foreground/[0.05] active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[17px]">mode_comment</span>
                        {repliesCount}
                      </button>
                    </div>

                    {repliesCount > 0 && (
                      <button onClick={() => setActiveCommentPostId(post._id)} className="mt-1 rounded-xl bg-foreground/[0.03] p-2.5 text-left transition hover:bg-foreground/[0.06]">
                        {repliesCount > 1 && <p className="mb-1 text-[11px] font-bold text-indigo-500">Xem tất cả {repliesCount} bình luận</p>}
                        <p className="line-clamp-2 text-[12px] leading-snug text-foreground/80">
                          <span className="font-black">{post.comments[repliesCount - 1].senderName}</span>{" "}
                          {post.comments[repliesCount - 1].message}
                        </p>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Composer modal — phone-first bottom sheet, keyboard-aware ── */}
      <AnimatePresence>
        {isComposerOpen && (
          <div
            className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center"
            style={{ paddingBottom: keyboardInset > 0 ? keyboardInset : undefined }}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsComposerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{ maxHeight: keyboardInset > 0 ? `calc(100dvh - ${keyboardInset + 16}px)` : undefined }}
              className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] border border-border bg-card shadow-2xl sm:rounded-[26px]"
            >
              {/* Header (pinned) */}
              <div className="shrink-0">
                <div className="flex w-full justify-center pt-2.5 sm:hidden"><div className="h-1.5 w-11 rounded-full bg-foreground/20" /></div>
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <button onClick={() => setIsComposerOpen(false)} className="rounded-lg px-2 py-1 text-[13px] font-bold text-muted-foreground hover:bg-foreground/[0.06]">Hủy</button>
                  <h2 className="text-[14px] font-black text-foreground">{editingPostId ? "Chỉnh sửa bài viết" : "Bài viết mới"}</h2>
                  <button
                    onClick={handlePublishPost}
                    disabled={composerSubmitting || !newPostText.trim()}
                    className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-black text-white shadow-sm transition active:scale-95 disabled:opacity-40"
                    style={{ background: BRAND }}
                  >
                    {composerSubmitting ? "Đang gửi..." : "Đăng"}
                  </button>
                </div>
              </div>

              {/* Scrollable content — stays visible above the keyboard */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] px-3 py-2">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-indigo-500">auto_awesome</span>
                  <p className="text-[10.5px] leading-snug text-foreground/80">
                    AI sẽ tự kiểm duyệt, <b>gắn thẻ Chia sẻ / Câu hỏi</b> và giải thích thuật ngữ giúp bạn. Bài đăng công khai sau khi duyệt xong. Chỉ dùng tiếng Việt hoặc tiếng Anh.
                  </p>
                </div>

                <div className="flex gap-3 px-4 pb-4 pt-3">
                  <img src={av(bio?.avatarUrl, "/image/avt7.png")} loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
                  <textarea
                    ref={postInputRef}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    autoFocus
                    rows={4}
                    placeholder="Bạn muốn chia sẻ hay hỏi điều gì?"
                    className="min-h-[100px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {errorMsg && <p className="px-4 pb-2 text-[12px] font-semibold text-rose-500">{errorMsg}</p>}
              </div>

              {/* Footer (pinned) */}
              <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
                <div className="flex gap-2">
                  {[{ tag: "b", icon: "format_bold" }, { tag: "i", icon: "format_italic" }, { tag: "code", icon: "code" }].map((btn) => (
                    <button key={btn.tag} type="button" onClick={() => insertFormat(btn.tag)} className="grid h-8 w-8 place-items-center rounded-full bg-foreground/[0.06] text-foreground transition hover:bg-foreground/10">
                      <span className="material-symbols-outlined text-[17px]">{btn.icon}</span>
                    </button>
                  ))}
                </div>
                <span className={`text-[12px] font-bold ${getWordCount(newPostText) > 350 ? "text-rose-500" : "text-muted-foreground"}`}>{getWordCount(newPostText)}/350</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Comments sheet — phone-first, drag-to-close ── */}
      <AnimatePresence>
        {activeCommentPostId && (
          <div className="fixed inset-0 z-[130] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPostId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              drag="y"
              dragControls={sheetDrag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) setActiveCommentPostId(null); }}
              className="relative z-10 flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-[26px] border border-border bg-card shadow-2xl sm:mx-auto sm:max-w-lg"
            >
              {/* Grab handle + header (only this zone starts the drag) */}
              <div className="shrink-0 touch-none cursor-grab active:cursor-grabbing" onPointerDown={(e) => sheetDrag.start(e)}>
                <div className="flex w-full justify-center pb-1.5 pt-2.5"><div className="h-1.5 w-11 rounded-full bg-foreground/20" /></div>
                <div className="flex items-center justify-between px-4 pb-2.5">
                  <span className="w-8" />
                  <h3 className="text-[14px] font-black text-foreground">
                    Bình luận {activePost?.comments?.length ? `· ${activePost.comments.length}` : ""}
                  </h3>
                  <button onClick={() => setActiveCommentPostId(null)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.08]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Original post context */}
              {activePost && (
                <div className="flex shrink-0 items-start gap-2.5 border-y border-border bg-foreground/[0.02] px-4 py-2.5">
                  <img src={av(activePost.senderAvatar)} loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-foreground">{activePost.senderName}</p>
                    <p className="line-clamp-2 text-[12px] leading-snug text-muted-foreground">{activePost.message}</p>
                  </div>
                </div>
              )}

              {/* Comment list */}
              <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
                {activePost?.comments?.length > 0 ? (
                  activePost.comments.map((cmt) => (
                    <div key={cmt._id} className="flex gap-2.5">
                      <img src={av(cmt.senderAvatar)} loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" />
                      <div className="min-w-0 flex-1">
                        <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-foreground/[0.05] px-3.5 py-2">
                          <p className="text-[12px] font-black text-foreground">{cmt.senderName}</p>
                          <p className="mt-0.5 break-words text-[13.5px] leading-snug text-foreground/85">{cmt.message}</p>
                        </div>
                        <p className="ml-1 mt-1 text-[10px] text-muted-foreground">{getIgTime(cmt.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted-foreground/40">chat_bubble</span>
                    <p className="mt-2 text-[13px] font-bold text-foreground">Chưa có bình luận</p>
                    <p className="text-[11px] text-muted-foreground">Hãy là người trả lời đầu tiên!</p>
                  </div>
                )}
              </div>

              {/* Composer bar — pinned, safe-area + keyboard aware */}
              <div
                className="flex shrink-0 items-center gap-2.5 border-t border-border bg-card px-3 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))]"
                style={keyboardInset > 0 ? { paddingBottom: keyboardInset + 12 } : undefined}
              >
                <img src={av(bio?.avatarUrl, "/image/avt7.png")} loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Viết bình luận..."
                  className="h-11 flex-1 rounded-full bg-foreground/[0.07] px-4 text-[15px] text-foreground outline-none ring-1 ring-inset ring-transparent transition focus:ring-indigo-500/40 placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentInput.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-lg shadow-indigo-500/30 transition active:scale-90 disabled:opacity-30 disabled:shadow-none"
                  style={{ background: BRAND }}
                  aria-label="Gửi bình luận"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
