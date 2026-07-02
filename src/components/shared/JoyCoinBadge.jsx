import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation, useSpring, useTransform } from "framer-motion";
import { useJoyStore } from "../../stores/joyStore";

const SIZES = {
  sm: { coin: "w-4 h-4", coinText: "text-[5px]", label: "text-[10px]" },
  md: { coin: "w-6 h-6", coinText: "text-[6px]", label: "text-xs" },
  lg: { coin: "w-9 h-9", coinText: "text-[8px]", label: "text-base" },
};

/**
 * Reusable JOY coin badge — a 3D-shaded gold coin with "JOY" embossed on it,
 * followed by the numeric amount. Used everywhere a spendable JOY balance
 * is shown (member header, Services tab, store, admin tools).
 *
 * If `amount` is undefined, it automatically subscribes to useJoyStore.
 * Pass `hideAmount` to render just the coin (e.g. next to a number that's
 * already displayed elsewhere, like the JOY Wallet hero card).
 */
export default function JoyCoinBadge({ amount: propAmount, size = "md", className = "", hideAmount = false }) {
  const s = SIZES[size] || SIZES.md;
  const storeBalance = useJoyStore(state => state.balance);
  const actualAmount = (propAmount !== undefined ? propAmount : storeBalance) ?? 0;

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
        className={`${s.coin} rounded-full shrink-0 relative overflow-hidden`}
        style={{
          background: "radial-gradient(circle at 35% 22%, #ffffff 0%, #ffdf00 25%, #ffb800 65%, #d97706 100%)",
          boxShadow: "inset 0 -3px 5px rgba(180,83,9,.55), inset 0 3px 4px rgba(255,255,255,.85), 0 2px 6px rgba(255,184,0,.45)",
          border: "1px solid #d97706"
        }}
      >
        {/* Top sheen — the highlight that sells the spherical/3D read */}
        <span className="absolute top-[8%] left-[18%] w-[55%] h-[40%] rounded-full bg-white/70 blur-[1.5px]" />
        {/* Bottom rim reflection */}
        <span className="absolute bottom-[8%] right-[15%] w-[45%] h-[25%] rounded-full bg-[#fef08a]/40 blur-[2px]" />
        <span
          className={`${s.coinText} font-black text-amber-900 leading-none relative z-10 flex items-center justify-center w-full h-full`}
          style={{ textShadow: "0 1px 0 rgba(255,255,255,.75), 0 -1px 0 rgba(180,83,9,.55)" }}
        >
          JOY
        </span>
      </motion.span>
      {!hideAmount && (
        <span className={`${s.label} font-mono font-bold transition-colors duration-300 ${flashColor}`}>
          {Number(displayAmount).toLocaleString("vi-VN")} <span className="text-[0.8em] text-muted-foreground ml-0.5">JOY</span>
        </span>
      )}
    </span>
  );
}
