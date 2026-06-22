import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ClinicalTestPanel({ activeTest, onTestComplete, onCancel }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [testAnswers, setTestAnswers] = useState([]);

  const handleAnswerClick = (val) => {
    const nextAnswers = [...testAnswers, val];
    setTestAnswers(nextAnswers);

    if (currentQuestionIdx + 1 < activeTest.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Test finished! Calculate results
      const testId = activeTest.id;
      const score = nextAnswers.reduce((a, b) => a + b, 0);
      onTestComplete(testId, score, nextAnswers);
    }
  };

  const handlePrevClick = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setTestAnswers((prev) => prev.slice(0, -1));
    }
  };

  const percentProgress = ((currentQuestionIdx) / activeTest.questions.length) * 100;

  return (
    <div className="space-y-5 pt-4 px-4 max-w-md mx-auto h-full animate-scaleUp overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 pb-4">
      <div className="text-center space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            {currentQuestionIdx > 0 && (
              <button
                type="button"
                onClick={handlePrevClick}
                className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-550 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Câu trước
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[9px] font-black uppercase text-red-500 hover:underline"
          >
            Hủy test
          </button>
        </div>
        
        <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
          {activeTest.name}
        </h4>
        
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#0071e3] h-full transition-all duration-300"
            style={{ width: `${percentProgress}%` }}
          />
        </div>
        
        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Câu hỏi {currentQuestionIdx + 1} / {activeTest.questions.length}
        </p>
      </div>

      {/* Question bubble with smooth exit/entry animation */}
      <div className="overflow-hidden min-h-[75px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full relative p-4 rounded-lg border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-[#1a1924] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] text-zinc-800 dark:text-zinc-100 font-bold text-xs text-center leading-relaxed"
          >
            "{activeTest.questions[currentQuestionIdx]}"
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Multiple choice selections */}
      <div className="flex flex-col gap-2 pt-1">
        {activeTest.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleAnswerClick(opt.value)}
            className="w-full py-2 px-3.5 rounded-md border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-black text-zinc-800 dark:text-zinc-250 uppercase tracking-wider text-left hover:bg-zinc-50 dark:hover:bg-zinc-850 active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] flex items-center justify-between"
          >
            <span>{opt.label}</span>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[8px]">{opt.value} điểm</span>
          </button>
        ))}
      </div>
    </div>
  );
}
