import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";

export default function GlobalAdBanner() {
  const { data } = useData();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (data?.advertisement?.isActive && data?.advertisement?.imageUrl) {
      const isDismissed = sessionStorage.getItem("adDismissed_" + data.advertisement.imageUrl);
      if (!isDismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [data?.advertisement]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("adDismissed_" + data.advertisement.imageUrl, "true");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative max-w-md w-full mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden bg-white/5 border border-white/20 transform transition-transform duration-500 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-md shadow-lg"
          title="Đóng quảng cáo"
        >
          <span className="material-symbols-outlined text-sm font-bold">close</span>
        </button>

        {data.advertisement.linkUrl ? (
          <a 
            href={data.advertisement.linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className="block w-full h-full"
          >
            <img 
              src={data.advertisement.imageUrl} 
              alt="Advertisement" 
              className="w-full h-auto object-cover max-h-[80vh] hover:opacity-95 transition-opacity"
            />
          </a>
        ) : (
          <img 
            src={data.advertisement.imageUrl} 
            alt="Advertisement" 
            className="w-full h-auto object-cover max-h-[80vh]"
          />
        )}
      </div>
    </div>
  );
}
