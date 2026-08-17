import React, { useState } from 'react';

/**
 * Trình Tạo Mã QR Động Chuyên Nghiệp (Dynamic QR Code Generator)
 * Cho phép thành viên tùy chỉnh màu sắc, nhúng Avatar/Logo, và tải về mã QR
 * chất lượng cao (PNG) dành cho Namecard / Bio Link công khai.
 */
export default function DynamicQrGenerator({ bioSlug = '', displayName = 'Hugo Studio' }) {
  const [fgColor, setFgColor] = useState('#0284c7');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [size, setSize] = useState(240);

  const bioUrl = `${window.location.origin}/bio/${bioSlug || 'demo'}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bioUrl)}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&margin=2`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QR-${bioSlug || 'hugostudio'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(qrApiUrl, '_blank');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-w-md w-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <span className="material-symbols-outlined text-white text-xl">qr_code_2</span>
        </div>
        <div>
          <h3 className="text-base font-black text-white">Mã QR Động Cá Nhân</h3>
          <p className="text-xs text-slate-400">Tạo mã QR dán Namecard / Bio Link công khai</p>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center">
          <img
            src={qrApiUrl}
            alt="Dynamic QR Code"
            className="w-48 h-48 rounded-xl object-contain shadow-md"
          />
          <span className="text-[11px] font-mono text-cyan-400 mt-3 truncate max-w-[200px]">
            {bioUrl}
          </span>
        </div>
      </div>

      {/* Customization Controls */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1.5 block">Màu Mã QR</label>
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-200 uppercase">{fgColor}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1.5 block">Màu Phông Nền</label>
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-200 uppercase">{bgColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleDownload}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-base">download</span>
        <span>Tải Mã QR Chất Lượng Cao (PNG)</span>
      </button>
    </div>
  );
}
