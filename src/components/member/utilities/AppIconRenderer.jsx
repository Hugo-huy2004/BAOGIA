import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prefetchChunk } from "../../../utils/chunkPrefetcher";

const APPS_PER_PAGE = 16; // Strict 4x4 iOS Grid

export default function AppIconRenderer({
  myIcons,
  isEditMode,
  handleDragStart,
  handleDrop,
  handleAppTouchStart,
  handleAppTouchEnd,
  gradients,
  onAppHover
}) {
  const [currentPage, setCurrentPage] = useState(0);

  if (myIcons.length === 0) return null;

  // Split installed icons into pages of 16 apps each
  const totalPages = Math.ceil(myIcons.length / APPS_PER_PAGE);
  const currentIcons = myIcons.slice(
    currentPage * APPS_PER_PAGE,
    (currentPage + 1) * APPS_PER_PAGE
  );

  return (
    <div className="space-y-4 text-left">
      {/* 4x4 App Grid (16 apps max per page) */}
      <div className="grid grid-cols-4 gap-y-2.5 gap-x-1.5 sm:gap-x-4 justify-items-center min-h-[auto]">
        {currentIcons.map((app, index) => {
          const globalIndex = currentPage * APPS_PER_PAGE + index;
          const gradient = gradients[app.tint] || gradients.indigo;

          const touchProps = {
            onMouseEnter: () => {
              prefetchChunk(app.id);
              onAppHover?.(app.id);
            },
            onMouseDown: () => handleAppTouchStart(app),
            onMouseUp: (e) => handleAppTouchEnd(app, e),
            onMouseLeave: () => clearTimeout(window.longPressTimer),
            onTouchStart: () => {
              prefetchChunk(app.id);
              handleAppTouchStart(app);
            },
            onTouchEnd: (e) => handleAppTouchEnd(app, e),
            draggable: isEditMode,
            onDragStart: (e) => handleDragStart(e, globalIndex, "icon"),
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => handleDrop(e, globalIndex, "icon"),
          };

          return (
            <div
              key={app.id}
              {...touchProps}
              className={`relative group flex flex-col items-center p-1 rounded-[24px] cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 active:scale-95 w-full max-w-[84px] ${
                isEditMode ? "border border-dashed border-primary/45 bg-primary/5 animate-pulse" : ""
              }`}
            >
              {isEditMode && (
                <span className="material-symbols-outlined text-[10px] text-primary absolute -top-1 -right-1 z-25 bg-background shadow rounded-full p-0.5 font-black">
                  drag_handle
                </span>
              )}

              {/* iOS Squircle App Icon */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm relative shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                <span
                  className="material-symbols-outlined text-white text-[28px] sm:text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {app.icon}
                </span>
              </div>

              {/* App Label Underneath */}
              <h3 className="mt-2 text-[12px] font-medium text-foreground text-center truncate w-full leading-tight px-0.5">
                {app.title}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Pagination Page Dots (for >16 Apps) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="p-1 text-muted-foreground disabled:opacity-30 hover:text-foreground transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentPage === idx
                    ? "w-5 bg-foreground shadow-sm"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>

          <button
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            className="p-1 text-muted-foreground disabled:opacity-30 hover:text-foreground transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
