import { useState, useEffect } from "react";

const AI_URL = `${import.meta.env.VITE_API_URL || "/api"}/ai`;
const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const MMPI_CLINICAL_CODES = ["Hs", "D", "Hy", "Pd", "Mf", "Pa", "Pt", "Sc", "Ma", "Si"];

const SCAN_STEPS = [
  "Đang đọc nội dung trong tài liệu...",
  "Đang nhận diện loại biểu mẫu...",
  "Đang trích xuất các chỉ số được ghi trên phiếu...",
  "Đang kiểm tra tính đầy đủ của dữ liệu..."
];

export default function ClinicScanner({ onScanComplete, onCancel }) {
  const [scanFile, setScanFile] = useState(null);
  const [scanFilePreview, setScanFilePreview] = useState(null);
  const [scanState, setScanState] = useState("idle"); // idle | scanning | verified | error
  const [scanError, setScanError] = useState("");
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [scanTestType, setScanTestType] = useState("dass"); // 'dass' | 'mmpi' | 'general_medical'

  // Never prefill health data: values only appear after a successful extraction.
  const [scanDassScores, setScanDassScores] = useState({ D: null, A: null, S: null });
  const [scanMmpiClinical, setScanMmpiClinical] = useState(
    () => Object.fromEntries(MMPI_CLINICAL_CODES.map((code) => [code, null]))
  );
  const [scanMmpiValidity, setScanMmpiValidity] = useState({ L: null, F: null, K: null });
  const [scanGeneralIndices, setScanGeneralIndices] = useState([]);

  useEffect(() => {
    return () => {
      if (scanFilePreview) URL.revokeObjectURL(scanFilePreview);
    };
  }, [scanFilePreview]);

  const asBoundedScore = (value, max) => {
    const score = Number(value);
    return Number.isFinite(score) && score >= 0 && score <= max ? score : null;
  };

  const cleanExtractedText = (value, maxLength = 100) =>
    String(value ?? "").replace(/[\r\n|]/g, " ").trim().slice(0, maxLength);

  const parseExtractedReport = (data, requestedType) => {
    if (!data || typeof data !== "object" || data.error) {
      throw new Error("Không nhận được dữ liệu đáng tin cậy từ tài liệu.");
    }

    const detectedType = ["dass", "mmpi", "general_medical"].includes(data.testType)
      ? data.testType
      : requestedType;

    if (detectedType === "dass") {
      const scores = Object.fromEntries(
        ["D", "A", "S"].map((scale) => [scale, asBoundedScore(data.scores?.[scale], 42)])
      );
      if (Object.values(scores).some((score) => score === null)) {
        throw new Error("Không đọc đủ ba chỉ số D, A và S. Hãy chụp rõ toàn bộ bảng điểm.");
      }
      setScanDassScores(scores);
    } else if (detectedType === "mmpi") {
      const validity = Object.fromEntries(
        ["L", "F", "K"].map((scale) => [scale, asBoundedScore(data.validity?.[scale], 120)])
      );
      const clinical = Object.fromEntries(
        MMPI_CLINICAL_CODES.map((scale) => [scale, asBoundedScore(data.clinical?.[scale], 120)])
      );
      if ([...Object.values(validity), ...Object.values(clinical)].some((score) => score === null)) {
        throw new Error("Không đọc đủ các thang điểm trên báo cáo. Hãy dùng bản chụp rõ và đầy đủ hơn.");
      }
      setScanMmpiValidity(validity);
      setScanMmpiClinical(clinical);
    } else {
      const indices = Array.isArray(data.general_indices)
        ? data.general_indices
          .filter((item) => item && item.name && item.value !== undefined)
          .map((item) => ({
            name: cleanExtractedText(item.name, 80),
            value: cleanExtractedText(item.value, 60),
            unit: cleanExtractedText(item.unit, 40),
            reference: cleanExtractedText(item.reference, 80)
          }))
        : [];
      if (indices.length === 0) {
        throw new Error("Không tìm thấy chỉ số xét nghiệm có thể xác minh trong tài liệu.");
      }
      setScanGeneralIndices(indices);
    }

    setScanTestType(detectedType);
  };

  const handleStartScan = async (testType) => {
    if (!scanFile) return;
    if (scanFile.size > MAX_REPORT_BYTES) {
      setScanError("Tệp vượt quá 10 MB. Hãy chọn ảnh hoặc PDF nhỏ hơn.");
      setScanState("error");
      return;
    }

    setScanTestType(testType);
    setScanState("scanning");
    setScanError("");
    setScanStepIdx(0);

    // Setup simulated steps progression
    const interval = setInterval(() => {
      setScanStepIdx((prev) => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    try {
      const formData = new FormData();
      formData.append("file", scanFile);

      const response = await fetch(`${AI_URL}/analyze-report`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
      }
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Không thể đọc tài liệu lúc này.");
      }

      parseExtractedReport(data, testType);
      setScanState("verified");
    } catch (err) {
      setScanError(err?.message || "Không thể đọc tài liệu. Vui lòng thử lại.");
      setScanState("error");
    } finally {
      clearInterval(interval);
    }
  };

  const handleFileChange = (selectedFile) => {
    if (scanFilePreview) URL.revokeObjectURL(scanFilePreview);
    setScanError("");
    setScanState("idle");
    setScanFile(selectedFile || null);
    if (!selectedFile) {
      setScanFilePreview(null);
      return;
    }
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      setScanFile(null);
      setScanFilePreview(null);
      setScanError("Chỉ hỗ trợ ảnh PNG, JPG hoặc tệp PDF.");
      setScanState("error");
      return;
    }
    setScanFilePreview(selectedFile.type.startsWith("image/") ? URL.createObjectURL(selectedFile) : null);
  };

  const updateGeneralIndex = (index, field, value) => {
    setScanGeneralIndices((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: cleanExtractedText(value) } : item
      )
    );
  };

  const handleSave = () => {
    let resultLog = {};
    if (scanTestType === "dass") {
      resultLog = {
        date: new Date().toISOString(),
        test: "dass42",
        scores: { D: scanDassScores.D, A: scanDassScores.A, S: scanDassScores.S },
        isUploaded: true,
        source: "ocr_user_verified"
      };
    } else if (scanTestType === "general_medical") {
      resultLog = {
        date: new Date().toISOString(),
        test: "general_medical",
        indices: scanGeneralIndices.map((item) => ({
          name: item.name,
          value: item.value,
          unit: item.unit,
          reference: item.reference
        })),
        isUploaded: true,
        source: "ocr_user_verified"
      };
    } else {
      resultLog = {
        date: new Date().toISOString(),
        test: "mmpi30",
        validity: scanMmpiValidity,
        clinical: Object.entries(scanMmpiClinical).map(([code, score]) => ({ code, score })),
        isUploaded: true,
        source: "ocr_user_verified"
      };
    }

    onScanComplete(scanTestType, resultLog);
  };

  const renderValidityGraph = (scores) => {
    const graphH = 180;
    const graphW = 280;
    const getY = (val) => graphH - 20 - ((val - 20) / 100) * (graphH - 40);

    const lY = getY(scores.L);
    const fY = getY(scores.F);
    const kY = getY(scores.K);

    return (
      <div className="bg-card rounded-lg p-3 border border-zinc-800 shadow-lg relative">
        <h4 className="text-[9px] font-black tracking-widest text-primary uppercase mb-2 text-center">
          Biểu đồ L - F - K
        </h4>
        <div className="relative flex justify-center">
          <svg width={graphW} height={graphH} className="overflow-visible select-none">
            {[30, 50, 70, 90, 110].map((t) => {
              const y = getY(t);
              return (
                <g key={t}>
                  <line x1={30} y1={y} x2={graphW - 10} y2={y} className="stroke-zinc-800" strokeWidth="0.8" strokeDasharray="3 3" />
                  <text x={24} y={y + 3} className="fill-zinc-650 font-mono text-[8px]" textAnchor="end">{t}</text>
                </g>
              );
            })}

            {[
              { x: 50, label: "L" },
              { x: 140, label: "F" },
              { x: 230, label: "K" }
            ].map((spoke, idx) => (
              <g key={idx}>
                <line x1={spoke.x} y1={getY(20)} x2={spoke.x} y2={getY(120)} className="stroke-zinc-800" strokeWidth="1" />
                <text x={spoke.x} y={graphH - 5} className="fill-zinc-400 font-black text-[9px]" textAnchor="middle">{spoke.label}</text>
              </g>
            ))}

            <polyline
              points={`50,${lY} 140,${fY} 230,${kY}`}
              fill="none"
              className="stroke-success"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {[
              { x: 50, y: lY, val: scores.L },
              { x: 140, y: fY, val: scores.F },
              { x: 230, y: kY, val: scores.K }
            ].map((dot, idx) => (
              <g key={idx}>
                <circle cx={dot.x} cy={dot.y} r="4" className="fill-primary stroke-card" strokeWidth="1.5" />
                <text x={dot.x + 8} y={dot.y - 6} className="fill-white font-mono font-black text-[8.5px]">{dot.val}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 pt-3 max-w-md mx-auto animate-scaleUp text-left">
      <div className="relative text-center space-y-1 px-8">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng trình đọc tài liệu"
          className="absolute -left-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition active:scale-90"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-zinc-900/10 border border-zinc-900/20 text-zinc-855 dark:bg-white/10 dark:text-white dark:border-white/20 uppercase">
          Quét hồ sơ phòng khám
        </span>
        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
          Trích xuất dữ liệu từ phiếu kết quả
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
          HugoPSY chỉ đọc lại các chỉ số có trên ảnh hoặc PDF. Kết quả cần được cậu kiểm tra trước khi lưu và không thay thế nhận định của chuyên gia.
        </p>
      </div>

      {scanState === "idle" && (
        <div className="border-2 border-dashed border-border bg-card/40 rounded-xl p-6 text-center space-y-4 hover:border-primary transition-all">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            id="chat-scanner-input-sub"
            className="hidden"
          />
          <label htmlFor="chat-scanner-input-sub" className="cursor-pointer block space-y-3 py-2">
            <span className="material-symbols-outlined text-3xl text-muted-foreground block">cloud_upload</span>
            <span className="text-[10.5px] font-black uppercase text-primary hover:underline block">Chọn file ảnh hoặc PDF</span>
            <span className="text-[9px] text-muted-foreground/70 block">PNG, JPG hoặc PDF · tối đa 10 MB</span>
          </label>

          {scanFile && (
            <div className="pt-2 space-y-2 border-t border-dashed border-border">
              <div className="text-[10px] text-foreground/80 font-bold truncate max-w-xs mx-auto">
                File đã chọn: {scanFile.name}
              </div>
              {scanFilePreview && (
                <img src={scanFilePreview} className="w-16 h-16 object-cover rounded mx-auto border" alt="Preview" />
              )}
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => handleStartScan("dass")}
                  className="px-3 py-1.5 bg-primary text-white text-[9.5px] font-black uppercase rounded shadow hover:bg-primary/90"
                >
                  HỒ SƠ DASS
                </button>
                <button
                  type="button"
                  onClick={() => handleStartScan("mmpi")}
                  className="px-3 py-1.5 bg-primary text-white text-[9.5px] font-black uppercase rounded shadow hover:bg-primary/90"
                >
                  BÁO CÁO MMPI
                </button>
                <button
                  type="button"
                  onClick={() => handleStartScan("general_medical")}
                  className="px-3 py-1.5 bg-success text-white text-[9.5px] font-black uppercase rounded shadow hover:bg-success/90"
                >
                  XÉT NGHIỆM TỔNG QUÁT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {scanState === "scanning" && (
        <div className="p-6 border-2 border-zinc-900 dark:border-zinc-800 bg-card rounded-xl space-y-4 text-center">
          <span className="material-symbols-outlined text-2xl text-primary animate-spin">refresh</span>
          <p className="text-[10.5px] font-bold text-foreground">
            {SCAN_STEPS[scanStepIdx]}
          </p>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${((scanStepIdx + 1) / 4) * 100}%` }} />
          </div>
        </div>
      )}

      {scanState === "error" && (
        <div role="alert" className="p-5 border border-rose-300/70 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/20 rounded-2xl space-y-4 text-center">
          <span className="material-symbols-outlined text-2xl text-rose-500">error</span>
          <div>
            <p className="text-[11px] font-black text-rose-700 dark:text-rose-300">Chưa thể xác minh tài liệu</p>
            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-rose-600/80 dark:text-rose-300/75">{scanError}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setScanState("idle");
                setScanError("");
              }}
              className="flex-1 py-2 rounded-xl border border-rose-300/70 text-[9.5px] font-black uppercase text-rose-700 dark:text-rose-300"
            >
              Chọn tệp khác
            </button>
            {scanFile && (
              <button
                type="button"
                onClick={() => handleStartScan(scanTestType)}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-[9.5px] font-black uppercase"
              >
                Thử đọc lại
              </button>
            )}
          </div>
        </div>
      )}

      {scanState === "verified" && (
        <div className="p-5 pt-6 border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-card rounded-xl space-y-5 animate-scaleUp max-h-[340px] md:max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-foreground border-b pb-1">
            Xác thực thông tin trích xuất
          </h5>

          {scanTestType === "dass" ? (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                Cậu hãy kiểm tra và điều chỉnh điểm số gốc (tối đa 42 điểm):
              </p>
              <div className="grid grid-cols-3 gap-3">
                {["D", "A", "S"].map((scale) => (
                  <div key={scale} className="space-y-1 text-center">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
                      {scale === "D" ? "Trầm Cảm" : scale === "A" ? "Lo Âu" : "Căng Thẳng"}
                    </label>
                    <input
                      type="number"
                      value={scanDassScores[scale]}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(42, parseInt(e.target.value, 10) || 0));
                        setScanDassScores((prev) => ({ ...prev, [scale]: val }));
                      }}
                      className="w-full text-center px-2 py-1.5 border border-border bg-card text-xs rounded font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : scanTestType === "general_medical" ? (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                Đã đọc được {scanGeneralIndices.length} chỉ số. Hãy sửa trực tiếp nếu OCR nhận nhầm rồi mới lưu:
              </p>
              <div className="space-y-2">
                {scanGeneralIndices.map((idxItem, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <label className="block space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Tên chỉ số</span>
                      <input
                        value={idxItem.name}
                        onChange={(event) => updateGeneralIndex(idx, "name", event.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-[10px] font-bold text-foreground"
                      />
                    </label>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(72px,0.65fr)] gap-2">
                      <label className="block space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Kết quả trên phiếu</span>
                        <input
                          value={idxItem.value}
                          onChange={(event) => updateGeneralIndex(idx, "value", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-[10px] font-bold text-foreground"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Đơn vị</span>
                        <input
                          value={idxItem.unit}
                          onChange={(event) => updateGeneralIndex(idx, "unit", event.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-[10px] font-bold text-foreground"
                        />
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Khoảng tham chiếu in trên phiếu</span>
                      <input
                        value={idxItem.reference}
                        onChange={(event) => updateGeneralIndex(idx, "reference", event.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-[10px] font-mono text-foreground"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-primary tracking-widest block">Thang đo kiểm định L-F-K</span>
                <div className="grid grid-cols-3 gap-2">
                  {["L", "F", "K"].map((scale) => (
                    <div key={scale} className="space-y-1 text-center">
                      <label className="text-[9px] font-black text-muted-foreground uppercase block">{scale}</label>
                      <input
                        type="number"
                        value={scanMmpiValidity[scale]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(120, parseInt(e.target.value, 10) || 0));
                          setScanMmpiValidity((prev) => ({ ...prev, [scale]: val }));
                        }}
                        className="w-full text-center py-1 border border-border bg-card text-[10px] rounded font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {renderValidityGraph(scanMmpiValidity)}

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide border-t pt-2">
                <span className="text-[9px] font-black uppercase text-primary tracking-widest block">Các thang điểm trên báo cáo</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(scanMmpiClinical).map((scale) => (
                    <div key={scale} className="flex justify-between items-center gap-2 p-1.5 border border-border rounded">
                      <span className="text-[9.5px] font-black text-muted-foreground dark:text-muted-foreground/70">{scale}</span>
                      <input
                        type="number"
                        value={scanMmpiClinical[scale]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(120, parseInt(e.target.value, 10) || 0));
                          setScanMmpiClinical((prev) => ({ ...prev, [scale]: val }));
                        }}
                        className="w-12 text-center py-1 border border-border bg-card text-[10px] rounded font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-zinc-300 text-muted-foreground hover:bg-zinc-50 text-[9.5px] font-black uppercase rounded"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 bg-primary text-white hover:bg-primary/90 text-[9.5px] font-black uppercase rounded"
            >
              Xác nhận dữ liệu & Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
