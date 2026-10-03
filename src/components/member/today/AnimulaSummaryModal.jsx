import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BorderBeam } from 'border-beam';
import { AnimulaAvatar } from '../banhocduong/AnimulaAvatar';
import { sensory } from '../../../lib/sensory';

function extractAnimulaSummary(article) {
  const title = String(article?.title || '').trim();
  const desc = String(article?.description || '').trim();

  const sentences = desc
    .split(/(?<=[.!?。！？;；])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const cleanTitle = title.replace(/^(tin nóng|nóng|mới nhất|bất ngờ|hé lộ|công bố):\s*/i, '');

  const metricSentence = sentences.find((s) =>
    /\b(?:\d+%|\d+[.,]\d+%|\d+\s*(?:tỷ|triệu|nghìn|USD|VNĐ|học sinh|sinh viên|trường|doanh nghiệp|mô hình|năm|tháng))/i.test(s)
  );

  const keyPoints = [];
  keyPoints.push({
    icon: 'adjust',
    label: 'Diễn biến cốt lõi',
    text: cleanTitle,
  });

  if (metricSentence && metricSentence !== cleanTitle) {
    keyPoints.push({
      icon: 'equalizer',
      label: 'Số liệu & Quy mô',
      text: metricSentence,
    });
  } else if (sentences[0] && sentences[0] !== cleanTitle) {
    keyPoints.push({
      icon: 'feed',
      label: 'Bối cảnh ghi nhận',
      text: sentences[0],
    });
  }

  const lastSentence = sentences.length > 1 ? sentences[sentences.length - 1] : null;
  if (lastSentence && lastSentence !== cleanTitle && lastSentence !== metricSentence) {
    keyPoints.push({
      icon: 'lightbulb',
      label: 'Điểm đáng lưu ý',
      text: lastSentence,
    });
  } else if (desc.length > 40) {
    keyPoints.push({
      icon: 'lightbulb',
      label: 'Đúc kết chi tiết',
      text: desc.slice(0, 160) + (desc.length > 160 ? '…' : ''),
    });
  }

  return {
    tldr: desc || `Bản tin đúc kết nhanh về "${cleanTitle}".`,
    points: keyPoints.slice(0, 3),
    takeaway: 'Animula đúc kết: Nắm bắt nhanh dữ liệu quan trọng giúp cậu tiết kiệm 90% thời gian đọc mà vẫn đủ góc nhìn toàn cảnh.',
  };
}

export default function AnimulaSummaryModal({
  article,
  isOpen,
  onClose,
  onOpenFull,
  isBookmarked,
  onToggleBookmark,
  companionType = 'clover',
  showToast,
}) {
  const [isExpanding, setIsExpanding] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (!isOpen || !article) {
      setIsExpanding(true);
      return;
    }

    setIsExpanding(true);
    sensory.pop();
    sensory.playTone(480, 'sine', 0.08, 0.04);
    sensory.vibrate('medium');

    const calculated = extractAnimulaSummary(article);
    setSummaryData(calculated);

    // Hiệu ứng Animula phóng to hào hứng và phân tích
    const timer = setTimeout(() => {
      setIsExpanding(false);
      sensory.success();
      sensory.vibrate('light');
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const handleCopySummary = async () => {
    if (!summaryData) return;
    const text = `✨ Hugo Animula TL;DR: ${article.title}\n\n${summaryData.tldr}\n\nÝ chính:\n${summaryData.points.map((p) => `• ${p.label}: ${p.text}`).join('\n')}\n\nNguồn: ${article.source || 'Bản tin Today'}`;
    try {
      await navigator.clipboard.writeText(text);
      sensory.pop();
      showToast?.('Đã sao chép tóm tắt thông minh của Animula!', 'success');
    } catch {
      showToast?.('Không thể sao chép văn bản', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {isExpanding ? (
            /* ── GIAI ĐOẠN 1: ANIMULA PHÓNG TO VÀ ĐỌC SUY NGHĨ (LOADING) ── */
            <motion.div
              key="expanding"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.25, 1.05], opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center py-12 px-6 text-center select-none"
            >
              <div className="relative">
                <AnimulaAvatar
                  size={110}
                  type={companionType}
                  state="working"
                  face="mouth"
                  shading="fabric"
                  interactive={false}
                />
                <span className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 space-y-1.5"
              >
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Hugo Animula
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 whitespace-nowrap">
                    Đang đúc kết...
                  </span>
                </div>
                <p className="text-sm text-zinc-300 font-medium max-w-xs mx-auto animate-pulse">
                  Đang quét nội dung và lọc lấy 3 ý quan trọng nhất cho cậu...
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* ── GIAI ĐOẠN 2: THẺ TÓM TẮT ĐÚC KẾT THÔNG MINH CỦA ANIMULA ── */
            <motion.div
              key="summary"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative w-full"
            >
              <BorderBeam size="md" colorVariant="colorful" strength={0.85} borderRadius={28}>
                <div className="relative overflow-hidden rounded-[28px] bg-white/95 dark:bg-[#15151e]/95 border border-white/20 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                  {/* Header thẻ tóm tắt */}
                  <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="flex items-center gap-3">
                      <AnimulaAvatar
                        size={46}
                        type={companionType}
                        state="default"
                        face="mouth"
                        shading="fabric"
                        interactive={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-foreground">
                            Hugo Animula
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                            Trí Tuệ Đúc Kết
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{article.source || 'Bản tin'}</span>
                          <span>·</span>
                          <span className="text-emerald-500 font-bold">Tóm tắt siêu tốc</span>
                        </p>
                      </div>
                    </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-foreground/70 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-90 transition-all"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Nội dung bài viết & Tóm tắt */}
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
                {/* Tiêu đề gốc */}
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {article.category || 'Tin tức'}
                  </span>
                  <h4 className="text-[15px] font-extrabold text-foreground leading-snug mt-1.5">
                    {article.title}
                  </h4>
                </div>

                {/* Hộp 3-Second TL;DR */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-400/20 dark:border-blue-500/20 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                    <span className="material-symbols-outlined text-[15px]">bolt</span>
                    3-Second TL;DR
                  </div>
                  <p className="text-[13px] font-medium leading-relaxed text-foreground/90">
                    {summaryData?.tldr}
                  </p>
                </div>

                {/* 3 Điểm Cốt Lõi (Key Takeaways) */}
                <div className="space-y-2">
                  <p className="text-[12px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">checklist</span>
                    3 Điểm Cốt Lõi Cần Nhớ
                  </p>
                  <div className="space-y-2">
                    {summaryData?.points.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 text-[13px]"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-500 shrink-0 mt-0.5">
                          {pt.icon}
                        </span>
                        <div>
                          <strong className="font-extrabold text-foreground block text-[12px]">
                            {pt.label}:
                          </strong>
                          <span className="text-foreground/80 leading-snug">
                            {pt.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lời nhắn từ Animula */}
                <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                    volunteer_activism
                  </span>
                  <p className="text-[12px] font-medium text-emerald-800 dark:text-emerald-300 leading-snug">
                    {summaryData?.takeaway}
                  </p>
                </div>
              </div>

              {/* Footer hành động */}
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/80 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>Sao chép</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sensory.tap();
                      onToggleBookmark?.(article.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 active:scale-95 shadow-sm ${
                      isBookmarked
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-foreground/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isBookmarked ? 'bookmark_added' : 'bookmark_border'}
                    </span>
                    <span>{isBookmarked ? 'Đã lưu' : 'Lưu lại'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sensory.pop();
                    onOpenFull?.(article);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all ml-auto"
                >
                  <span>Đọc bài đầy đủ</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </BorderBeam>
        </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
