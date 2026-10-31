import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const CreativeCommonsBadge = () => {
  return (
    <TrustBadgePill
      href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
      title="View the owner's CC BY-NC-ND 4.0 content policy"
      ariaLabel="View the owner's CC BY-NC-ND 4.0 content policy in a new tab"
      icon={
        <div className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300">
          {/* CC Circle */}
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-6.5h1.5c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1H9.5c-.83 0-1.5.67-1.5 1.5v2c0 .83.67 1.5 1.5 1.5H11c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1H9.5v-1zm5 0h1.5c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1H14.5c-.83 0-1.5.67-1.5 1.5v2c0 .83.67 1.5 1.5 1.5H16c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1H14.5v-1z"/>
          </svg>
        </div>
      }
      badgeTitle="Creative Commons"
      badgeSubtitle="BY-NC-ND 4.0"
    />
  );
};

export default CreativeCommonsBadge;
