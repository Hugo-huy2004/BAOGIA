import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberFileToolsTab({ onBack, showToast }) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState("extract"); // extract | compress

  // --- Extract State ---
  const [zipFile, setZipFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [zipResult, setZipResult] = useState(null); // { fileId, entries }

  // --- Compress State ---
  const [compressFile, setCompressFile] = useState(null);
  const [compressLevel, setCompressLevel] = useState("medium"); // light, medium, strong
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

  // === EXTRACT HANDLERS ===
  const handleZipUpload = async () => {
    if (!zipFile) return showToast("Vui lòng chọn file ZIP", "error");
    if (!zipFile.name.toLowerCase().endsWith('.zip')) return showToast("Chỉ hỗ trợ file .zip", "error");
    if (zipFile.size > 50 * 1024 * 1024) return showToast("Dung lượng vượt quá 50MB", "error");

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", zipFile);

      const res = await fetch("http://localhost:8081/api/files/extract/upload", {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Lỗi xử lý file ZIP");
      }

      setZipResult(data);
      showToast("Tải lên và đọc file ZIP thành công", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Có lỗi xảy ra khi xử lý file ZIP", "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleDownloadZipEntry = (entryName) => {
    if (!zipResult) return;
    const downloadUrl = `http://localhost:8081/api/files/extract/download/${zipResult.fileId}?entryName=${encodeURIComponent(entryName)}`;
    
    // Create a temporary link to download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = entryName.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === COMPRESS HANDLERS ===
  const handleCompress = async () => {
    if (!compressFile) return showToast("Vui lòng chọn file Ảnh/Video", "error");
    if (compressFile.size > 50 * 1024 * 1024) return showToast("Dung lượng vượt quá 50MB", "error");

    setCompressing(true);
    try {
      const formData = new FormData();
      formData.append("file", compressFile);
      formData.append("level", compressLevel);

      const res = await fetch("http://localhost:8081/api/files/compress", {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Lỗi nén file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Đoán tên file
      const isVideo = ['video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(compressFile.type) || compressFile.name.endsWith('.mp4');
      const ext = isVideo ? '.mp4' : compressFile.name.substring(compressFile.name.lastIndexOf('.'));
      link.setAttribute("download", `compressed_${compressFile.name.substring(0, compressFile.name.lastIndexOf('.'))}${ext}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Nén và tải về thành công!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Lỗi khi nén file. Hãy đảm bảo định dạng được hỗ trợ (jpg, png, webp, mp4).", "error");
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="space-y-6">
      <SubUtilityHeader 
        title="Công Cụ Xử Lý File" 
        description="Giải nén và tối ưu dung lượng siêu tốc, an toàn tuyệt đối."
        onBack={onBack}
        icon="folder_zip"
      />

      {/* Tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveSubTab("extract")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeSubTab === "extract" 
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Giải Nén ZIP
        </button>
        <button
          onClick={() => setActiveSubTab("compress")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeSubTab === "compress" 
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Giảm Dung Lượng
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB EXTRACT */}
        {activeSubTab === "extract" && (
          <motion.div
            key="extract"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Chọn File ZIP (Tối đa 50MB)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  setZipFile(e.target.files[0]);
                  setZipResult(null); // reset old result
                }}
                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-500/10 dark:file:text-blue-400"
              />
              <button
                onClick={handleZipUpload}
                disabled={!zipFile || extracting}
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                {extracting ? "Đang xử lý..." : "Tải lên & Đọc nội dung"}
              </button>
            </div>

            {/* Hiển thị kết quả ZIP */}
            {zipResult && zipResult.entries && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                  Danh sách File trong ZIP:
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {zipResult.entries.filter(e => !e.isDirectory && !e.name.includes('__MACOSX')).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-zinc-400">insert_drive_file</span>
                        <div className="flex flex-col truncate">
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate" title={entry.name}>
                            {entry.name.split('/').pop()}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {(entry.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadZipEntry(entry.name)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Tải về file này"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB COMPRESS */}
        {activeSubTab === "compress" && (
          <motion.div
            key="compress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Chọn Hình Ảnh / Video (Tối đa 50MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={(e) => setCompressFile(e.target.files[0])}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-500/10 dark:file:text-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Mức độ nén
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "light", name: "Nhẹ (Giữ nét)" },
                    { id: "medium", name: "Vừa phải" },
                    { id: "strong", name: "Mạnh (Nhẹ nhất)" }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCompressLevel(level.id)}
                      className={`py-2 px-1 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                        compressLevel === level.id
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCompress}
                disabled={!compressFile || compressing}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {compressing && <span className="material-symbols-outlined animate-spin">refresh</span>}
                {compressing ? "Đang xử lý..." : "Nén & Tải Về"}
              </button>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Mọi file tải lên đều được xử lý và tự động xóa khỏi hệ thống, không lưu trữ để bảo vệ quyền riêng tư của bạn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
