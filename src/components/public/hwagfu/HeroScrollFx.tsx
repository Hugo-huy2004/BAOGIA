"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "./utils";

/**
 * Apple's hero exit: as the page scrolls past, the hero drifts down slower
 * than the page, shrinks a touch and fades, so the next section appears to
 * slide over it.
 *
 * Every value is the identity at scroll 0, so the server-rendered hero is
 * fully visible before any JavaScript runs — the headline is the LCP element.
 * The outer box is measured and never transformed; only the inner one moves.
 */
export default function HeroScrollFx({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLElement | null>(typeof document === "undefined" ? null : document.getElementById("root"));
  const { scrollYProgress } = useScroll({
    container: scrollRootRef,
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 7]);
  const z = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const filter = useTransform(scrollYProgress, [0, 0.75], ["blur(0px)", "blur(10px)"]);

  return (
    <div ref={ref} className="[perspective:1200px] transform-gpu">
      <motion.div
        style={{ opacity, scale, y, rotateX, z, filter, transformStyle: "preserve-3d" }}
        className={cn("scroll-fx", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
