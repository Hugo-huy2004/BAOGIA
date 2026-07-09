import React from "react";
import { motion } from "framer-motion";
import { generatePersonalizedStory } from "../../../utils/aiStoryGenerator";
import RiveCompanion from "../banhocduong/components/RiveCompanion";
import { useNavigate } from "react-router-dom";

export default function PersonalizedStoryDeck({ bio, showToast }) {
  const navigate = useNavigate();
  const story = generatePersonalizedStory(bio);

  const handleCtaClick = () => {
    if (story.targetTab === "verify") {
      navigate("/member/verify");
    } else if (story.targetTab === "utilities") {
      if (story.targetSubTab === "psychology") {
        navigate(`/member/utilities/psychology/${story.targetPsychTab}`);
      } else {
        navigate(`/member/utilities/${story.targetSubTab}`);
      }
    }
    showToast?.("Hành trình của cậu đang chuyển tiếp...", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 sm:mx-0 p-4 md:p-5 rounded-3xl relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-[#12131f]/80 to-slate-950/80 border border-white/[0.06] dark:border-white/[0.03] backdrop-blur-2xl shadow-xl z-20 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 will-change-transform"
    >
      {/* Floating abstract decorative gradient blobs inside the card */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-[40px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

      {/* Companion Section (Left side in desktop, top in mobile) */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center relative bg-black/35 rounded-2xl border border-white/[0.05] shadow-inner overflow-hidden">
        <RiveCompanion
          companion={story.companion}
          state="idle"
          className="w-20 h-20 sm:w-24 sm:h-24"
        />
        {/* Soft dynamic ring backdrop */}
        <div className="absolute inset-0 border border-sky-400/20 rounded-2xl animate-pulse" />
      </div>

      {/* Narrative Section (Right/Content side) */}
      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center sm:justify-start">
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-[8.5px] font-black text-indigo-400 uppercase tracking-widest self-center sm:self-start shadow-sm">
            AI Story Deck
          </span>
          <h3 className="text-[12px] md:text-[13px] font-extrabold text-sky-400 tracking-wide uppercase truncate">
            {story.chapterTitle}
          </h3>
        </div>
        
        <p className="text-[11px] md:text-[11.5px] font-medium text-zinc-300 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto sm:mx-0">
          {story.narrative}
        </p>

        <div className="pt-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCtaClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[13px]">explore</span>
            <span>{story.ctaLabel}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
