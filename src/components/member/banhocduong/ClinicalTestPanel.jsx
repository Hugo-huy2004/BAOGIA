import React, { useState } from "react";

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

  const percentProgress = ((currentQuestionIdx) / activeTest.questions.length) * 100;

  return (
    <div className="space-y-6 pt-4 max-w-md mx-auto animate-scaleUp">
      <div className="text-center space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-zinc-900/10 border border-zinc-900/20 text-zinc-800 dark:bg-white/10 dark:text-white dark:border-white/20 uppercase">
            Đang Đánh Giá Độc Quyền
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="text-[9px] font-black uppercase text-red-500 hover:underline"
          >
            Hủy test
          </button>
        </div>
        <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-150 uppercase tracking-wider">
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

      {/* Question bubble */}
      <div className="relative p-4 rounded-2xl border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-[#1a1924] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] text-zinc-800 dark:text-zinc-100 font-bold text-xs text-center leading-relaxed">
        "{activeTest.questions[currentQuestionIdx]}"
      </div>

      {/* Multiple choice selections */}
      <div className="flex flex-col gap-2 pt-2">
        {activeTest.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleAnswerClick(opt.value)}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10.5px] font-black text-zinc-800 dark:text-zinc-250 uppercase tracking-wider text-left hover:bg-zinc-50 dark:hover:bg-zinc-850 active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] flex items-center justify-between"
          >
            <span>{opt.label}</span>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[8.5px]">{opt.value} điểm</span>
          </button>
        ))}
      </div>
    </div>
  );
}
