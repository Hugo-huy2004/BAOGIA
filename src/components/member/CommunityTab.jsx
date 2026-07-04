import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArcadeSound } from "../../hooks/useArcadeSound";
import { useKeyboardInset } from "../../hooks/useKeyboardVisible";

export default function CommunityTab({ memberSession, bio }) {
  const { playBeep, playMove } = useArcadeSound();
  const keyboardInset = useKeyboardInset();

  // State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState("checking");

  // Create Post Modal
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const postInputRef = useRef(null);

  // Comments Bottom Sheet
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const commentInputRef = useRef(null);

  // Editing states
  const [editingPost, setEditingPost] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // 1. Geolocation & Fetch
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
      (err) => {
        setLocationStatus("fallback");
        fetchPosts(null, null);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (locationStatus === "checking") return;
    const interval = setInterval(() => fetchPosts(coords.lat, coords.lng, false), 7000);
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
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong>$1</strong>')
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<em>$1</em>')
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span style="text-decoration: underline;">$1</span>')
      .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, '<del>$1</del>')
      .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[12px] font-mono text-pink-600">$1</code>');
    return <span className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const getWordCount = str => str.trim() ? str.trim().split(/\s+/).length : 0;

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
        body: JSON.stringify({ message: newPostText.trim(), lat: coords.lat || 10.8, lng: coords.lng || 106.6 })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => [data.message, ...prev]);
        setNewPostText("");
        setIsComposerOpen(false);
        playMove();
      } else setErrorMsg(data.error || "Lỗi đăng bài");
    } catch (err) { setErrorMsg("Lỗi kết nối"); }
    finally { setComposerSubmitting(false); }
  };

  const handleToggleLike = async (postId) => {
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.likes } : p));
    } catch (err) {}
  };

  const handleAddComment = async () => {
    if (!activeCommentPostId || !commentInput.trim()) return;
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${activeCommentPostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p._id === activeCommentPostId ? { ...p, comments: data.comments } : p));
        setCommentInput("");
        playMove();
      }
    } catch (err) {}
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Xóa bài viết này?")) return;
    playBeep();
    try {
      const res = await fetch(`/api/bios/community/chat/${postId}`, { method: "DELETE" });
      if (res.ok) setPosts(prev => prev.filter(p => p._id !== postId));
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

  const activePost = posts.find(p => p._id === activeCommentPostId);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-50 relative pb-16 sm:pb-0 font-['Inter',sans-serif]">
      
      {/* 1. Header (Instagram Style) */}
      <div className="sticky top-0 z-30 w-full px-4 h-[52px] flex items-center justify-between bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-900">
        <h1 className="text-[22px] font-bold font-serif italic tracking-tighter">
          Cộng đồng
        </h1>
        <div className="flex items-center gap-5">
          <button onClick={() => { playBeep(); setIsComposerOpen(true); }} className="hover:opacity-60 transition-opacity">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 300" }}>add_box</span>
          </button>
          <button className="hover:opacity-60 transition-opacity relative">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 300" }}>favorite</span>
            <div className="absolute top-1 right-0 w-2 h-2 rounded-full bg-[#ff3040] border border-white dark:border-black" />
          </button>
        </div>
      </div>

      {/* 2. Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-none w-full" style={{ paddingBottom: keyboardInset > 0 ? keyboardInset : 0 }}>
        {postsLoading && posts.length === 0 ? (
          <div className="p-4 space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-zinc-200 animate-pulse" /><div className="w-32 h-3 bg-zinc-200 animate-pulse rounded" /></div>
                <div className="w-full h-24 bg-zinc-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-900 w-full">
            {posts.map((post) => {
              const hasLiked = post.likes?.includes(memberSession?.email);
              const repliesCount = post.comments?.length || 0;

              return (
                <div key={post._id} className="pt-3 pb-4 w-full">
                  {/* Post Header */}
                  <div className="flex items-center justify-between px-3.5 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-[36px] h-[36px] shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-white dark:bg-black p-[1.5px]">
                          <img src={post.senderAvatar || "/image/avt1.png"} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[13px] leading-none tracking-tight">{post.senderName}</span>
                          {post.senderEmail === "huylggcs230377@fpt.edu.vn" && (
                            <span className="material-symbols-outlined text-[12px] text-[#0095f6]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          )}
                        </div>
                        {post.category && (
                          <span className="text-[11px] text-zinc-500 mt-0.5 tracking-wide">
                            {post.category} • {post.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* More options */}
                    <div className="relative">
                      <button onClick={() => { playBeep(); setActiveMenu(activeMenu === post._id ? null : post._id); }} className="p-1">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                      {activeMenu === post._id && (
                        <div className="absolute right-0 top-8 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 shadow-xl rounded-xl py-1 w-32">
                          {post.senderEmail === memberSession?.email ? (
                            <button onClick={() => handleDeletePost(post._id)} className="w-full px-4 py-2 text-[13px] text-rose-500 font-bold text-left">Xóa bài</button>
                          ) : (
                            <button onClick={() => setActiveMenu(null)} className="w-full px-4 py-2 text-[13px] text-rose-500 font-bold text-left">Báo cáo</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="px-4 text-[14px] leading-[1.4] tracking-normal mb-1">
                    {formatText(post.message)}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between px-3.5 mt-2 mb-2">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleToggleLike(post._id)} className="active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: hasLiked ? "'FILL' 1" : "'FILL' 0, 'wght' 300", color: hasLiked ? "#ff3040" : "inherit" }}>
                          favorite
                        </span>
                      </button>
                      <button onClick={() => { playBeep(); setActiveCommentPostId(post._id); }} className="active:opacity-50">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300", transform: "scaleX(-1)" }}>chat_bubble</span>
                      </button>
                      <button className="active:opacity-50">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300", transform: "rotate(-25deg)" }}>send</span>
                      </button>
                    </div>
                    <button className="active:opacity-50">
                      <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'wght' 300" }}>bookmark</span>
                    </button>
                  </div>

                  {/* Stats & Comments */}
                  <div className="px-4">
                    {post.likes?.length > 0 && (
                      <div className="text-[13px] font-semibold mb-1">{post.likes.length} lượt thích</div>
                    )}
                    
                    {/* View all comments prompt */}
                    {repliesCount > 0 && (
                      <div className="mb-1">
                        {repliesCount > 1 && (
                          <button onClick={() => setActiveCommentPostId(post._id)} className="text-[13px] text-zinc-500 mb-0.5">
                            Xem tất cả {repliesCount} bình luận
                          </button>
                        )}
                        {/* Show 1 comment inline */}
                        <div className="text-[13px] leading-[1.3] line-clamp-2">
                          <span className="font-semibold mr-1.5">{post.comments[post.comments.length - 1].senderName}</span>
                          <span>{post.comments[post.comments.length - 1].message}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-zinc-500 uppercase mt-1.5 tracking-wide">
                      {getIgTime(post.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Create Post Composer */}
      <AnimatePresence>
        {isComposerOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-zinc-200">
              <button onClick={() => setIsComposerOpen(false)} className="text-[15px]">Hủy</button>
              <h2 className="text-[16px] font-semibold">Bài viết mới</h2>
              <button onClick={handlePublishPost} disabled={composerSubmitting || !newPostText.trim()} className={`text-[15px] font-semibold ${newPostText.trim() ? "text-[#0095f6]" : "text-blue-300"}`}>
                Chia sẻ
              </button>
            </div>
            <div className="flex-1 p-4 flex gap-3">
              <img src={bio?.avatarUrl || "/image/avt7.png"} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
              <div className="flex-1 flex flex-col">
                <textarea ref={postInputRef} value={newPostText} onChange={e => setNewPostText(e.target.value)} autoFocus placeholder="Bạn đang nghĩ gì?" className="w-full flex-1 bg-transparent text-[15px] outline-none resize-none leading-relaxed" />
                {errorMsg && <p className="text-[12px] text-rose-500 mb-2">{errorMsg}</p>}
                <div className="border-t border-zinc-200 py-3 flex items-center justify-between">
                  <div className="flex gap-3">
                    {[{ tag: "b", icon: "format_bold" }, { tag: "i", icon: "format_italic" }, { tag: "code", icon: "code" }].map(btn => (
                      <button key={btn.tag} type="button" onClick={() => insertFormat(btn.tag)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                      </button>
                    ))}
                  </div>
                  <span className={`text-[12px] ${getWordCount(newPostText) > 350 ? "text-rose-500" : "text-zinc-400"}`}>{getWordCount(newPostText)}/350</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Comments Bottom Sheet */}
      <AnimatePresence>
        {activeCommentPostId && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPostId(null)} className="absolute inset-0 bg-black/50" />
            
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative z-10 w-full h-[75vh] bg-white dark:bg-black rounded-t-2xl flex flex-col shadow-2xl">
              {/* Handle Bar */}
              <div className="w-full flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" /></div>
              <div className="text-center font-semibold text-[15px] pb-3 border-b border-zinc-200 dark:border-zinc-800">Bình luận</div>
              
              {/* Comment List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activePost?.comments?.length > 0 ? activePost.comments.map(cmt => (
                  <div key={cmt._id} className="flex gap-3">
                    <img src={cmt.senderAvatar || "/image/avt1.png"} className="w-[32px] h-[32px] rounded-full object-cover shrink-0" alt="" />
                    <div className="flex-1 text-[13px] leading-[1.3]">
                      <span className="font-semibold mr-1.5">{cmt.senderName}</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{cmt.message}</span>
                      <div className="text-[11px] text-zinc-500 mt-1">{getIgTime(cmt.createdAt)}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-zinc-500 text-[14px] mt-10">Chưa có bình luận nào.</div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-black flex items-center gap-3" style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 12 : 24 }}>
                <img src={bio?.avatarUrl || "/image/avt7.png"} className="w-[36px] h-[36px] rounded-full object-cover shrink-0" alt="" />
                <input ref={commentInputRef} value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddComment()} placeholder="Thêm bình luận..." className="flex-1 bg-transparent text-[14px] outline-none" autoFocus />
                {commentInput.trim() && (
                  <button onClick={handleAddComment} className="text-[#0095f6] font-semibold text-[14px]">Đăng</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

