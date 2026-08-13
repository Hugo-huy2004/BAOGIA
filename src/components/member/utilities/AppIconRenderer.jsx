import { prefetchChunk } from "../../../utils/chunkPrefetcher";
import UtilityAppIcon from "./UtilityAppIcon";

export default function AppIconRenderer({
  myIcons,
  isEditMode,
  handleDragStart,
  handleDrop,
  handleAppTouchStart,
  handleAppTouchMove,
  handleAppTouchCancel,
  handleAppTouchEnd,
  gradients,
  onAppHover
}) {
  if (myIcons.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      {/* Continuous iOS grid: installed apps never disappear behind pagination. */}
      <div className="grid grid-cols-4 gap-y-2.5 gap-x-1.5 sm:gap-x-4 justify-items-center min-h-[auto]">
        {myIcons.map((app, index) => {
          const gradient = gradients[app.tint] || gradients.indigo;

          const touchProps = {
            onMouseEnter: () => {
              prefetchChunk(app.id);
              onAppHover?.(app.id);
            },
            onPointerDown: (event) => {
              prefetchChunk(app.id);
              handleAppTouchStart(app, event);
            },
            onPointerMove: handleAppTouchMove,
            onPointerUp: (event) => handleAppTouchEnd(app, event),
            onPointerCancel: handleAppTouchCancel,
            onPointerLeave: (event) => {
              if (event.pointerType === "mouse") handleAppTouchCancel();
            },
            draggable: isEditMode,
            onDragStart: (e) => handleDragStart(e, index, "icon"),
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => handleDrop(e, index, "icon"),
          };

          return (
            <div
              key={app.id}
              {...touchProps}
              className={`relative group flex flex-col items-center p-1 rounded-[24px] cursor-pointer touch-pan-y select-none transition-transform duration-300 hover:-translate-y-1.5 active:scale-95 w-full max-w-[84px] ${
                isEditMode ? "border border-dashed border-primary/45 bg-primary/5 animate-pulse" : ""
              }`}
            >
              {isEditMode && (
                <span className="material-symbols-outlined text-[10px] text-primary absolute -top-1 -right-1 z-25 bg-background shadow rounded-full p-0.5 font-black">
                  drag_handle
                </span>
              )}

              {/* iOS Squircle App Icon */}
              <UtilityAppIcon
                app={app}
                gradient={gradient}
                size="large"
                className="transition-transform duration-200 group-hover:scale-105"
              />

              {/* App Label Underneath */}
              {/* Two lines max: a brand such as HugoHelpdesk cannot shrink, and
                  Thai/Spanish names run longer than their English source. */}
              <h3 className="mt-2 text-[12px] font-medium text-foreground text-center w-full leading-tight px-0.5 line-clamp-2 min-h-[2.4em] break-words">
                {app.title}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
