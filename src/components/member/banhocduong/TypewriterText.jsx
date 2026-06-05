import React, { useState, useEffect, useRef } from "react";

export default function TypewriterText({ text, id, onComplete }) {
  const [displayedText, setDisplayedText] = useState("");
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) {
      setDisplayedText(text);
      return;
    }

    let index = 0;
    setDisplayedText("");
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        const next = text.substring(0, index + 1);
        index++;
        if (index >= text.length) {
          clearInterval(intervalId);
          completedRef.current = true;
          if (onComplete) onComplete();
        }
        return next;
      });
    }, 15);

    return () => clearInterval(intervalId);
  }, [text, id]);

  return <p className="whitespace-pre-wrap font-semibold">{displayedText}</p>;
}
