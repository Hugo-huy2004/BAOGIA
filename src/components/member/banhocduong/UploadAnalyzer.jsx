import React, { useState, useEffect } from "react";
import psychologyService from "../../../services/classes/PsychologyService";

const SCAN_STEPS = [
  "Đang nhận diện ký tự quang học (OCR)...",
  "Đang định vị bảng điểm L - F - K và chỉ số tâm lý...",
  "Đang trích xuất dữ liệu Trầm cảm, Lo âu, Căng thẳng...",
  "Đang hoàn tất phân tích lâm sàng..."
];

const MMPI_SCALES_INFO = {
  Hs: "Nghi bệnh (Hs)",
  D: "Trầm cảm (D)",
  Hy: "Cơ thể hóa (Hy)",
  Pd: "Lệch lạc (Pd)",
  Mf: "Giới tính (Mf)",
  Pa: "Hoang tưởng (Pa)",
  Pt: "Suy nhược (Pt)",
  Sc: "Phân liệt (Sc)",
  Ma: "Hưng cảm (Ma)",
  Si: "Hướng nội (Si)"
};

export default function UploadAnalyzer() {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [scanState, setScanState] = useState("idle"); // 'idle', 'scanning', 'verified'
  const [currentStep, setCurrentStep] = useState(0);
  const [testType, setTestType] = useState("dass"); // 'dass', 'mmpi'

  // Editable scores prefilled after scan
  const [dassScores, setDassScores] = useState({ D: 14, A: 10, S: 16 });
  
  // Prefill MMPI clinical scores
  const [mmpiClinical, setMmpiClinical] = useState({
    Hs: 50,
    D: 70,
    Hy: 50,
    Pd: 50,
    Mf: 55,
    Pa: 65,
    Pt: 70,
    Sc: 50,
    Ma: 60,
    Si: 68
  });

  // Prefill MMPI Validity scores matching user's doctor report exactly: L=47, F=79, K=40
  const [mmpiValidity, setMmpiValidity] = useState({ L: 47, F: 79, K: 40 });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveReport = () => {
    let newLog = {};
    if (testType === "dass") {
      newLog = {
        date: new Date().toISOString(),
        test: "dass42",
        scores: { D: dassScores.D, A: dassScores.A, S: dassScores.S },
        severities: {
          D: getDASSInterpretation("D", dassScores.D).level,
          A: getDASSInterpretation("A", dassScores.A).level,
          S: getDASSInterpretation("S", dassScores.S).level
        },
        isUploaded: true
      };
    } else {
      newLog = {
        date: new Date().toISOString(),
        test: "mmpi30",
        validity: mmpiValidity,
        isReliable: isReliable,
        clinical: Object.entries(mmpiClinical).map(([code, score]) => ({ code, score })),
        isUploaded: true
      };
    }
    
    try {
      const raw = localStorage.getItem("banhocduong_history");
      const list = raw ? JSON.parse(raw) : [];
      list.push(newLog);
      localStorage.setItem("banhocduong_history", JSON.stringify(list));
      localStorage.setItem("banhocduong_last_test_date", new Date().toDateString());
      
      // Evaluate progress & adapt companion days
      if (psychologyService && typeof psychologyService.evaluateProgressAndAdaptDuration === "function") {
        const adaptation = psychologyService.evaluateProgressAndAdaptDuration();
        if (adaptation) {
          localStorage.setItem("banhocduong_duration_adaptation_alert", JSON.stringify(adaptation));
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi lưu báo cáo.");
    }
  };

  // Handle file select
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      try {
        const raw = localStorage.getItem("banhocduong_history");
        const list = raw ? JSON.parse(raw) : [];
        list.push({
          date: new Date().toISOString(),
          type: "upload_anomaly",
          desc: `Tải lên tệp không hợp lệ: "${selectedFile.name}" (Hệ thống từ chối định dạng tệp ${selectedFile.type || "không xác định"}).`
        });
        localStorage.setItem("banhocduong_history", JSON.stringify(list));
      } catch (err) {
        console.error(err);
      }
      alert("Định dạng tệp không hợp lệ! Vui lòng tải lên tệp ảnh hoặc PDF.");
      setFile(null);
      setFilePreview(null);
      return;
    }

    setFile(selectedFile);
    setScanState("idle");

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  // Start simulated scan
  const handleStartScan = () => {
    if (!file) return;
    setScanState("scanning");
    setCurrentStep(0);
  };

  useEffect(() => {
    if (scanState !== "scanning") return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setScanState("verified");
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [scanState]);

  // Scoring Interpretations
  const getDASSInterpretation = (scale, score) => {
    if (scale === "D") {
      if (score <= 9) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Tâm trạng ổn định, cậu đang tự điều tiết năng lượng tốt." };
      if (score <= 13) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", desc: "Buồn chán nhẹ thoáng qua, hãy cân bằng thời gian nghỉ ngơi." };
      if (score <= 20) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", desc: "Có dấu hiệu suy nhược động lực rõ rệt, nên chia sẻ gánh nặng." };
      if (score <= 27) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", desc: "U uất sâu sắc kéo dài, cần chủ động kết nối với phòng tâm lý học đường." };
      return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", desc: "Nguy cơ trầm cảm nghiêm trọng, khuyến cáo liên hệ chuyên gia can thiệp." };
    }
    if (scale === "A") {
      if (score <= 7) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Phản ứng lo âu nằm trong tầm kiểm soát." };
      if (score <= 9) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", desc: "Hồi hộp lo âu nhẹ trước áp lực. Hãy tập thở 4-7-8 điều hòa." };
      if (score <= 14) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", desc: "Thường xuyên bất an, lo sợ quá mức khi chạy deadline." };
      if (score <= 19) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", desc: "Lo âu dồn dập, cơ thể thường xuyên có triệu chứng mệt mỏi run rẩy." };
      return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", desc: "Hệ thống thần kinh lo âu quá tải trầm trọng, cần trị liệu tâm lý." };
    }
    // Stress
    if (score <= 14) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Thích ứng tốt với các áp lực công việc, thi cử." };
    if (score <= 18) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", desc: "Căng thẳng nhẹ, dễ cáu gắt tức thời khi kiệt sức." };
    if (score <= 25) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", desc: "Căng thẳng kéo dài gây mệt mỏi, khó ngủ sâu. Nên viết xả stress." };
    if (score <= 33) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", desc: "Quá tải stress nghiêm trọng, cần buông bỏ bớt đầu việc học." };
    return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", desc: "Stress tột độ thần kinh thực vật. Rất dễ bùng phát kiệt quệ." };
  };

  const handleDassChange = (scale, val) => {
    const numericVal = Math.max(0, Math.min(42, parseInt(val, 10) || 0));
    setDassScores((prev) => ({ ...prev, [scale]: numericVal }));
  };

  const handleMmpiClinicalChange = (scale, val) => {
    const numericVal = Math.max(0, Math.min(120, parseInt(val, 10) || 0));
    setMmpiClinical((prev) => ({ ...prev, [scale]: numericVal }));
  };

  const handleMmpiValidityChange = (scale, val) => {
    const numericVal = Math.max(0, Math.min(120, parseInt(val, 10) || 0));
    setMmpiValidity((prev) => ({ ...prev, [scale]: numericVal }));
  };

  // Helper to render Validity Line chart in the report
  const renderValidityGraph = (scores) => {
    const graphH = 185;
    const graphW = 320;
    const getY = (val) => graphH - 20 - ((val - 20) / 100) * (graphH - 40);

    const lY = getY(scores.L);
    const fY = getY(scores.F);
    const kY = getY(scores.K);

    return (
      <div className="bg-[#15141c] rounded-3xl p-4.5 border border-zinc-800 shadow-2xl relative">
        <h4 className="text-[10px] font-black tracking-widest text-[#0071e3] uppercase mb-3 text-center">
          Biểu đồ Kiểm định độ tin cậy L - F - K
        </h4>
        <div className="relative flex justify-center">
          <svg width={graphW} height={graphH} className="overflow-visible select-none">
            {[30, 50, 70, 90, 110].map((t) => {
              const y = getY(t);
              return (
                <g key={t}>
                  <line x1={40} y1={y} x2={graphW - 20} y2={y} className="stroke-zinc-800" strokeWidth="0.8" strokeDasharray="3 3" />
                  <text x={32} y={y + 3} className="fill-zinc-650 font-mono text-[8px]" textAnchor="end">{t}</text>
                </g>
              );
            })}

            {[
              { x: 70, label: "L (Lie)" },
              { x: 160, label: "F (Infrequency)" },
              { x: 250, label: "K (Correction)" }
            ].map((spoke, idx) => (
              <g key={idx}>
                <line x1={spoke.x} y1={getY(20)} x2={spoke.x} y2={getY(120)} className="stroke-zinc-800" strokeWidth="1" />
                <text x={spoke.x} y={graphH - 5} className="fill-zinc-400 font-black text-[9px]" textAnchor="middle">{spoke.label}</text>
              </g>
            ))}

            <polyline
              points={`70,${lY} 160,${fY} 250,${kY}`}
              fill="none"
              className="stroke-emerald-400"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {[
              { x: 70, y: lY, val: scores.L, color: scores.L >= 70 ? "fill-red-500" : "fill-emerald-400" },
              { x: 160, y: fY, val: scores.F, color: scores.F >= 74 ? "fill-red-500" : "fill-emerald-400" },
              { x: 250, y: kY, val: scores.K, color: scores.K >= 70 ? "fill-red-500" : "fill-emerald-400" }
            ].map((dot, idx) => (
              <g key={idx}>
                <circle cx={dot.x} cy={dot.y} r="5" className={`${dot.color} stroke-[#15141c]`} strokeWidth="1.5" />
                <text x={dot.x + 9} y={dot.y - 7} className="fill-white font-mono font-black text-[9.5px]">{dot.val}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const isReliable = mmpiValidity.L < 70 && mmpiValidity.F < 74 && mmpiValidity.K < 70;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      <div className="text-center max-w-md mx-auto space-y-1.5">
        <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
          Phân Tích Báo Cáo Sức Khỏe Tinh Thần
        </h4>
        <p className="text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed">
          Tải ảnh chụp hoặc file PDF kết quả đo DASS-42 / MMPI từ bác sĩ để hệ thống Bạn Học Đường lập tức phân tích và đồng hành.
        </p>
      </div>

      {/* Upload zone */}
      {scanState === "idle" && (
        <div className="max-w-xl mx-auto border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-black/5 rounded-3xl p-8 text-center space-y-4 hover:border-[#0071e3] transition-all">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            id="file-scanner-input"
            className="hidden"
          />
          <label htmlFor="file-scanner-input" className="cursor-pointer space-y-3 block">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-550 dark:text-zinc-300">
              <span className="material-symbols-outlined text-2xl animate-bounce">cloud_upload</span>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Kéo thả hoặc bấm để tải báo cáo lên
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                Hỗ trợ các định dạng PNG, JPG, PDF
              </p>
            </div>
          </label>
          
          {file && (
            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-xl max-w-sm mx-auto">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
          )}

          {file && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartScan}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 mx-auto active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Bắt đầu quét kết quả
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sweep laser line scanner view */}
      {scanState === "scanning" && (
        <div className="max-w-xl mx-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12111a] rounded-3xl p-6 space-y-6 shadow-xl text-center relative overflow-hidden">
          <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#0071e3] to-transparent animate-laser-scan shadow-[0_0_10px_2px_rgba(0,113,227,0.7)]" />

          {filePreview ? (
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-zinc-250 dark:border-zinc-800 bg-zinc-150 relative">
              <img src={filePreview} alt="Preview" className="w-full h-full object-cover opacity-45 blur-[0.5px]" />
            </div>
          ) : (
            <div className="w-full h-44 rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined text-4xl animate-pulse">picture_as_pdf</span>
              <p className="text-[10px] mt-2 font-black uppercase tracking-wider">{file?.name}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-ping" />
              <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                {SCAN_STEPS[currentStep]}
              </p>
            </div>
            <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-widest">
              Động cơ Bạn Học Đường OCR y học v2.0
            </p>
          </div>
        </div>
      )}

      {/* Scan completed results editor and graphs view */}
      {scanState === "verified" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-4.5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase block">
                Nhận diện thành công
              </span>
              <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider mt-0.5">
                Vui lòng hiệu chỉnh lại điểm số theo báo cáo thực tế:
              </h3>
            </div>
            <div className="flex bg-white dark:bg-zinc-950 p-[3px] border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setTestType("dass")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  testType === "dass" ? "bg-[#0071e3] text-white shadow" : "text-zinc-450 hover:text-zinc-700"
                }`}
              >
                DASS-42
              </button>
              <button
                type="button"
                onClick={() => setTestType("mmpi")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  testType === "mmpi" ? "bg-indigo-650 text-white shadow" : "text-zinc-450 hover:text-zinc-700"
                }`}
              >
                Mini-MMPI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Input Editor Panel */}
            <div className="lg:col-span-5 border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2">
                Thông số nhập liệu
              </h4>

              {testType === "dass" ? (
                <div className="space-y-4.5">
                  <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">
                    (Vui lòng nhập trực tiếp điểm số gốc của các thang đo DASS-42 trong tài liệu, tối đa 42 điểm mỗi cột).
                  </p>
                  {[
                    { key: "D", label: "Trầm cảm (Depression score)" },
                    { key: "A", label: "Lo âu (Anxiety score)" },
                    { key: "S", label: "Căng thẳng (Stress score)" }
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-bold text-zinc-650 dark:text-zinc-400">{field.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="42"
                        value={dassScores[field.key]}
                        onChange={(e) => handleDassChange(field.key, e.target.value)}
                        className="w-20 px-3 py-1.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto scrollbar-none pr-1">
                  
                  {/* Validity scores inputs */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-[#0071e3] tracking-widest block">Thang đo kiểm định (Validity Scales)</span>
                    {["L", "F", "K"].map((scale) => (
                      <div key={scale} className="flex items-center justify-between gap-4 pl-1">
                        <label className="text-xs font-black text-zinc-650 dark:text-zinc-400">T-score kiểm chứng {scale}</label>
                        <input
                          type="number"
                          min="30"
                          max="120"
                          value={mmpiValidity[scale]}
                          onChange={(e) => handleMmpiValidityChange(scale, e.target.value)}
                          className="w-18 px-2 py-1 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-200/40 dark:border-zinc-800/40 pt-3 space-y-2">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest block">Thang đo lâm sàng (Clinical Scales)</span>
                    {Object.entries(MMPI_SCALES_INFO).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between gap-4 pl-1">
                        <label className="text-xs font-bold text-zinc-650 dark:text-zinc-400">{label}</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={mmpiClinical[key]}
                          onChange={(e) => handleMmpiClinicalChange(key, e.target.value)}
                          className="w-18 px-2 py-1 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-wider text-center animate-scaleUp">
                  Đã lưu báo cáo thành công!
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveReport}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] mb-3 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Lưu báo cáo vào lịch sử
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setScanState("idle");
                }}
                className="w-full py-2.5 border border-zinc-300 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Tải lên tệp tin khác
              </button>
            </div>

            {/* Right: Reports & Visualizations */}
            <div className="lg:col-span-7 space-y-5">
              {testType === "dass" ? (
                <div className="border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-3xl p-5 space-y-4.5 shadow-sm">
                  <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider pb-2 border-b border-zinc-200/30">Kết quả đo DASS-42</h4>
                  {[
                    { key: "D", title: "Trầm Cảm", color: "bg-red-500", score: dassScores.D },
                    { key: "A", title: "Lo Âu", color: "bg-amber-500", score: dassScores.A },
                    { key: "S", title: "Căng Thẳng", color: "bg-blue-500", score: dassScores.S }
                  ].map((s) => {
                    const interp = getDASSInterpretation(s.key, s.score);
                    return (
                      <div key={s.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10.5px] font-bold">
                          <span className="text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{s.title}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${interp.bg} ${interp.color}`}>
                            {interp.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden relative shadow-inner">
                            <div
                              className={`h-full ${s.color} transition-all duration-500`}
                              style={{ width: `${(s.score / 42) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">
                            {s.score}/42
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-450 leading-relaxed font-bold">
                          {interp.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Validity graph */}
                  {renderValidityGraph(mmpiValidity)}

                  {/* Low validity alert */}
                  {!isReliable && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[10.5px] font-bold leading-relaxed shadow-sm">
                      ⚠️ Cảnh báo: Điểm số trích xuất ghi nhận mức độ tin cậy thấp (Chỉ số F hoặc L tăng vượt ngưỡng). Tài liệu có thể bị nhòe hoặc số liệu chưa phản ánh đúng quy định lâm sàng.
                    </div>
                  )}

                  {/* Clinical scores list */}
                  <div className="border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-3xl p-5 space-y-4.5 shadow-sm">
                    <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider pb-2 border-b border-zinc-200/30">10 Thang đo lâm sàng nhân cách</h4>
                    
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                      {Object.entries(mmpiClinical).map(([key, score]) => {
                        const isElevated = score >= 65;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-zinc-700 dark:text-zinc-350">
                                {MMPI_SCALES_INFO[key]}
                              </span>
                              <span className={`font-mono font-black ${isElevated ? "text-red-500" : "text-zinc-450"}`}>
                                T-score: {score}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden relative shadow-inner">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isElevated ? "bg-red-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${(score / 120) * 100}%` }}
                                />
                              </div>
                              {isElevated && (
                                <span className="text-[8px] font-black text-red-500 px-1 py-0.5 rounded bg-red-500/10 uppercase animate-pulse">
                                  Cảnh báo
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Style overrides for scan animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes laserSweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-laser-scan {
          animation: laserSweep 2s linear infinite;
        }
      `}} />
    </div>
  );
}
