import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const DMCABadge = () => {
  return (
    <TrustBadgePill
      href="https://www.dmca.com/Protection/Status.aspx?ID=aba9f9ae-db80-4fb1-ae26-dd34c9b352e8"
      title="Check the current DMCA.com status"
      ariaLabel="Check the current DMCA.com status in a new tab"
      icon={
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-blue-600 dark:fill-blue-400" aria-hidden="true">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/>
          </svg>
        </div>
      }
      badgeTitle="DMCA"
      badgeSubtitle="Protected"
    />
  );
};

export default DMCABadge;
