import React from "react";

export default function AppIconRenderer({
  myIcons,
  isEditMode,
  handleDragStart,
  handleDrop,
  handleAppTouchStart,
  handleAppTouchEnd,
  gradients
}) {
  if (myIcons.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 px-1 text-muted-foreground/90 font-black text-xs uppercase tracking-widest">
        <span className="material-symbols-outlined text-base">apps</span>
        <span>Danh sách Ứng dụng ({myIcons.length})</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
        {myIcons.map((app, index) => {
          const gradient = gradients[app.tint] || gradients.indigo;
          const touchProps = {
            onMouseDown: () => handleAppTouchStart(app),
            onMouseUp: (e) => handleAppTouchEnd(app, e),
            onMouseLeave: () => clearTimeout(window.longPressTimer),
            onTouchStart: () => handleAppTouchStart(app),
            onTouchEnd: (e) => handleAppTouchEnd(app, e),
            draggable: isEditMode,
            onDragStart: (e) => handleDragStart(e, index, "icon"),
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => handleDrop(e, index, "icon"),
          };

          return (
            <div
              key={app.id}
              {...touchProps}
              className={`relative group flex flex-col items-center p-3 rounded-[28px] cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 w-full max-w-[100px] ${
                isEditMode ? "border border-dashed border-primary/45 bg-primary/5 animate-pulse" : ""
              }`}
            >
              {isEditMode && (
                <span className="material-symbols-outlined text-xs text-primary absolute top-0.5 right-1 z-25 bg-background shadow rounded-full p-0.5 font-black">
                  drag_handle
                </span>
              )}

              {/* App Icon */}
              <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br bg-gradient-to-br bg-gradient-to-br bg-gradient-to-br bg-gradient-to-br bg-gradient-to-br bg-gradient-to-br flex items-center justify-center shadow-md relative shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
                {/* Dynamically construct bg class stops inline or by injecting gradient stopping variables */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[16px]`} />
                <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-50 pointer-events-none rounded-[16px] z-10" />
                <span className="material-symbols-outlined text-white text-[32px] z-20" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                {app.badge && (
                  <span className="absolute -top-1.5 -right-1.5 z-30 px-2 py-0.5 text-[9px] font-black tracking-wider bg-destructive text-white rounded-full leading-none shadow-md select-none animate-bounce">
                    {app.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="mt-3 text-xs font-black text-foreground text-center truncate w-full leading-tight drop-shadow-sm">
                {app.title}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
