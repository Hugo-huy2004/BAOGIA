import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const GDPRCompliantBadge = () => {
  return (
    <TrustBadgePill
      title="Privacy posture and data-protection policy"
      ariaLabel="Privacy posture and data-protection policy"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
        </svg>
      }
      badgeTitle="GDPR & Privacy"
      badgeSubtitle="Compliant"
    />
  );
};

export default GDPRCompliantBadge;
