import React from "react";
import StandaloneInstallButton from "../ui/StandaloneInstallButton";

export default function SubUtilityHeader({ title, icon, colorClass, onBack, appId }) {
  return (
    <div className="sticky top-0 z-40 bg-card/80 dark:bg-card/85 backdrop-blur-xl py-2.5 px-2 flex items-center gap-2 border-b border-border/50 mb-6">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-0.5 pl-1 pr-2.5 py-1.5 rounded-full text-primary hover:bg-primary/10 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
          <span className="text-sm font-medium">Quay lại</span>
        </button>
      ) : <span className="w-1" />}

      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className={`material-symbols-outlined text-lg shrink-0 ${colorClass}`}>{icon}</span>
        <h3 className="text-[15px] font-semibold text-foreground truncate">{title}</h3>
      </div>

      {/* Smart Standalone App Download Button */}
      <StandaloneInstallButton appTitle={title} appId={appId} />
    </div>
  );
}
