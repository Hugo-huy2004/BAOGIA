import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const PrivacyBadge = () => {
  return (
    <TrustBadgePill
      href="https://themarkup.org/blacklight?url=hugowishpax.studio"
      title="Check the site's privacy signals with Blacklight"
      ariaLabel="Check the site's privacy signals with Blacklight in a new tab"
      icon={
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="#3B82F6"/>
          <path d="M10 16.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" fill="#FFFFFF"/>
        </svg>
      }
      badgeTitle="Blacklight"
      badgeSubtitle="Zero Trackers"
    />
  );
};

export default PrivacyBadge;
