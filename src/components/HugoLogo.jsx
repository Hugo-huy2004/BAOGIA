const GEMINI_GRADIENT =
  "linear-gradient(90deg, #2678ff 0%, #0797ff 28%, #7359e8 55%, #d45aa3 78%, #f0445e 100%)";

export const RenderColoredText = ({ text }) => {
  if (!text || typeof text !== "string") return null;
  return (
    <span
      style={{
        backgroundImage: GEMINI_GRADIENT,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {text}
    </span>
  );
};

const HugoLogo = ({ className = "text-xl sm:text-2xl", stacked = false }) => {
  const renderWord = (word) => (
    <span
      className="inline-flex bg-clip-text text-transparent"
      style={{
        backgroundImage: GEMINI_GRADIENT,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }}
    >
      {word}
    </span>
  );

  return (
    <span className={`we-bare-bears select-none inline-flex justify-center ${stacked ? 'flex-col items-center leading-[0.8]' : 'items-center'} ${className}`}>
      {renderWord("Hugo")}
      {!stacked && <span className="w-[0.2em] md:w-[0.3em]" />}
      {renderWord("Studio")}
    </span>
  );
};

export default HugoLogo;
