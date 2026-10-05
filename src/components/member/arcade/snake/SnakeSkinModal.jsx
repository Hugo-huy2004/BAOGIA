import { memo } from "react";
import { SNAKE_SKINS } from "../snakeModels";

function SnakeSkinModal({ isOpen, onClose, selectedSkin, onSelectSkin, isVi }) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-4 border-amber-300 flex flex-col gap-3 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-black text-amber-950 flex items-center gap-1.5">
            <span>🎨</span> {isVi ? "Tủ Đồ Bé Rắn" : "Snake Wardrobe"}
          </h3>
          <button
            type="button"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <p className="text-[13px] text-slate-600">
          {isVi ? "Chọn bé rắn yêu thích để đồng hành cùng Quý khách:" : "Choose your favorite companion snake:"}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {Object.values(SNAKE_SKINS).map((skin) => (
            <button
              key={skin.id}
              type="button"
              className={`flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all text-left ${
                selectedSkin === skin.id
                  ? "border-amber-500 bg-amber-50 shadow-md scale-[1.02]"
                  : "border-slate-200 bg-slate-50/70 hover:bg-white"
              }`}
              onClick={() => {
                onSelectSkin(skin.id);
                onClose();
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: skin.glowHex }}
                />
                <div>
                  <div className="text-[14px] font-bold text-slate-900">
                    {isVi ? skin.nameVi : skin.nameEn}
                  </div>
                  <div className="text-[13px] text-slate-500">{skin.descriptionVi}</div>
                </div>
              </div>
              {selectedSkin === skin.id && <span className="text-amber-600 font-black text-[16px]">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(SnakeSkinModal);
