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
      index++;
      const next = text.substring(0, index);
      setDisplayedText(next);

      // Auto-scroll the parent container down to keep up with typing
      setTimeout(() => {
        const scrollContainer = document.getElementById("chat-messages-container");
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 0);

      if (index >= text.length) {
        clearInterval(intervalId);
        completedRef.current = true;
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 0);
        }
      }
    }, 15);

    return () => clearInterval(intervalId);
  }, [text, id]);

  const formatMessageText = (txt) => {
    if (!txt) return "";
    const parts = txt.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-[#0071e3] dark:text-emerald-405">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return <p className="whitespace-pre-wrap font-semibold">{formatMessageText(displayedText)}</p>;
}
