import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation, useSpring, useTransform } from "framer-motion";
import { useJoyStore } from "../../stores/joyStore";

const SIZES = {
  sm: { coin: "w-4 h-4", coinText: "text-[5px]", label: "text-[10px]" },
  md: { coin: "w-6 h-6", coinText: "text-[6px]", label: "text-xs" },
  lg: { coin: "w-9 h-9", coinText: "text-[8px]", label: "text-base" },
};

/**
 * Reusable JOY coin badge — a circular gold coin with "Joy" centered,
 * followed by the numeric amount. Used everywhere a spendable JOY balance
 * is shown (member header, Services tab, store, admin tools).
 * 
 * If `amount` is undefined, it automatically subscribes to useJoyStore.
 */
export default function JoyCoinBadge({ amount: propAmount, size = "md", className = "" }) {
  const s = SIZES[size] || SIZES.md;
  const storeBalance = useJoyStore(state => state.balance);
  const actualAmount = propAmount !== undefined ? propAmount : storeBalance;

  const [displayAmount, setDisplayAmount] = useState(actualAmount);
  const prevAmountRef = useRef(actualAmount);
  const controls = useAnimation();

  // Color flash state
  const [flashColor, setFlashColor] = useState("text-foreground");

  // Number animation spring
  const spring = useSpring(actualAmount, { bounce: 0, duration: 800 });
  
  useEffect(() => {
    if (actualAmount !== prevAmountRef.current) {
      const diff = actualAmount - prevAmountRef.current;
      
      // Flash color
      if (diff > 0) {
        setFlashColor("text-emerald-500");
      } else if (diff < 0) {
        setFlashColor("text-rose-500");
      }

      // Bounce the coin icon
      controls.start({
        scale: [1, 1.3, 1],
        rotate: [0, 15, -15, 0],
        transition: { duration: 0.4 }
      });

      // Animate number
      spring.set(actualAmount);

      // Reset flash color after 1s
      const timer = setTimeout(() => {
        setFlashColor("text-foreground");
      }, 1000);

      prevAmountRef.current = actualAmount;

      return () => clearTimeout(timer);
    }
  }, [actualAmount, controls, spring]);

  // Update displayAmount when spring changes
  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayAmount(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <motion.span
        animate={controls}
        className={`${s.coin} rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.3)] relative overflow-hidden`}
      >
        <span className="absolute inset-0 bg-white/20 blur-[1px] rounded-full translate-y-[-30%]"></span>
        <span className={`${s.coinText} font-black text-amber-900 leading-none relative z-10`}>Joy</span>
      </motion.span>
      {actualAmount != null && (
        <span className={`${s.label} font-mono font-bold transition-colors duration-300 ${flashColor}`}>
          {Number(displayAmount).toLocaleString("vi-VN")} <span className="text-[0.8em] text-muted-foreground ml-0.5">JOY</span>
        </span>
      )}
    </span>
  );
}
