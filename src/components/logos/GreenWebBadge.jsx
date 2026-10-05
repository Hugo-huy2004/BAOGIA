import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const GreenWebBadge = () => {
  return (
    <TrustBadgePill
      href="https://www.thegreenwebfoundation.org/green-web-check/?url=https%3A%2F%2Fwww.hugowishpax.studio%2F"
      title="Check the current hosting status with Green Web Foundation"
      ariaLabel="Check the current hosting status with Green Web Foundation in a new tab"
      icon={
        <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400" aria-hidden="true">
          energy_savings_leaf
        </span>
      }
      badgeTitle="Green Web"
      badgeSubtitle="Eco-Friendly"
    />
  );
};

export default GreenWebBadge;
