import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourStore, TOUR_DEFINITIONS } from '../stores/tourStore';
import confetti from 'canvas-confetti';

export default function TourSystem() {
  const { activeTour, stepIndex, nextStep, prevStep, exitTour } = useTourStore();
  const [rect, setRect] = useState(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const [elementFound, setElementFound] = useState(false);
  
  const steps = activeTour ? TOUR_DEFINITIONS[activeTour] : [];
  const activeStep = steps[stepIndex];

  // Recalculate target element position
  const updateRect = () => {
    if (!activeStep) return;
    
    // Find first matching visible selector
    const selectors = activeStep.selector.split(',');
    let el = null;
    for (const sel of selectors) {
      const found = document.querySelector(sel.trim());
      if (found && found.getBoundingClientRect().width > 0) {
        el = found;
        break;
      }
    }

    if (el) {
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
      setElementFound(true);
    } else {
      setElementFound(false);
    }
    setVw(window.innerWidth);
    setVh(window.innerHeight);
  };

  // Keep rect in sync with scrolling, sizing, and DOM shifts
  useEffect(() => {
    if (!activeStep) {
      setRect(null);
      return;
    }

    updateRect();

    // Poll to handle dynamic tab switches, loading states, and animations
    const interval = setInterval(updateRect, 150);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [activeStep, stepIndex]);

  // Confetti on graduation
  useEffect(() => {
    if (activeTour && stepIndex === steps.length - 1) {
      // Trigger small confetti upon reaching the last step
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
    }
  }, [stepIndex, activeTour]);

  if (!activeTour || !activeStep) return null;

  // Render variables
  const r = 8; // rounded border radius for spotlight
  const pad = 6; // padding around highlighted element
  const x = rect ? rect.left - pad : 0;
  const y = rect ? rect.top - pad : 0;
  const w = rect ? rect.width + pad * 2 : 0;
  const h = rect ? rect.height + pad * 2 : 0;

  // Custom rounded rectangle cutout path in full-screen SVG overlay
  const maskPath = rect
    ? `M 0 0 h ${vw} v ${vh} h -${vw} z M ${x + r} ${y} h ${w - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${w - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${h - 2 * r} a ${r} ${r} 0 0 1 ${r} -${r} z`
    : `M 0 0 h ${vw} v ${vh} h -${vw} z`;

  // Calculate popover positioning
  const isMobile = vw < 768;
  const placement = isMobile ? 'bottom' : activeStep.placement;
  const popoverWidth = 320;

  let popoverStyle = {};
  if (rect) {
    if (placement === 'bottom') {
      popoverStyle = {
        top: y + h + 12 + window.scrollY,
        left: Math.max(12, Math.min(vw - popoverWidth - 12, x + w / 2 - popoverWidth / 2))
      };
    } else if (placement === 'top') {
      popoverStyle = {
        top: Math.max(12, y - 180 + window.scrollY),
        left: Math.max(12, Math.min(vw - popoverWidth - 12, x + w / 2 - popoverWidth / 2))
      };
    } else if (placement === 'right') {
      popoverStyle = {
        top: Math.max(12, y + h / 2 - 80 + window.scrollY),
        left: Math.min(vw - popoverWidth - 12, x + w + 12)
      };
    } else if (placement === 'left') {
      popoverStyle = {
        top: Math.max(12, y + h / 2 - 80 + window.scrollY),
        left: Math.max(12, x - popoverWidth - 12)
      };
    }
  } else {
    // Center fallback if element not found yet
    popoverStyle = {
      top: vh / 2 - 90 + window.scrollY,
      left: vw / 2 - popoverWidth / 2
    };
  }

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="absolute inset-0 z-[99999] pointer-events-none">
      {/* 1. Spotlight Overlay Mask */}
      <svg className="fixed inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 99998 }}>
        <motion.path
          fill="rgba(0, 0, 0, 0.65)"
          fillRule="evenodd"
          animate={{ d: maskPath }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        />
      </svg>

      {/* 2. Target Click Area Blocker (intercepts clicks outside spotlight) */}
      {rect && (
        <div 
          className="absolute pointer-events-auto bg-transparent border-2 border-indigo-500/80 rounded-xl"
          style={{
            top: y + window.scrollY,
            left: x + window.scrollX,
            width: w,
            height: h,
            zIndex: 99999,
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}
        />
      )}

      {/* 3. Tooltip Popover Box */}
      <div 
        className="absolute pointer-events-auto transition-all duration-300"
        style={{
          ...popoverStyle,
          width: popoverWidth,
          zIndex: 100000
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white/95 dark:bg-card/95 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl text-left"
        >
          {/* Header Progress */}
          <div className="flex justify-between items-center mb-2">
            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-indigo-550/10 text-indigo-500 dark:text-indigo-400">
              Hướng dẫn · {stepIndex + 1}/{steps.length}
            </span>
            <button 
              type="button" 
              onClick={() => exitTour(false)}
              className="text-[9px] font-black uppercase text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              Bỏ qua
            </button>
          </div>

          {/* Description */}
          <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-1">
            {activeStep.title}
          </h3>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed mb-4">
            {activeStep.content}
          </p>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50">
            <button
              type="button"
              onClick={prevStep}
              disabled={stepIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-zinc-550/5 active:scale-95 transition-all"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#0071ed] text-white text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
            >
              {isLastStep ? 'Hoàn thành' : 'Tiếp tục'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
