import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const CleanArchitectureBadge = () => {
  return (
    <TrustBadgePill
      title="High software engineering standards: Clean Architecture & Modular Circuit Breaker"
      ariaLabel="Clean Architecture & Modular Design"
      icon={
        <span className="material-symbols-outlined text-[16px] text-amber-500" aria-hidden="true">
          layers
        </span>
      }
      badgeTitle="Clean Code"
      badgeSubtitle="Architecture"
    />
  );
};

export default CleanArchitectureBadge;
