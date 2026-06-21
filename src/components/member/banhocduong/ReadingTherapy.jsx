import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, BookOpen, Sparkles, Volume2, VolumeX, Play, 
  Pause, Square, Headphones, RefreshCw, Book, Smile, Moon, Eye,
  AlertCircle, Frown, HeartCrack, BatteryLow, CloudRain, Waves, Flame, Music, Timer
} from "lucide-react";
import { getAiUrl } from "../../../services/api";

const AI_BASE = getAiUrl();
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";

const MOODS = [
  { id: "căng thẳng", label: "Căng thẳng", icon: AlertCircle },
  { id: "lo âu", label: "Lo âu", icon: Frown },
  { id: "buồn bã", label: "Buồn bã", icon: Frown },
  { id: "cô đơn", label: "Cô đơn", icon: HeartCrack },
  { id: "mệt mỏi", label: "Mệt mỏi", icon: BatteryLow },
  { id: "bình thường", label: "Bình yên", icon: Smile }
];

export default function ReadingTherapy({ onBack, onCompleteActivity, showToast, bio }) {
  const [step, setStep] = useState("setup"); // 'setup' | 'loading' | 'reading'
  const [therapyType, setTherapyType] = useState("story"); // 'story' | 'dream'
  const [selectedMood, setSelectedMood] = useState("lo âu");
  const [customContext, setCustomContext] = useState("");
  const [aiStory, setAiStory] = useState(null); // { title: '', story: '' }
  const [paragraphs, setParagraphs] = useState([]);
  
  // Reading tracking
  const [readingSeconds, setReadingSeconds] = useState(0);
  const readingTimerRef = useRef(null);

  // Narration (TTS)
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const [currentParaIdx, setCurrentParaIdx] = useState(-1);
  const [narrationSpeed, setNarrationSpeed] = useState(0.8);
  const [voices, setVoices] = useState([]);

  // Background Ambience Audio
  const [playingSounds, setPlayingSounds] = useState({
    rain: false,
    ocean: false,
    campfire: false,
    zen: false
  });
  const [volumes, setVolumes] = useState({
    rain: 0.3,
    ocean: 0.3,
    campfire: 0.3,
    zen: 0.3
  });
  const audiosRef = useRef({
    rain: new Audio("/audio/rain.mp3"),
    ocean: new Audio("/audio/sea.mp3"),
    campfire: new Audio("/audio/campfire.mp3"),
    zen: new Audio("/audio/ambient.mp3")
  });

  // Audio setup
  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].loop = true;
    });
    return () => {
      Object.keys(audiosRef.current).forEach(key => {
        audiosRef.current[key].pause();
      });
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].volume = volumes[key];
    });
  }, [volumes]);

  // Voice setup
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const getBestViVoice = () => {
    const viVoices = voices.filter(v => v.lang.startsWith("vi") || v.lang.includes("vi-VN"));
    if (viVoices.length === 0) return null;

    // Prioritize voices containing "nam" (male) or "male" or "Voice 2" (typically male Siri)
    const maleVoice = viVoices.find(v => 
      v.name.toLowerCase().includes("nam") || 
      v.name.toLowerCase().includes("male") ||
      v.name.includes("Voice 2")
    );
    if (maleVoice) return maleVoice;

    // Fallback to premium voices
    const premiumVoice = viVoices.find(v => v.name.includes("Siri") || v.name.includes("Premium") || v.name.includes("Natural"));
    if (premiumVoice) return premiumVoice;

    // Fallback to Google translator
    const googleVoice = viVoices.find(v => v.name.includes("Google"));
    if (googleVoice) return googleVoice;

    return viVoices[0];
  };

  const toggleSound = (key) => {
    const audio = audiosRef.current[key];
    if (playingSounds[key]) {
      audio.pause();
      setPlayingSounds(p => ({ ...p, [key]: false }));
    } else {
      audio.play().catch(e => console.error("Audio play failed:", e));
      setPlayingSounds(p => ({ ...p, [key]: true }));
    }
  };

  // Generate AI Story / Dream Decoding
  const handleGenerate = async () => {
    setStep("loading");
    try {
      const payload = {
        mood: therapyType === "story" ? selectedMood : "dream",
        context: customContext,
        bio: bio
      };
      
      const r = await fetch(`${AI_BASE}/api/ai/therapy/story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_KEY
        },
        body: JSON.stringify(payload)
      });
      
      if (!r.ok) throw new Error("Không thể kết nối đến máy chủ AI.");
      const data = await r.json();
      setAiStory(data);
      
      // Parse story text into paragraphs
      const parsedParas = data.story
        .split("\n")
        .map(p => p.trim())
        .filter(p => p.length > 0);
      setParagraphs(parsedParas);
      
      setStep("reading");
      
      // Start session tracking timer
      setReadingSeconds(0);
      readingTimerRef.current = setInterval(() => {
        setReadingSeconds(s => s + 1);
      }, 1000);
      
    } catch (e) {
      showToast?.(e.message || "Lỗi tạo truyện trị liệu.", "error");
      setStep("setup");
    }
  };

  // Speak a specific paragraph index
  const speakParagraph = (idx) => {
    if (typeof window === "undefined" || !window.speechSynthesis || idx >= paragraphs.length) {
      setIsPlayingNarration(false);
      setCurrentParaIdx(-1);
      return;
    }
    window.speechSynthesis.cancel();
    setCurrentParaIdx(idx);
    setIsPlayingNarration(true);

    const utter = new SpeechSynthesisUtterance(paragraphs[idx]);
    utter.lang = "vi-VN";
    utter.rate = narrationSpeed;
    utter.pitch = 0.9; // Deeper, warmer storytelling voice
    utter.voice = getBestViVoice();
    
    utter.onend = () => {
      // automatically advance to next paragraph
      speakParagraph(idx + 1);
    };

    utter.onerror = (e) => {
      console.error("TTS error:", e);
      setIsPlayingNarration(false);
    };

    window.speechSynthesis.speak(utter);
  };

  const handleToggleNarration = () => {
    if (isPlayingNarration) {
      window.speechSynthesis.cancel();
      setIsPlayingNarration(false);
    } else {
      const nextIdx = currentParaIdx === -1 ? 0 : currentParaIdx;
      speakParagraph(nextIdx);
    }
  };

  const stopNarration = () => {
    window.speechSynthesis.cancel();
    setIsPlayingNarration(false);
    setCurrentParaIdx(-1);
  };

  const handleFinishSession = () => {
    // stop audio
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].pause();
    });
    stopNarration();
    if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    
    // Complete activity log
    const m = Math.floor(readingSeconds / 60);
    onCompleteActivity?.(
      therapyType === "story" ? "Truyện Trị Liệu AI" : "Giải Mã Giấc Mơ AI",
      `Đã đọc/nghe tác phẩm: "${aiStory?.title}" trong vòng ${m > 0 ? `${m} phút` : `${readingSeconds} giây`}`
    );
    showToast?.("Chúc mừng cậu đã có những giây phút thư giãn bên những trang viết ý nghĩa!", "success");
    onBack();
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-scaleUp bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <button type="button" onClick={() => { stopNarration(); onBack(); }} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:text-zinc-200 transition-colors">
          Quay lại thẻ
        </button>
        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Trị liệu Đọc & Nghe</span>
      </div>

      {step === "setup" && (
        <div className="space-y-5 text-left relative z-10">
          <p className="text-[11px] text-zinc-300 font-bold leading-relaxed">
            Chọn hình thức trị liệu tinh thần qua ngôn từ. AI sẽ biên dịch tâm trạng thực hoặc điềm báo giấc mơ của cậu thành một văn bản chữa lành cá nhân hóa.
          </p>

          {/* Type Toggle */}
          <div className="flex bg-black/40 rounded-xl p-1 shadow-inner border border-white/5">
            <button
              onClick={() => setTherapyType("story")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                therapyType === "story"
                  ? "bg-white/10 text-white shadow-md border border-white/5"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Book className="w-4 h-4 text-indigo-400" />
              Truyện trị liệu
            </button>
            <button
              onClick={() => setTherapyType("dream")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                therapyType === "dream"
                  ? "bg-white/10 text-white shadow-md border border-white/5"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Moon className="w-4 h-4 text-purple-400" />
              Giải mã giấc mơ
            </button>
          </div>

          {/* Setup parameters */}
          <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-3xl">
            {therapyType === "story" ? (
              <div className="space-y-3">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400">Cậu cảm thấy thế nào hôm nay?</label>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.id)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        selectedMood === m.id
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 scale-[1.02]"
                          : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {React.createElement(m.icon, { className: "w-3.5 h-3.5 text-indigo-400 shrink-0" })}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400">Kể thêm cho AI nghe điều đang xảy ra (tùy chọn)</label>
                  <textarea
                    placeholder="Ví dụ: Tớ vừa trải qua một kỳ thi căng thẳng, tớ có chút mệt mỏi với các mối quan hệ..."
                    value={customContext}
                    onChange={e => setCustomContext(e.target.value)}
                    className="w-full h-24 p-3 border border-white/10 bg-white/5 text-xs rounded-xl outline-none focus:ring-2 ring-indigo-400/50 transition-all font-medium text-white placeholder-zinc-550"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400">Ghi lại giấc mơ chi tiết của cậu</label>
                  <textarea
                    placeholder="Ví dụ: Tớ mơ thấy mình đang bay giữa những đám mây ngũ sắc nhưng rồi đột ngột rơi xuống mặt nước yên tĩnh..."
                    value={customContext}
                    onChange={e => setCustomContext(e.target.value)}
                    className="w-full h-36 p-3 border border-white/10 bg-white/5 text-xs rounded-xl outline-none focus:ring-2 ring-indigo-400/50 transition-all font-medium text-white placeholder-zinc-550"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border border-indigo-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Bắt đầu tạo tác phẩm AI
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="py-20 text-center space-y-4 relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <BookOpen className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-black text-zinc-250">Hugo Studio AI đang sáng tác...</p>
            <p className="text-[9.5px] text-zinc-450 mt-1">Quá trình này có thể mất từ 10 - 20 giây để trau chuốt câu từ.</p>
          </div>
        </div>
      )}

      {step === "reading" && aiStory && (
        <div className="space-y-5 text-left relative z-10">
          {/* Reader Canvas */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg relative min-h-[400px]">
            {/* Title & Reading Time */}
            <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {therapyType === "story" ? "Truyện trị liệu" : "Giải mã điềm báo"}
                </span>
                <h2 className="text-[16px] font-black text-zinc-100 font-serif leading-tight mt-1">{aiStory.title}</h2>
              </div>
              <span className="text-[9px] font-mono font-black text-zinc-400 flex items-center gap-1 shrink-0">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                <span>{Math.floor(readingSeconds / 60)}m {readingSeconds % 60}s</span>
              </span>
            </div>

            {/* Paragraph view */}
            <div className="space-y-4 font-serif text-[12px] text-zinc-300 leading-relaxed font-medium">
              {paragraphs.map((para, idx) => (
                <p 
                  key={idx} 
                  onClick={() => speakParagraph(idx)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    currentParaIdx === idx 
                      ? "bg-indigo-500/10 text-white border-l-4 border-indigo-500 pl-3 font-semibold shadow-sm"
                      : "hover:bg-white/5"
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Audio Console Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Column A: Narration Console */}
            <div className="md:col-span-6 bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Giọng đọc kể chuyện AI</span>
                {isPlayingNarration && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleNarration}
                  className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all animate-none"
                >
                  {isPlayingNarration ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
                </button>
                <button
                  onClick={stopNarration}
                  className="w-10 h-10 rounded-full border border-white/10 text-zinc-300 bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-zinc-200 truncate">
                    {currentParaIdx === -1 ? "Sẵn sàng phát đọc thoại..." : `Đang đọc đoạn ${currentParaIdx + 1}/${paragraphs.length}`}
                  </p>
                  <p className="text-[8px] text-zinc-400">Nhấp chọn đoạn văn bất kỳ để đọc từ đó</p>
                </div>
              </div>

              {/* Speed slider */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <span className="text-[8.5px] font-black text-zinc-400 uppercase w-14 shrink-0">Tốc độ:</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.2"
                  step="0.05"
                  value={narrationSpeed}
                  onChange={e => {
                    setNarrationSpeed(parseFloat(e.target.value));
                    if (isPlayingNarration) speakParagraph(currentParaIdx);
                  }}
                  className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[9px] font-mono font-bold text-zinc-400">{narrationSpeed}x</span>
              </div>
            </div>

            {/* Column B: Background Ambience Audio Mixer */}
            <div className="md:col-span-6 bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Âm thanh thiên nhiên nền</span>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "rain", label: "Mưa rơi", icon: CloudRain },
                  { key: "ocean", label: "Sóng vỗ", icon: Waves },
                  { key: "campfire", label: "Lửa trại", icon: Flame },
                  { key: "zen", label: "Nhạc Thiền", icon: Music }
                ].map(sound => (
                  <div key={sound.key} className="flex flex-col gap-1 p-2 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-350 flex items-center gap-1.5">
                        {React.createElement(sound.icon, { className: "w-3.5 h-3.5 text-indigo-400 shrink-0" })}
                        <span>{sound.label}</span>
                      </span>
                      <button
                        onClick={() => toggleSound(sound.key)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          playingSounds[sound.key]
                            ? "bg-indigo-500 text-white"
                            : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        {playingSounds[sound.key] ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    {playingSounds[sound.key] && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volumes[sound.key]}
                        onChange={e => setVolumes(v => ({ ...v, [sound.key]: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleFinishSession}
            className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 text-center block border border-white/20"
          >
            Hoàn thành đọc & Đóng thẻ
          </button>
        </div>
      )}

    </div>
  );
}
