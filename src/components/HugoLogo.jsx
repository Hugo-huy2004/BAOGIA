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
const HugoLogo = ({ className = "text-xl sm:text-2xl", stacked = false }) => {
  const word1 = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" }
  ];
  const word2 = [
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0ea5e9" }
  ];

  const renderWord = (word) => (
    <span className="inline-flex">
      {word.map((item, idx) => (
        <span 
          key={idx} 
          style={{ 
            color: `${item.color}CC`, // 80% opacity for glass transparency
            marginLeft: idx === 0 ? 0 : "-0.02em", // Vừa sát mép, không chồng đè
            textShadow: `
              -2px -2px 4px rgba(255,255,255,0.5), 
              4px 4px 8px rgba(0,0,0,0.5), 
              0 0 20px ${item.color}80
            `,
            WebkitTextStroke: "1px rgba(255,255,255,0.3)"
          }}
          className="relative"
        >
          {item.char}
        </span>
      ))}
    </span>
  );

  return (
    <span className={`we-bare-bears select-none inline-flex justify-center ${stacked ? 'flex-col items-center leading-[0.8]' : 'items-center'} ${className}`}>
      {renderWord(word1)}
      {!stacked && <span className="w-[0.2em] md:w-[0.3em]" />}
      {renderWord(word2)}
    </span>
  );
};

export default HugoLogo;
