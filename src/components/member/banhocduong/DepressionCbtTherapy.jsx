import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";

export default function DepressionCbtTherapy({ onBack, onCompleteActivity, showToast }) {
  const [journalText, setJournalText] = useState("");
  const [journalStatus, setJournalStatus] = useState("");
  const [cbtChecklist, setCbtChecklist] = useState([
    { id: 1, text: "Uống một cốc nước ấm lớn để thanh lọc cơ thể", checked: false },
    { id: 2, text: "Đứng dậy vươn vai thả lỏng vai gáy trong 2 phút", checked: false },
    { id: 3, text: "Tự ôm hai vai của mình và mỉm cười nói 'Cậu đã cố gắng rất nhiều'", checked: false },
    { id: 4, text: "Nhìn ra ngoài cửa sổ tìm 3 đồ vật có màu xanh lá cây", checked: false }
  ]);

  // Session Timer state (10 minutes minimum)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(600);
  const [targetDuration, setTargetDuration] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(timerIntervalRef.current);
            if (onCompleteActivity) {
              onCompleteActivity(
                "Trị liệu trầm cảm CBT",
                `Hoàn thành phiên trị liệu CBT thời lượng ${Math.round(targetDuration / 60)} phút.`
              );
            }
            if (showToast) {
              showToast("Chúc mừng cậu đã hoàn tất thời gian trị liệu trầm cảm CBT! Cậu rất kiên cường, tớ tin cậu sẽ tốt lên từng ngày! 🌟❤️", "success");
            }
            return targetDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, targetDuration, onCompleteActivity, showToast]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(targetDuration);
  };

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (!journalText.trim()) return;

    onCompleteActivity("Nhật ký CBT Tích cực", `Đã lưu 3 điều tích cực hôm nay: "${journalText.substring(0, 40)}..."`);
    setJournalText("");
    setJournalStatus("Đã gửi thành công! Cảm xúc tích cực này đã được lưu vào dòng lịch sử.");
    setTimeout(() => setJournalStatus(""), 4000);
  };

  const handleChecklistChange = (id) => {
    const updated = cbtChecklist.map(item => {
      if (item.id === id) return { ...item, checked: !item.checked };
      return item;
    });
    setCbtChecklist(updated);

    const allChecked = updated.every(item => item.checked);
    if (allChecked) {
      onCompleteActivity("Tự yêu thương bản thân", "Hoàn thành toàn bộ checklist tự nạp năng lượng tinh thần.");
      setTimeout(() => {
        setCbtChecklist(updated.map(item => ({ ...item, checked: false })));
        if (showToast) {
          showToast("Tuyệt vời! Cậu vừa hoàn thành checklist tự chăm sóc cơ thể để đẩy lùi trầm uất. Chúc cậu luôn bình an!", "success");
        }
      }, 800);
    }
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-5 text-left max-w-xl mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-red-500">Trị liệu Trầm cảm (CBT)</span>
      </div>

      {/* CBT Active Session Timer Card */}
      <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-500/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h6 className="text-[10px] font-black uppercase tracking-wider text-red-500">Phiên trị liệu trầm uất (CBT)</h6>
          <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
            Dành ít nhất 10 phút ngồi tĩnh lặng suy ngẫm, viết nhật ký tích cực hoặc kích hoạt hành động để nạp lại năng lượng.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xl font-mono font-black text-red-500 w-16 text-center">
            {formatTimerTime(timerSecondsLeft)}
          </div>
          <button
            type="button"
            onClick={toggleTimer}
            className="w-8 h-8 rounded-full border border-red-500/20 bg-white dark:bg-zinc-900 flex items-center justify-center text-red-500 shadow-sm active:scale-90 transition-transform"
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 pl-0.5" />}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-500 shadow-sm active:scale-90 transition-transform"
          >
            <Square className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
        {/* Left Column: Journaling */}
        <div className="md:col-span-6 space-y-3">
          <h5 className="text-[10.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            1. Nhật ký 3 điều tích cực (CBT)
          </h5>
          <p className="text-[9.5px] text-zinc-500 dark:text-zinc-455 leading-relaxed font-semibold">
            Viết ra ít nhất 3 khoảnh khắc tốt lành hoặc điều nhỏ bé khiến cậu mỉm cười hôm nay để định hướng lại trường nhận thức tiêu cực.
          </p>
          
          <form onSubmit={handleJournalSubmit} className="space-y-2.5">
            <textarea
              placeholder="Ví dụ: Ăn một bữa trưa ngon, hôm nay thời tiết mát mẻ, làm được một bài tập khó..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="w-full h-32 px-3 py-2.5 rounded-md border border-zinc-250 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
            />
            <button
              type="submit"
              disabled={!journalText.trim()}
              className="w-full py-2 bg-red-500 hover:bg-red-650 text-white text-[10px] font-black uppercase tracking-wider rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              Lưu vào Lịch sử
            </button>
          </form>
          {journalStatus && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-wider text-center">
              {journalStatus}
            </div>
          )}
        </div>

        {/* Right Column: Behavioral checklist */}
        <div className="md:col-span-6 space-y-3 border-t md:border-t-0 md:border-l border-zinc-200/50 dark:border-zinc-850 pl-0 md:pl-5 pt-3 md:pt-0">
          <h5 className="text-[10.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            2. Kích hoạt hành vi
          </h5>
          <p className="text-[9.5px] text-zinc-500 dark:text-zinc-455 leading-relaxed font-semibold">
            Khi trầm uất, việc vận động nhỏ sẽ kích hoạt lại hormone hưng phấn (Dopamine). Hãy hoàn tất checklist tự yêu thương bản thân dưới đây:
          </p>

          <div className="space-y-2 pt-1">
            {cbtChecklist.map(item => (
              <label
                key={item.id}
                className={`flex items-start gap-2.5 p-2 rounded-md border transition-all cursor-pointer select-none text-[10px] font-bold ${
                  item.checked
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-white dark:bg-zinc-955 border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleChecklistChange(item.id)}
                  className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>{item.text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
