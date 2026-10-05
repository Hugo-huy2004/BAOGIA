import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const VietnamBadge = () => {
  return (
    <TrustBadgePill
      title="Studio identity: Designed and engineered in Vietnam with global standards"
      ariaLabel="Studio identity: Designed and engineered in Vietnam"
      icon={
        <div className="flex items-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 rounded-[3px] shadow-sm overflow-hidden" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="24" height="24" fill="#DA251D"/>
            <path d="M12 4.5l2.3 7h7.2l-5.8 4.2 2.2 7-5.9-4.3-5.9 4.3 2.2-7-5.8-4.2h7.2z" fill="#FFFF00"/>
          </svg>
        </div>
      }
      badgeTitle="Vietnam"
      badgeSubtitle="Tech Crafted"
    />
  );
};

export default VietnamBadge;
