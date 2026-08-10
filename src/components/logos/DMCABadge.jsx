import { useEffect } from 'react';

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
      title="Check the current DMCA.com status"
      aria-label="Check the current DMCA.com status in a new tab"
      className="dmca-badge hover:scale-105 transition-transform inline-block"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img 
        src="https://images.dmca.com/Badges/dmca_protected_sml_120n.png?ID=aba9f9ae-db80-4fb1-ae26-dd34c9b352e8"  
        alt="Check DMCA.com status"
        loading="lazy"
        decoding="async"
        className="h-8 w-auto object-contain drop-shadow-sm"
      />
    </a>
  );
};

export default DMCABadge;
