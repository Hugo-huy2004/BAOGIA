import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Sparkles, CheckCircle2, Circle, AlertCircle, 
  FileText, CheckSquare, Edit3, Heart, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAiUrl } from "../../../services/api";

const AI_BASE = getAiUrl();
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";

export default function DepressionCbtTherapy({ onBack, onCompleteActivity, showToast, bio, historyLogs, chatMessages }) {
  const [step, setStep] = useState("intro"); // 'intro' | 'loading' | 'worksheet' | 'custom_input'
  const [worksheet, setWorksheet] = useState(null);
  
  // Custom user inputs to override AI sheet
  const [customBalancedThought, setCustomBalancedThought] = useState("");
  const [actionStepChecked, setActionStepChecked] = useState(false);
  const [userAnxietyRating, setUserAnxietyRating] = useState(50); // 0-100 re-rating
  const [showReRating, setShowReRating] = useState(false);

  // Fallback context if user wants to analyze a custom situation
  const [customSituation, setCustomSituation] = useState("");

  const handleGenerateWorksheet = async (useCustom = false) => {
    setStep("loading");
    try {
      const payload = {
        historyLogs: useCustom ? [{ type: 'custom_trigger', text: customSituation }] : (historyLogs || []),
        chatMessages: useCustom ? [] : (chatMessages || []),
        bio: bio
      };

      const r = await fetch(`${AI_BASE}/api/ai/therapy/cbt-worksheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!r.ok) throw new Error("Không thể kết nối đến máy chủ AI.");
      const data = await r.json();

      if (data.error) throw new Error(data.error);

      setWorksheet(data);
      setCustomBalancedThought(data.balanced_thought || "");
      setStep("worksheet");
      setActionStepChecked(false);
      setShowReRating(false);
    } catch {
      showToast?.(e.message || "Lỗi tạo bảng CBT.", "error");
      setStep("intro");
    }
  };

  const handleCompleteCbt = () => {
    onCompleteActivity?.(
      "Bảng tự nhận thức CBT",
      `Đã hoàn thành bảng suy nghĩ CBT. Tình huống: "${worksheet?.situation?.substring(0, 30)}...". Đánh giá lại lo âu: ${userAnxietyRating}/100.`
    );
    showToast?.("Tuyệt vời! Cậu vừa hoàn thành thực hành tái cấu trúc suy nghĩ CBT. Hãy giữ vững sự tích cực nhé!", "success");
    onBack();
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 text-left animate-scaleUp bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <button type="button" onClick={onBack} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:text-zinc-200 transition-colors">
          Quay lại thẻ
        </button>
        <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">CBT Worksheet & Lộ Trình</span>
      </div>

      {step === "intro" && (
        <div className="space-y-4 relative z-10">
          <p className="text-[11px] text-zinc-300 font-bold leading-relaxed">
            Liệu pháp Nhận thức - Hành vi (CBT) là phương pháp chuẩn mực giúp cậu nhận diện "biến dạng nhận thức" (Overthinking, Thảm họa hóa, Trắng đen) và tái cấu trúc nó thành suy nghĩ tích cực thực tế.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box A: Automated AI generation */}
            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-3xl space-y-3 flex flex-col justify-between">
              <div>
                <h5 className="text-[11px] font-black text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  Tự động phân tích AI
                </h5>
                <p className="text-[9.5px] text-zinc-400 leading-relaxed font-bold mt-1">
                  AI sẽ đọc lịch sử trò chuyện hôm nay và các check-in tâm sự để tìm ra tình huống căng thẳng thực tế của cậu để bắt đầu phân tích.
                </p>
              </div>
              <button
                onClick={() => handleGenerateWorksheet(false)}
                className="w-full py-2.5 bg-red-650 hover:bg-red-650/80 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 border border-red-500/20"
              >
                Phân tích & Tải bảng CBT
              </button>
            </div>

            {/* Box B: Custom user input */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-zinc-300" />
                  Nhập tình huống riêng
                </h5>
                <p className="text-[9.5px] text-zinc-400 leading-relaxed font-bold">
                  Nếu cậu có một sự việc cụ thể xảy ra trong ngày muốn giải quyết ngay, hãy điền ngắn gọn vào đây.
                </p>
                <input
                  type="text"
                  placeholder="Ví dụ: Tớ bị điểm kém bài kiểm tra toán..."
                  value={customSituation}
                  onChange={e => setCustomSituation(e.target.value)}
                  className="w-full p-2.5 border border-white/10 bg-white/5 text-xs rounded-xl outline-none focus:ring-1 ring-red-400 text-white placeholder-zinc-550"
                />
              </div>
              <button
                onClick={() => handleGenerateWorksheet(true)}
                disabled={!customSituation.trim()}
                className="w-full py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 active:scale-95 flex items-center justify-center gap-1.5"
              >
                Soạn bảng CBT riêng
              </button>
            </div>

          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="py-20 text-center space-y-4 bg-white/5 border border-white/10 rounded-3xl relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
            <FileText className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-black text-zinc-200">Đang lập bảng nhận thức CBT riêng...</p>
            <p className="text-[9.5px] text-zinc-450 mt-1">AI đang bóc tách biến dạng nhận thức để tái tạo suy nghĩ...</p>
          </div>
        </div>
      )}

      {step === "worksheet" && worksheet && (
        <div className="space-y-4 relative z-10">
          
          {/* CBT Clinical Sheet Visual representation */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-md space-y-4 font-sans text-xs">
            
            {/* Sheet Title */}
            <div className="flex items-center justify-between border-b pb-2 border-white/5">
              <span className="text-[9px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-red-400" />
                CBT Thought Record
              </span>
              <span className="text-[8px] font-mono text-zinc-500">Date: {new Date().toLocaleDateString("vi-VN")}</span>
            </div>

            {/* Row 1: Situation */}
            <div className="space-y-1">
              <span className="text-[9.5px] font-black uppercase text-zinc-400">1. Tình huống thực tế (Situation)</span>
              <p className="p-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-zinc-200 leading-relaxed">
                {worksheet.situation}
              </p>
            </div>

            {/* Row 2: Automatic Negative Thought */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black uppercase text-rose-450">2. Suy nghĩ tự động tiêu cực</span>
                <p className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl font-bold text-rose-350 leading-relaxed min-h-[70px]">
                  "{worksheet.automatic_thought}"
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9.5px] font-black uppercase text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 animate-bounce" />
                  3. Biến dạng nhận thức
                </span>
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1 min-h-[70px]">
                  <p className="font-black text-amber-400">{worksheet.distortion}</p>
                  <p className="text-[8.5px] text-zinc-400 font-bold leading-normal">
                    Lỗ hổng nhận thức khiến não bộ tự phóng đại hoặc méo mó sự thật.
                  </p>
                </div>
              </div>
            </div>

            {/* Row 3: Evidence check */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black uppercase text-zinc-400">Bằng chứng ủng hộ suy nghĩ đó</span>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl font-semibold text-zinc-350 min-h-[60px]">
                  {worksheet.evidence_for || "Không có bằng chứng thực tế khách quan nào ngoài cảm xúc suy diễn tự thân."}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9.5px] font-black uppercase text-emerald-450">Bằng chứng phản biện khách quan</span>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl font-semibold text-emerald-300 min-h-[60px]">
                  {worksheet.evidence_against || "Cậu đang nhìn sự việc qua bộ lọc tiêu cực, có rất nhiều góc nhìn khách quan tích cực hơn."}
                </div>
              </div>
            </div>

            {/* Row 4: Rational/Balanced Thought override input */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[9.5px] font-black uppercase text-emerald-450 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-450" />
                4. Suy nghĩ cân bằng & Thực tế (Rational Response)
              </span>
              <textarea
                value={customBalancedThought}
                onChange={e => setCustomBalancedThought(e.target.value)}
                placeholder="Hãy viết lại suy nghĩ cân bằng của riêng cậu tại đây..."
                className="w-full h-20 p-3 border border-white/10 bg-emerald-500/5 text-xs rounded-xl outline-none focus:ring-2 ring-emerald-450/50 transition-all font-bold text-emerald-300"
              />
            </div>

            {/* Row 5: AI Action Step */}
            {worksheet.action_step && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[9.5px] font-black uppercase text-indigo-400 block mb-2">5. Hành động nhỏ kích hoạt hormone hạnh phúc</span>
                <button
                  type="button"
                  onClick={() => setActionStepChecked(v => !v)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    actionStepChecked 
                      ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-300" 
                      : "bg-white/5 border-white/10 text-zinc-300"
                  }`}
                >
                  {actionStepChecked ? <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">Hành động được khuyên làm:</p>
                    <p className="text-[11px] font-black leading-snug mt-0.5">{worksheet.action_step}</p>
                  </div>
                </button>
              </div>
            )}

          </div>

          {/* Controls */}
          <div className="space-y-3">
            {showReRating ? (
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  <span>Mức độ Lo âu / Buồn phiền sau khi tái cấu trúc:</span>
                  <span className="text-red-400 font-mono text-xs">{userAnxietyRating}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userAnxietyRating}
                  onChange={e => setUserAnxietyRating(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <button
                  onClick={handleCompleteCbt}
                  className="w-full py-3 bg-red-650 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border border-red-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Hoàn tất và Lưu bảng nhận thức
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowReRating(true)}
                className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Tiếp tục (Đánh giá lại cảm xúc)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setStep("intro")}
              className="w-full py-2 border border-white/10 text-zinc-400 hover:bg-white/5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all text-center block"
            >
              Hủy bỏ kịch bản này
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
