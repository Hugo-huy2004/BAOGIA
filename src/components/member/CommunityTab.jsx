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

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const CHAT_API = `${API_BASE}/bios/community/chat`;

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

// Anonymous authors get a coloured disc (server picks the colour from the
// Hugo Studio palette at post time) with a person icon inside.
const AnonAvatar = ({ color, size = "h-9 w-9", icon = "text-[20px]" }) => (
  <div className={`grid ${size} shrink-0 place-items-center rounded-full shadow-sm`} style={{ background: color || BRAND }}>
    <span className={`material-symbols-outlined ${icon} text-white`} style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
  </div>
);

const isAnonPost = (p) => p.anonymous || (!p.senderAvatar && !p.senderSlug && p.senderName === "Người ẩn danh");

// Reading font for post/comment content — the system UI stack (what Facebook
// itself renders with): crisper at small sizes than the app's Jakarta Sans.
const READ_FONT = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };

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
  const [postAnon, setPostAnon] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const postInputRef = useRef(null);

  // Comments sheet
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [activeMenu, setActiveMenu] = useState(null);

  // On-demand AI glossary: postId being fetched + which posts have theirs open.
  const [glossaryLoadingId, setGlossaryLoadingId] = useState(null);
  const [glossaryOpen, setGlossaryOpen] = useState({});

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
      // rank=smart → server personalises the order by the user's interests.
      let url = `${CHAT_API}?rank=smart`;
      if (lat !== null && lng !== null) url += `&lat=${lat}&lng=${lng}`;
      const res = await fetch(url, { credentials: "include" });
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
    setPostAnon(false);
    setActiveMenu(null);
    setIsComposerOpen(true);
  };

  // Fetch (or reveal, when already cached) the AI glossary for one post.
  const handleExplainTerms = async (postId) => {
    playBeep();
    const post = posts.find((p) => p._id === postId);
    if (post?.glossaryAt || post?.glossary?.length) {
      setGlossaryOpen((prev) => ({ ...prev, [postId]: true }));
      if (post.glossaryAt && !post.glossary?.length) notify.success("Bài này không có thuật ngữ khó cần giải thích");
      return;
    }
    setGlossaryLoadingId(postId);
    try {
      const res = await fetch(`${CHAT_API}/${postId}/glossary`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, glossary: data.glossary, glossaryAt: new Date().toISOString() } : p)));
      setGlossaryOpen((prev) => ({ ...prev, [postId]: true }));
      if (!data.glossary?.length) notify.success("Bài này không có thuật ngữ khó cần giải thích");
    } catch (err) {
      notify.error("Không giải thích được, thử lại nhé");
    } finally {
      setGlossaryLoadingId(null);
    }
  };

  const handlePublishPost = async () => {
    if (!newPostText.trim()) return;
    if (getWordCount(newPostText) > 350) return setErrorMsg("Quá dài (tối đa 350 từ)");
    const editing = !!editingPostId;

    // Paid option → explicit confirmation before any JOY leaves the wallet.
    if (!editing && postAnon) {
      const ok = await notify.confirm({
        title: "Đăng bài ẩn danh?",
        message: "Bạn sẽ bị trừ 20 JOY cho bài đăng này. Hóa đơn sẽ được lưu vào lịch sử JOY của bạn.",
        confirmText: "Đồng ý trừ 20 JOY",
        cancelText: "Hủy",
      });
      if (!ok) return;
    }

    setComposerSubmitting(true);
    setErrorMsg("");
    playBeep();
    try {
      const res = await fetch(editing ? `${CHAT_API}/${editingPostId}` : CHAT_API, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newPostText.trim(),
          lat: coords.lat || 10.8,
          lng: coords.lng || 106.6,
          anonymous: !editing && postAnon,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Post comes back as 'pending' — the AI queue publishes it shortly.
        setPosts((prev) => (editing ? prev.map((p) => (p._id === editingPostId ? data.message : p)) : [data.message, ...prev]));
        setNewPostText("");
        setEditingPostId(null);
        setPostAnon(false);
        setIsComposerOpen(false);
        playMove();
        if (data.joyCharged) {
          notify.success(`Đã trừ ${data.joyCharged} JOY (còn ${data.joyBalance} JOY) — hóa đơn đã lưu vào lịch sử JOY. AI đang kiểm duyệt bài của bạn.`);
        } else {
          notify.success(editing ? "Đã cập nhật — AI đang kiểm duyệt lại" : "Đã gửi — AI đang kiểm duyệt bài của bạn");
        }
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

  // Optimistic like: flip the heart instantly, reconcile with the server
  // response, and revert if the request fails.
  const flipLike = (postId, email) => (prev) =>
    prev.map((p) => {
      if (p._id !== postId) return p;
      const liked = p.likes?.includes(email);
      return { ...p, likes: liked ? p.likes.filter((e) => e !== email) : [...(p.likes || []), email] };
    });

  const handleToggleLike = async (postId) => {
    const email = memberSession?.email;
    if (!email) return;
    playBeep();
    setPosts(flipLike(postId, email));
    try {
      const res = await fetch(`${CHAT_API}/${postId}/like`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes: data.likes } : p)));
    } catch (err) {
      setPosts(flipLike(postId, email));
      notify.error("Không thể thả tim, thử lại nhé");
    }
  };

  const handleAddComment = async () => {
    if (!activeCommentPostId || !commentInput.trim() || commentSubmitting) return;
    playBeep();
    setCommentSubmitting(true);
    try {
      const res = await fetch(`${CHAT_API}/${activeCommentPostId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentInput.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPosts((prev) => prev.map((p) => (p._id === activeCommentPostId ? { ...p, comments: data.comments } : p)));
      setCommentInput("");
      playMove();
    } catch (err) {
      notify.error(err?.message || "Không gửi được bình luận, thử lại nhé");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    setActiveMenu(null);
    const ok = await notify.confirm({ title: "Xóa bài viết?", message: "Bài viết sẽ bị xóa vĩnh viễn.", confirmText: "Xóa", cancelText: "Hủy", danger: true });
    if (!ok) return;
    playBeep();
    try {
      const res = await fetch(`${CHAT_API}/${postId}`, { method: "DELETE", credentials: "include" });
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
    // Keep the server's personalised order; only float the user's own pending
    // posts to the very top so they can see them being reviewed.
    const isOwnPending = (p) => p.senderEmail === memberSession?.email && p.status === "pending";
    const pending = list.filter(isOwnPending);
    const rest = list.filter((p) => !isOwnPending(p));
    return [...pending, ...rest];
  }, [posts, search, memberSession?.email]);

  const activePost = posts.find((p) => p._id === activeCommentPostId);

  const handleToggleResolve = async (postId) => {
    playBeep();
    setActiveMenu(null);
    try {
      const res = await fetch(`${CHAT_API}/${postId}/resolve`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, resolved: data.resolved } : p)));
        notify.success(data.resolved ? "Đã đánh dấu đã giải đáp" : "Đã bỏ đánh dấu");
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-2.5 animate-fadeIn">
      {/* ── Search (sticky, follows scroll) ── */}
      <div className="sticky top-1 z-30 -mx-1 rounded-full bg-white px-1 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.1)] dark:bg-zinc-900 dark:shadow-black/40">
        <div className="flex h-9 items-center gap-2 rounded-full bg-slate-100 px-3.5 dark:bg-zinc-800">
          <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm trong cộng đồng..."
            className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700">
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Composer trigger — Facebook-style "what's on your mind" card ── */}
      <div className="-mx-1 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:bg-zinc-900 dark:shadow-black/40">
        <div className="flex items-center gap-2.5">
          <img src={av(bio?.avatarUrl, "/image/avt7.png")} loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" alt="" />
          <button
            type="button"
            onClick={() => openComposer()}
            className="h-10 flex-1 rounded-full bg-slate-100 px-4 text-left text-[13px] text-slate-500 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Bạn muốn chia sẻ hay hỏi điều gì?
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-around border-t border-slate-100 pt-2 dark:border-zinc-800">
          <button type="button" onClick={() => openComposer()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-indigo-500 transition hover:bg-slate-100 dark:hover:bg-zinc-800">
            <span className="material-symbols-outlined text-[19px]">tips_and_updates</span>Chia sẻ
          </button>
          <button type="button" onClick={() => openComposer()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-amber-500 transition hover:bg-slate-100 dark:hover:bg-zinc-800">
            <span className="material-symbols-outlined text-[19px]">help</span>Đặt câu hỏi
          </button>
        </div>
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
        <div className="-mx-1 flex flex-col gap-px">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 dark:bg-zinc-900">
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
        <div className="-mx-1 flex flex-col items-center justify-center bg-white py-16 text-center shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:bg-zinc-900 dark:shadow-black/40">
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
        <div className="-mx-1 flex flex-col gap-px">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes?.includes(memberSession?.email);
            const repliesCount = post.comments?.length || 0;
            const tag = tagOf(post.category);
            const isOwn = post.senderEmail === memberSession?.email;
            const isPending = post.status === "pending";
            const isRejected = post.status === "rejected";
            const isLive = !isPending && !isRejected;
            return (
              <div key={post._id} className={`relative flex flex-col bg-white p-3.5 dark:bg-zinc-900 ${isPending ? "ring-1 ring-inset ring-indigo-500/30" : isRejected ? "ring-1 ring-inset ring-rose-500/30" : ""}`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {isAnonPost(post) ? (
                      <AnonAvatar color={post.anonColor} size="h-8 w-8" icon="text-[18px]" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBio(post.senderSlug)}
                        disabled={!post.senderSlug}
                        className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-400 via-fuchsia-500 to-amber-400 p-[1.5px] transition active:scale-90 disabled:cursor-default"
                        aria-label={`Xem trang bio của ${post.senderName}`}
                      >
                        <img src={av(post.senderAvatar)} loading="lazy" className="h-full w-full rounded-full border-2 border-card object-cover" alt="" />
                      </button>
                    )}
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

                {/* Body — one uniform size for every author (bot posts look like anyone else's) */}
                <div style={READ_FONT} className={`mt-2 text-[13px] leading-relaxed ${isLive ? "text-foreground/95" : "text-foreground/60"}`}>{formatText(post.message)}</div>

                {/* AI glossary — generated on demand when the reader taps the button */}
                {isLive && (
                  glossaryOpen[post._id] && post.glossary?.length > 0 ? (
                    <div className="mt-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] p-2.5">
                      <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                        <span className="material-symbols-outlined text-[13px]">menu_book</span>Giải thích thuật ngữ (AI)
                      </p>
                      <div className="space-y-1">
                        {post.glossary.map((g, i) => (
                          <p key={i} className="text-[11px] leading-snug text-foreground/80">
                            <b className="text-foreground">{g.term}:</b> {g.definition}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : !glossaryOpen[post._id] ? (
                    <button
                      type="button"
                      onClick={() => handleExplainTerms(post._id)}
                      disabled={glossaryLoadingId === post._id}
                      className="mt-2 inline-flex items-center gap-1 self-start text-[10.5px] font-bold text-indigo-500 hover:underline disabled:opacity-60 dark:text-indigo-400"
                    >
                      <span className={`material-symbols-outlined text-[13px] ${glossaryLoadingId === post._id ? "animate-spin" : ""}`}>
                        {glossaryLoadingId === post._id ? "progress_activity" : "menu_book"}
                      </span>
                      {glossaryLoadingId === post._id ? "AI đang giải thích..." : "Giải thích thuật ngữ"}
                    </button>
                  ) : null
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

                {/* Action bar (only for published posts) — Facebook-style */}
                {isLive && (
                  <>
                    {/* Reaction summary row */}
                    {((post.likes?.length || 0) > 0 || repliesCount > 0) && (
                      <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-slate-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          {(post.likes?.length || 0) > 0 && (
                            <>
                              <span className="grid h-[17px] w-[17px] place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 shadow-sm">
                                <span className="material-symbols-outlined text-[11px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                              </span>
                              {post.likes.length}
                            </>
                          )}
                        </span>
                        {repliesCount > 0 && (
                          <button onClick={() => setActiveCommentPostId(post._id)} className="hover:underline">{repliesCount} bình luận</button>
                        )}
                      </div>
                    )}

                    {/* Big split action buttons */}
                    <div className="mt-1.5 grid grid-cols-2 gap-1 border-t border-slate-100 pt-1 dark:border-zinc-800">
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleToggleLike(post._id)}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold transition-colors ${hasLiked ? "text-rose-500 bg-rose-500/[0.06]" : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
                      >
                        <motion.span
                          key={hasLiked ? "liked" : "unliked"}
                          initial={{ scale: hasLiked ? 0.4 : 1 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          className="material-symbols-outlined text-[19px]"
                          style={{ fontVariationSettings: hasLiked ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </motion.span>
                        Thích
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => { playBeep(); setActiveCommentPostId(post._id); }}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <span className="material-symbols-outlined text-[19px]">mode_comment</span>
                        Bình luận
                      </motion.button>
                    </div>

                    {repliesCount > 0 && (
                      <button onClick={() => setActiveCommentPostId(post._id)} className="mt-1 rounded-xl bg-slate-50 p-2.5 text-left transition hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800">
                        {repliesCount > 1 && <p className="mb-1 text-[11px] font-bold text-indigo-500">Xem tất cả {repliesCount} bình luận</p>}
                        <p style={READ_FONT} className="line-clamp-2 text-[12px] leading-snug text-foreground/80">
                          <span className="font-bold">{post.comments[repliesCount - 1].senderName}</span>{" "}
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
                    style={READ_FONT}
                    className="min-h-[100px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>

                {/* Anonymous option — paid (20 JOY), new posts only */}
                {!editingPostId && (
                  <button
                    type="button"
                    onClick={() => { playBeep(); setPostAnon((v) => !v); }}
                    className={`mx-4 mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${postAnon ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-border text-muted-foreground hover:bg-foreground/[0.04]"}`}
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: postAnon ? "'FILL' 1" : "'FILL' 0" }}>
                      {postAnon ? "check_circle" : "visibility_off"}
                    </span>
                    Đăng ẩn danh · −20 JOY
                  </button>
                )}

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
                  {isAnonPost(activePost) ? (
                    <AnonAvatar color={activePost.anonColor} size="h-8 w-8" icon="text-[18px]" />
                  ) : (
                    <img src={av(activePost.senderAvatar)} loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" />
                  )}
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
                          <p style={READ_FONT} className="mt-0.5 break-words text-[13px] leading-snug text-foreground/90">{cmt.message}</p>
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
                  disabled={!commentInput.trim() || commentSubmitting}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-lg shadow-indigo-500/30 transition active:scale-90 disabled:opacity-30 disabled:shadow-none"
                  style={{ background: BRAND }}
                  aria-label="Gửi bình luận"
                >
                  <span className={`material-symbols-outlined text-[20px] ${commentSubmitting ? "animate-spin" : ""}`}>{commentSubmitting ? "progress_activity" : "arrow_upward"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
