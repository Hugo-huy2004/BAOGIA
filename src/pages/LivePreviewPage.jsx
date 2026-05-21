import React, { useState, useEffect } from "react";
import DefaultTheme from "../components/themes/DefaultTheme";
import BrutalismTheme from "../components/themes/BrutalismTheme";
import FlatTheme from "../components/themes/FlatTheme";

export default function LivePreviewPage() {
  const [bio, setBio] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "UPDATE_PREVIEW") {
        setBio(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);

    // Let the parent know we're ready to receive data
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (!bio) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
        <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const template = bio?.theme?.template || "default";

  if (template === "flat") {
    return <FlatTheme bio={bio} isPreview={true} />;
  }

  if (template === "brutalism") {
    return <BrutalismTheme bio={bio} isPreview={true} />;
  }

  return <DefaultTheme bio={bio} isPreview={true} />;
}
