import React, { useState, useEffect } from "react";
import { Sparkles, Save, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

export default function CbtThoughtWorksheet({ chatHistory = [], onSaveWorksheet, showToast }) {
  const [situation, setSituation] = useState("");
  const [autoThought, setAutoThought] = useState("");
  const [emotions, setEmotions] = useState("");
  const [intensity, setIntensity] = useState(80);
  const [rationalResponse, setRationalResponse] = useState("");
  const [newIntensity, setNewIntensity] = useState(30);
  const [outcome, setOutcome] = useState("");

  const [hasScanned, setHasScanned] = useState(false);

  // Scan recent chat logs to auto-fill draft
  const scanChatForCbtDraft = () => {
    if (!chatHistory || chatHistory.length === 0) return;
    
    // Find the latest user message
    const userMsgs = chatHistory.filter(m => m.sender === "user" || m.role === "user");
    if (userMsgs.length === 0) return;

    const latestMsg = userMsgs[userMsgs.length - 1].text || "";
    const cleanText = latestMsg.toLowerCase();

    // Mapping patterns to pre-filled CBT templates
    const templates = [
      {
        keywords: /(thi dai hoc|on thi|thi cu|thi thpt|thptqg|diem so|hoc tap|hoc hanh)/,
        situation: "Chuẩn bị thi cử hoặc nhận kết quả học tập",
        thought: "Mình sẽ thi rớt, không đạt điểm mong muốn và làm gia đình thất vọng.",
        emotions: "Lo lắng, căng thẳng, bất an"
      },
      {
        keywords: /(chia tay|that tinh|nguoi yeu|bi bo|crush)/,
        situation: "Gặp khó khăn/rạn nứt trong mối quan hệ tình cảm",
        thought: "Không ai thực sự yêu thương mình, mình sẽ mãi cô đơn.",
        emotions: "Đau lòng, buồn bã, trống rỗng"
      },
      {
        keywords: /(cai nhau|bo me|gia dinh|ap dat|cai bo me)/,
        situation: "Mâu thuẫn hoặc tranh cãi với người thân trong gia đình",
        thought: "Bố mẹ không bao giờ hiểu hay tôn trọng ý kiến của mình.",
        emotions: "Tức giận, bất lực, cô độc"
      },
      {
        keywords: /(ban be|xa lanh|bat nat|bi co lap|drama)/,
        situation: "Gặp xung đột hoặc cảm giác bị cô lập trong nhóm bạn",
        thought: "Mọi người đều ghét mình và mình không thuộc về nơi này.",
        emotions: "Tổn thương, tự ti, lạc lõng"
      },
      {
        keywords: /(kiet suc|burnout|met moi|chan nan|vo dung|kem coi)/,
        situation: "Áp lực quá tải cuộc sống hoặc cảm xúc trống rỗng",
        thought: "Mình vô dụng, làm gì cũng thất bại và không thể cố gắng thêm nữa.",
        emotions: "Kiệt quệ, chán nản, tự ti"
      }
    ];

    let matched = false;
    for (const temp of templates) {
      if (temp.keywords.test(cleanText)) {
        setSituation(temp.situation);
        setAutoThought(temp.thought);
        setEmotions(temp.emotions);
        setIntensity(85);
        matched = true;
        break;
      }
    }

    if (!matched && latestMsg.trim().length > 5) {
      // Generic fallback using user's actual text
      setSituation("Sự kiện diễn ra gần đây");
      setAutoThought(latestMsg.length > 80 ? latestMsg.substring(0, 80) + "..." : latestMsg);
      setEmotions("Lo âu, buồn bã hoặc bất an");
      setIntensity(70);
    }

    setHasScanned(true);
    showToast?.("Đã tự động trích xuất nháp bài tập CBT từ cuộc trò chuyện gần nhất của cậu!", "info");
  };

  useEffect(() => {
    if (!hasScanned && chatHistory && chatHistory.length > 0) {
      scanChatForCbtDraft();
    }
  }, [chatHistory]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!situation.trim() || !autoThought.trim() || !rationalResponse.trim()) {
      showToast?.("Cậu điền đầy đủ các mục để lưu bài tập nhé!", "warning");
      return;
    }

    const worksheetData = {
      date: new Date().toISOString(),
      situation,
      autoThought,
      emotions,
      intensity,
      rationalResponse,
      newIntensity,
      outcome
    };

    onSaveWorksheet?.(worksheetData);
    showToast?.("Bài tập tái cấu trúc nhận thức CBT đã được lưu thành công!", "success");

    // Reset
    setSituation("");
    setAutoThought("");
    setEmotions("");
    setRationalResponse("");
    setOutcome("");
  };

  return (
    <div className="space-y-5 text-left max-w-md mx-auto bg-gradient-to-br from-zinc-950 via-slate-900 to-primary/20 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <span className="text-[10px] font-black uppercase text-warning tracking-wider flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Nhật ký nhận thức CBT
        </span>
        <button
          type="button"
          onClick={scanChatForCbtDraft}
          title="Trích xuất lại từ chat"
          className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition-all"
        >
          <RefreshCw className="w-3 h-3" /> Quét lại chat
        </button>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-2xl p-3.5 relative z-10 flex gap-2">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10.5px] font-black text-warning uppercase tracking-wide">Tái Cấu Trúc Nhận Thức</p>
          <p className="text-[10px] text-zinc-300 font-bold leading-relaxed">
            Kỹ thuật CBT này giúp cậu nhìn nhận lại các suy nghĩ tự động tiêu cực bằng cách đối chiếu với thực tế và tìm kiếm góc nhìn tích cực, khách quan hơn.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 relative z-10">
        {/* Step 1 & 2 */}
        <div className="space-y-3 bg-white/2 border border-white/5 rounded-2xl p-4">
          <h6 className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Bước 1: Trạng thái & Suy nghĩ tự động</h6>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">1. Tình huống thực tế:</label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Ví dụ: Bị điểm kém bài kiểm tra..."
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-warning font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">2. Suy nghĩ tiêu cực tự động nảy lên:</label>
            <textarea
              rows={2}
              value={autoThought}
              onChange={(e) => setAutoThought(e.target.value)}
              placeholder="Ví dụ: Mình là kẻ thất bại, không bao giờ giỏi lên được..."
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-warning font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-400">3. Cảm xúc đi kèm:</label>
              <input
                type="text"
                value={emotions}
                onChange={(e) => setEmotions(e.target.value)}
                placeholder="Ví dụ: Buồn bã, sợ hãi"
                className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-warning font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-400">Mức khó chịu ({intensity}%):</label>
              <input
                type="range"
                min="10"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-warning cursor-pointer h-1.5 bg-zinc-800 rounded-lg mt-3"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Rational Response */}
        <div className="space-y-3 bg-white/2 border border-white/5 rounded-2xl p-4">
          <h6 className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Bước 2: Phản biện & Tái cấu trúc</h6>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">4. Bằng chứng thực tế phản bác suy nghĩ trên:</label>
            <textarea
              rows={3}
              value={rationalResponse}
              onChange={(e) => setRationalResponse(e.target.value)}
              placeholder="Ví dụ: Bài kiểm tra này chỉ là tạm thời, mình vẫn có cơ hội cải thiện. Điểm thấp không định nghĩa năng lực cả đời của mình..."
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-warning font-bold"
            />
          </div>
        </div>

        {/* Step 4: Re-evaluation */}
        <div className="space-y-3 bg-white/2 border border-white/5 rounded-2xl p-4">
          <h6 className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Bước 3: Đánh giá lại kết quả</h6>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-400">Độ tin tưởng suy nghĩ cũ còn ({newIntensity}%):</label>
              <input
                type="range"
                min="0"
                max="100"
                value={newIntensity}
                onChange={(e) => setNewIntensity(Number(e.target.value))}
                className="w-full accent-success cursor-pointer h-1.5 bg-zinc-800 rounded-lg mt-3"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-zinc-400">5. Cảm xúc mới sau bài tập:</label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Ví dụ: Nhẹ nhõm, tự tin hơn"
                className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-warning font-bold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" /> Lưu bài tập nhận thức
        </button>
      </form>
    </div>
  );
}
