import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const NortonSafeWebBadge = () => {
  return (
    <TrustBadgePill
      href="https://safeweb.norton.com/report/show?url=hugowishpax.studio"
      title="Check the current site status with Norton Safe Web"
      ariaLabel="Check the current site status with Norton Safe Web in a new tab"
      icon={
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#FDB813" />
          <path fill="#000000" d="M10.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" />
        </svg>
      }
      badgeTitle="Norton"
      badgeSubtitle="Safe Web"
    />
  );
};

export default NortonSafeWebBadge;
