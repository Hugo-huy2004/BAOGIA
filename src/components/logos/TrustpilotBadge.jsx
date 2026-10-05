import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const TrustpilotBadge = () => {
  return (
    <TrustBadgePill
      href="https://www.trustpilot.com/review/hugowishpax.studio"
      title="Review us on Trustpilot"
      ariaLabel="Review us on Trustpilot in a new tab"
      icon={
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
          <path fill="#00B67A" d="M12 0l3.7 7.5 8.3 1.2-6 5.8 1.4 8.2-7.4-3.9-7.4 3.9 1.4-8.2-6-5.8 8.3-1.2z" />
        </svg>
      }
      badgeTitle="Trustpilot"
      badgeSubtitle="Verified"
    />
  );
};

export default TrustpilotBadge;
