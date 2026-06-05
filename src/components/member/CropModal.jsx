import React from "react";

export default function CropModal({
  cropModal,
  setCropModal,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  handleCropSave,
  t
}) {
  if (!cropModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-2xl p-6 text-center space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{t("memberPortal.crop.title")}</h3>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-400">{t("memberPortal.crop.desc")}</p>
        </div>

        {/* Circular Crop Frame container */}
        <div
          className="w-48 h-48 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-950 mx-auto cursor-move select-none shadow-inner"
          style={{ touchAction: 'none' }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <img
            src={cropModal.imageSrc}
            alt="To Crop"
            className="absolute pointer-events-none origin-center"
            style={{
              transform: `translate(${cropModal.offset.x}px, ${cropModal.offset.y}px) scale(${cropModal.zoom})`,
              left: '50%',
              top: '50%',
              marginLeft: '-96px',
              marginTop: `-${((192 / (cropModal.aspect || 1)) / 2)}px`,
              maxWidth: 'none',
              width: '192px',
            }}
          />
        </div>

        {/* Zoom Slider */}
        <div className="space-y-2 px-4">
          <div className="flex justify-between text-[10px] text-zinc-450 dark:text-zinc-400 font-bold">
            <span>{t("memberPortal.crop.zoomOut")}</span>
            <span>{t("memberPortal.crop.zoomIn")}</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={cropModal.zoom}
            onChange={(e) => setCropModal((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded appearance-none cursor-pointer accent-[#0071e3]"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCropModal({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } })}
            className="py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            {t("memberPortal.crop.cancel")}
          </button>
          <button
            type="button"
            onClick={handleCropSave}
            className="py-2.5 rounded-md bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold shadow-md transition-colors"
          >
            {t("memberPortal.crop.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
