import React, { useEffect, useState } from 'react';

const DMCABadge = () => {
  useEffect(() => {
    // Dynamically load the DMCA helper script when component mounts
    const script = document.createElement('script');
    script.src = "https://images.dmca.com/Badges/DMCABadgeHelper.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <a 
      href="https://www.dmca.com/Protection/Status.aspx?ID=aba9f9ae-db80-4fb1-ae26-dd34c9b352e8" 
      title="DMCA.com Protection Status" 
      className="dmca-badge hover:scale-105 transition-transform inline-block"
      target="_blank"
      rel="noreferrer"
    >
      <img 
        src="https://images.dmca.com/Badges/dmca_protected_sml_120n.png?ID=aba9f9ae-db80-4fb1-ae26-dd34c9b352e8"  
        alt="DMCA.com Protection Status" 
        className="h-8 w-auto object-contain drop-shadow-sm"
      />
    </a>
  );
};

export default DMCABadge;
