import React from "react";

const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

export const RenderColoredText = ({ text }) => {
  if (!text || typeof text !== "string") return null;
  return (
    <>
      {text.split("").map((char, idx) => (
        <span key={idx} style={{ color: BRAND_COLORS[idx % BRAND_COLORS.length] }}>
          {char}
        </span>
      ))}
    </>
  );
};

// Hugo Studio Brand Logo component to match styling exactly
const HugoLogo = ({ className = "text-xl sm:text-2xl" }) => {
  const chars = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0ea5e9" }
  ];
  return (
    <span className={`we-bare-bears select-none ${className}`}>
      {chars.map((item, idx) => (
        <span key={idx} style={{ color: item.color }}>
          {item.char}
        </span>
      ))}
    </span>
  );
};

export default HugoLogo;
