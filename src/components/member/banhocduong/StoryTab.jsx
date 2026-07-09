import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryStore, STORY_DATA } from "./stores/storyStore";
import RiveCompanion from "./components/RiveCompanion";

export default function StoryTab({ bio }) {
  const {
    currentChapter,
    currentNode,
    activeCompanion,
    choiceHistory,
    storyPoints,
    makeChoice,
    setChapter,
    resetStory
  } = useStoryStore();

  const chapterData = STORY_DATA[currentChapter];
  const nodeData = chapterData?.nodes[currentNode];

  const handleChoice = (choice) => {
    makeChoice(choice.id, choice.label, choice.nextNode);
  };

  const handleNextChapter = () => {
    const nextChap = currentChapter + 1;
    if (STORY_DATA[nextChap]) {
      setChapter(nextChap);
    } else {
      // End of story or loop back for now
      resetStory();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-gradient-to-b from-slate-950 via-slate-900 to-[#0c0d12] text-white overflow-hidden p-3 md:p-6 gap-6 relative">
      {/* Aurora glow backdrops */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left panel: Visual Novel screen */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-black/40 border border-white/5 dark:border-white/[0.03] backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
        {/* Chapter Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between z-10 relative">
          <div>
            <h2 className="text-[12px] font-black text-sky-400 uppercase tracking-widest">
              {chapterData?.title || "Chương truyện"}
            </h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 line-clamp-1">
              {chapterData?.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] shadow-inner">
            <span className="material-symbols-outlined text-[14px] text-amber-400">workspace_premium</span>
            <span className="text-[10px] font-black tracking-wider text-amber-300">{storyPoints} SP</span>
          </div>
        </div>

        {/* Companion Stage */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCompanion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-56 h-56 flex items-center justify-center"
            >
              <RiveCompanion
                companion={activeCompanion}
                state={currentNode === "intro" ? "idle" : "happy"}
                className="w-full h-full"
              />
            </motion.div>
          </AnimatePresence>

          {/* Sparkles / Ambient particles */}
          <div className="absolute inset-0 bg-van-gogh-sky opacity-10 mix-blend-screen pointer-events-none" />
        </div>

        {/* Dynamic Dialog Box */}
        <div className="p-4 md:p-5 bg-gradient-to-t from-black/90 via-black/80 to-black/60 border-t border-white/[0.06] z-10 relative">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Speaker Tag */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-400/20 text-[10px] font-black text-sky-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {activeCompanion === "aura" ? "Aura (Linh Hồn)" : activeCompanion === "spark" ? "Spark (Rồng Lửa)" : "Shadow (Bóng Tối)"}
            </div>

            {/* Prompt Text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentNode}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] md:text-[14px] font-bold text-zinc-200 leading-relaxed min-h-[48px]"
              >
                {nodeData?.prompt}
              </motion.p>
            </AnimatePresence>

            {/* Choices Options */}
            <div className="pt-2">
              {nodeData?.choices ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {nodeData.choices.map((choice) => (
                    <motion.button
                      key={choice.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice)}
                      className="w-full px-4 py-3 text-left rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-sky-500/10 hover:border-sky-500/30 text-[11px] md:text-[12px] font-bold text-zinc-300 hover:text-white transition-all shadow-sm flex items-center justify-between"
                    >
                      <span>{choice.label}</span>
                      <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
                    </motion.button>
                  ))}
                </div>
              ) : nodeData?.isEnd ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNextChapter}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-[11px] md:text-[12px] font-black uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">celebrate</span>
                  <span>Bước sang Chương kế tiếp</span>
                </motion.button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Journey Chronicle Log */}
      <div className="w-full md:w-72 shrink-0 flex flex-col min-h-0 bg-white/[0.02] border border-white/[0.04] rounded-3xl overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
          <span className="material-symbols-outlined text-[18px] text-indigo-400">history_edu</span>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
            Biên Niên Sử Hành Trình
          </h3>
        </div>

        {/* Choice history list */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {choiceHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <span className="material-symbols-outlined text-[32px] opacity-40">menu_book</span>
              <p className="text-[10px] font-semibold leading-relaxed">
                Những quyết định của cậu trong cốt truyện sẽ được lưu giữ tại đây...
              </p>
            </div>
          ) : (
            choiceHistory.map((log, idx) => (
              <div key={idx} className="relative pl-4 border-l border-indigo-500/20 space-y-1">
                {/* Visual marker dot */}
                <span className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                <div className="flex justify-between items-center text-[9px] font-black text-indigo-400 tracking-wider">
                  <span>CHƯƠNG {log.chapter}</span>
                  <span className="opacity-50">
                    {new Date(log.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-[11px] font-extrabold text-zinc-200 leading-snug">
                  {log.label}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
