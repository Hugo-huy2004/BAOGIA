import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArcadeSound } from "../../hooks/useArcadeSound";
import { useKeyboardInset } from "../../hooks/useKeyboardVisible";

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
    solid: "linear-gradient(135deg,#6366f1,#a855f7)",
  },
  "câu hỏi": {
    key: "câu hỏi",
    label: "Câu hỏi",
    icon: "help",
    dot: "bg-amber-500",
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    solid: "linear-gradient(135deg,#f59e0b,#f43f5e)",
  },
};
const tagOf = (c) => TAGS[c] || TAGS["chia sẻ"];

export default function CommunityTab({ memberSession, bio }) {
  const { playBeep, playMove } = useArcadeSound();
  const keyboardInset = useKeyboardInset();

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState("checking");
  const [filter, setFilter] = useState("all"); // all | chia sẻ | câu hỏi

  // Composer
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostTag, setNewPostTag] = useState("chia sẻ");
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const postInputRef = useRef(null);

  // Comments sheet
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  const [activeMenu, setActiveMenu] = useState(null);

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

  const openComposer = (tag = "chia sẻ") => {
    playBeep();
    setNewPostTag(tag);
    setErrorMsg("");
    setIsComposerOpen(true);
  };

  const handlePublishPost = async () => {
    if (!newPostText.trim()) return;
    if (getWordCount(newPostText) > 350) return setErrorMsg("Quá dài (tối đa 350 từ)");
    setComposerSubmitting(true);
    setErrorMsg("");
    playBeep();
    try {
      const res = await fetch("/api/bios/community/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newPostText.trim(),
          category: newPostTag,
          lat: coords.lat || 10.8,
          lng: coords.lng || 106.6,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [data.message, ...prev]);
        setNewPostText("");
        setIsComposerOpen(false);
        playMove();
      } else setErrorMsg(data.error || "Lỗi đăng bài");
    } catch (err) {
      setErrorMsg("Lỗi kết nối");
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
    if (!window.confirm("Xóa bài viết này?")) return;
    playBeep();
    setActiveMenu(null);
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}`, { method: "DELETE" });
      if (res.ok) setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {}
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

  const filteredPosts = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter]
  );
  const counts = useMemo(
    () => ({
      all: posts.length,
      "chia sẻ": posts.filter((p) => p.category === "chia sẻ").length,
      "câu hỏi": posts.filter((p) => p.category === "câu hỏi").length,
    }),
    [posts]
  );
  const activePost = posts.find((p) => p._id === activeCommentPostId);

  return (
    <div className="space-y-5 animate-fadeIn md:space-y-6">
      {/* ── Quick composer prompt + filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => openComposer("chia sẻ")}
          className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-foreground/[0.03]"
        >
          <img src={bio?.avatarUrl || "/image/avt7.png"} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <span className="text-[13px] font-medium text-muted-foreground">Bạn muốn chia sẻ hay hỏi điều gì?</span>
          <span className="material-symbols-outlined ml-auto text-[20px] text-indigo-500">add_circle</span>
        </button>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-foreground/[0.03] p-1 sm:w-auto">
          {[
            { k: "all", label: "Tất cả", icon: "forum" },
            { k: "chia sẻ", label: "Chia sẻ", icon: TAGS["chia sẻ"].icon },
            { k: "câu hỏi", label: "Câu hỏi", icon: TAGS["câu hỏi"].icon },
          ].map((f) => {
            const active = filter === f.k;
            return (
              <button
                key={f.k}
                type="button"
                onClick={() => { playBeep(); setFilter(f.k); }}
                className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-black transition-all active:scale-95 ${
                  active ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: f.k === "câu hỏi" ? TAGS["câu hỏi"].solid : "linear-gradient(135deg,#6366f1,#a855f7)" } : undefined}
              >
                <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                <span className="hidden xs:inline sm:inline">{f.label}</span>
                <span className={`ml-0.5 text-[9px] font-bold ${active ? "text-white/80" : "text-muted-foreground/70"}`}>{counts[f.k]}</span>
              </button>
            );
          })}
        </div>
      </div>

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
            onClick={() => openComposer("chia sẻ")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-[12px] font-black text-white transition hover:bg-indigo-600"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>Đăng bài
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes?.includes(memberSession?.email);
            const repliesCount = post.comments?.length || 0;
            const tag = tagOf(post.category);
            const isOwn = post.senderEmail === memberSession?.email;
            return (
              <div key={post._id} className="relative flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-indigo-400 via-fuchsia-500 to-amber-400 p-[1.5px]">
                      <img src={post.senderAvatar || "/image/avt1.png"} className="h-full w-full rounded-full border-2 border-card object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-[13px] font-black text-foreground">{post.senderName}</span>
                        {post.senderEmail === OWNER_EMAIL && (
                          <span className="material-symbols-outlined text-[13px] text-[#0095f6]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{getIgTime(post.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${tag.badge}`}>
                      <span className="material-symbols-outlined text-[11px]">{tag.icon}</span>
                      {tag.label}
                    </span>
                    <div className="relative">
                      <button onClick={() => { playBeep(); setActiveMenu(activeMenu === post._id ? null : post._id); }} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.06]">
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>
                      {activeMenu === post._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
                            {isOwn ? (
                              <button onClick={() => handleDeletePost(post._id)} className="w-full px-4 py-2 text-left text-[13px] font-bold text-rose-500 hover:bg-rose-500/10">Xóa bài</button>
                            ) : (
                              <button onClick={() => setActiveMenu(null)} className="w-full px-4 py-2 text-left text-[13px] font-bold text-rose-500 hover:bg-rose-500/10">Báo cáo</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="mt-3 text-[14px] leading-relaxed text-foreground/90">{formatText(post.message)}</div>

                {/* Action bar */}
                <div className="mt-4 flex items-center gap-1 border-t border-border pt-2.5">
                  <button
                    onClick={() => handleToggleLike(post._id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${hasLiked ? "text-rose-500" : "text-muted-foreground hover:bg-foreground/[0.05]"}`}
                  >
                    <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: hasLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    {post.likes?.length || 0}
                  </button>
                  <button
                    onClick={() => { playBeep(); setActiveCommentPostId(post._id); }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-muted-foreground transition hover:bg-foreground/[0.05] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[19px]">mode_comment</span>
                    {repliesCount}
                  </button>
                  <button className="ml-auto inline-flex items-center rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-foreground/[0.05] active:scale-95">
                    <span className="material-symbols-outlined text-[19px]">bookmark</span>
                  </button>
                </div>

                {/* Latest comment preview */}
                {repliesCount > 0 && (
                  <button onClick={() => setActiveCommentPostId(post._id)} className="mt-1 rounded-xl bg-foreground/[0.03] p-2.5 text-left transition hover:bg-foreground/[0.06]">
                    {repliesCount > 1 && <p className="mb-1 text-[11px] font-bold text-indigo-500">Xem tất cả {repliesCount} bình luận</p>}
                    <p className="line-clamp-2 text-[12px] leading-snug text-foreground/80">
                      <span className="font-black">{post.comments[repliesCount - 1].senderName}</span>{" "}
                      {post.comments[repliesCount - 1].message}
                    </p>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Composer modal ── */}
      <AnimatePresence>
        {isComposerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsComposerOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="relative z-10 flex w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <button onClick={() => setIsComposerOpen(false)} className="text-[13px] font-bold text-muted-foreground">Hủy</button>
                <h2 className="text-[14px] font-black text-foreground">Bài viết mới</h2>
                <button
                  onClick={handlePublishPost}
                  disabled={composerSubmitting || !newPostText.trim()}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-black text-white transition disabled:opacity-40"
                  style={{ background: tagOf(newPostTag).solid }}
                >
                  {composerSubmitting ? "Đang đăng..." : "Đăng"}
                </button>
              </div>

              {/* Tag picker */}
              <div className="px-4 pt-3">
                <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Loại bài viết</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(TAGS).map((tg) => {
                    const active = newPostTag === tg.key;
                    return (
                      <button
                        key={tg.key}
                        type="button"
                        onClick={() => { playBeep(); setNewPostTag(tg.key); }}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                          active ? "border-transparent text-white shadow-md" : "border-border bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.05]"
                        }`}
                        style={active ? { background: tg.solid } : undefined}
                      >
                        <span className="material-symbols-outlined text-[20px]">{tg.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-black leading-none">{tg.label}</p>
                          <p className={`mt-0.5 text-[9px] leading-tight ${active ? "text-white/80" : "text-muted-foreground"}`}>
                            {tg.key === "câu hỏi" ? "Nhờ cộng đồng giải đáp" : "Lan tỏa điều hay"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text area */}
              <div className="flex gap-3 px-4 pt-3">
                <img src={bio?.avatarUrl || "/image/avt7.png"} className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
                <textarea
                  ref={postInputRef}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  autoFocus
                  rows={5}
                  placeholder={newPostTag === "câu hỏi" ? "Bạn đang thắc mắc điều gì?" : "Bạn muốn chia sẻ điều gì?"}
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              {errorMsg && <p className="px-4 pt-1 text-[12px] font-semibold text-rose-500">{errorMsg}</p>}

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
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

      {/* ── Comments bottom sheet ── */}
      <AnimatePresence>
        {activeCommentPostId && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPostId(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="relative z-10 flex h-[75vh] w-full flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:mx-auto sm:max-w-lg"
            >
              <div className="flex w-full justify-center pb-2 pt-3"><div className="h-1 w-10 rounded-full bg-foreground/20" /></div>
              <div className="border-b border-border pb-3 text-center text-[14px] font-black text-foreground">
                Bình luận {activePost?.comments?.length ? `· ${activePost.comments.length}` : ""}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {activePost?.comments?.length > 0 ? (
                  activePost.comments.map((cmt) => (
                    <div key={cmt._id} className="flex gap-3">
                      <img src={cmt.senderAvatar || "/image/avt1.png"} className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" />
                      <div className="min-w-0 flex-1 rounded-2xl bg-foreground/[0.04] px-3 py-2 text-[13px] leading-snug">
                        <span className="mr-1.5 font-black text-foreground">{cmt.senderName}</span>
                        <span className="text-foreground/85">{cmt.message}</span>
                        <div className="mt-1 text-[10px] text-muted-foreground">{getIgTime(cmt.createdAt)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-10 text-center text-[13px] text-muted-foreground">Chưa có bình luận nào.</div>
                )}
              </div>

              <div className="flex items-center gap-3 border-t border-border bg-card p-3" style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 12 : 20 }}>
                <img src={bio?.avatarUrl || "/image/avt7.png"} className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Thêm bình luận..."
                  className="flex-1 rounded-full bg-foreground/[0.06] px-4 py-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <button onClick={handleAddComment} disabled={!commentInput.trim()} className="text-[14px] font-black text-indigo-500 disabled:opacity-40">Đăng</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
