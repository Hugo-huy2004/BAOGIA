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
    if (!zipFile) return showToast(t("utilities.fileTools.extract.toastSelectZip"), "error");
    if (!zipFile.name.toLowerCase().endsWith('.zip')) return showToast(t("utilities.fileTools.extract.toastZipFormat"), "error");
    if (zipFile.size > 50 * 1024 * 1024) return showToast(t("utilities.fileTools.extract.toastSizeLimit"), "error");

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", zipFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/files/extract/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || t("utilities.fileTools.extract.toastReadError"));
      }

      setZipResult(data);
      showToast(t("utilities.fileTools.extract.toastReadSuccess"), "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || t("utilities.fileTools.extract.toastReadError"), "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleDownloadZipEntry = (entryName) => {
    if (!zipResult) return;
    const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/files/extract/download/${zipResult.fileId}?entryName=${encodeURIComponent(entryName)}`;
    
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
    if (!compressFile) return showToast(t("utilities.fileTools.compress.toastSelectFile"), "error");
    if (compressFile.size > 50 * 1024 * 1024) return showToast(t("utilities.fileTools.extract.toastSizeLimit"), "error");

    setCompressing(true);
    try {
      const formData = new FormData();
      formData.append("file", compressFile);
      formData.append("level", compressLevel);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/files/compress`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t("utilities.fileTools.compress.toastError"));
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

      showToast(t("utilities.fileTools.compress.toastSuccess"), "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || t("utilities.fileTools.compress.toastError"), "error");
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="space-y-6">
      <SubUtilityHeader 
        title={t("utilities.fileTools.title")} 
        description={t("utilities.fileTools.desc")}
        onBack={onBack}
        icon="folder_zip"
      />

      {/* Tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-md">
        <button
          onClick={() => setActiveSubTab("extract")}
          className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
            activeSubTab === "extract" 
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {t("utilities.fileTools.tabExtract")}
        </button>
        <button
          onClick={() => setActiveSubTab("compress")}
          className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
            activeSubTab === "compress" 
            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {t("utilities.fileTools.tabCompress")}
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
            <div className="p-5 rounded-lg bg-white dark:bg-card border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {t("utilities.fileTools.extract.label")}
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  setZipFile(e.target.files[0]);
                  setZipResult(null); // reset old result
                }}
                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/15 dark:file:text-primary"
              />
              <button
                onClick={handleZipUpload}
                disabled={!zipFile || extracting}
                className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
              >
                {extracting ? t("utilities.fileTools.extract.processing") : t("utilities.fileTools.extract.btnUpload")}
              </button>
            </div>

            {/* Hiển thị kết quả ZIP */}
            {zipResult && zipResult.entries && (
              <div className="p-5 rounded-lg bg-white dark:bg-card border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                  {t("utilities.fileTools.extract.resultTitle")}
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {zipResult.entries.filter(e => !e.isDirectory && !e.name.includes('__MACOSX')).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
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
                        className="p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/15 rounded transition-colors flex-shrink-0"
                        title={t("utilities.fileTools.extract.btnDownloadTooltip")}
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
            <div className="p-5 rounded-lg bg-white dark:bg-card border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("utilities.fileTools.compress.label")}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={(e) => setCompressFile(e.target.files[0])}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/15 dark:file:text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  {t("utilities.fileTools.compress.levelSection")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "light", name: t("utilities.fileTools.compress.levels.light") },
                    { id: "medium", name: t("utilities.fileTools.compress.levels.medium") },
                    { id: "strong", name: t("utilities.fileTools.compress.levels.strong") }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCompressLevel(level.id)}
                      className={`py-2 px-1 text-xs sm:text-sm font-medium rounded border transition-all ${
                        compressLevel === level.id
                          ? "border-primary bg-primary/10 text-primary dark:bg-primary/15"
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
                className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                {compressing && <span className="material-symbols-outlined animate-spin">refresh</span>}
                {compressing ? t("utilities.fileTools.extract.processing") : t("utilities.fileTools.compress.btnSubmit")}
              </button>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                {t("utilities.fileTools.compress.privacyNote")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
