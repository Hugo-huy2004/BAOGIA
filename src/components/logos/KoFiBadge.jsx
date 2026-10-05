import React from 'react';
import TrustBadgePill from './TrustBadgePill';
import { DONATION_CONFIG } from '../../config/donationConfig';

const KoFiBadge = () => {
  return (
    <TrustBadgePill
      href={DONATION_CONFIG.kofiUrl}
      title="Support Hugo on Ko-fi (0% platform fee)"
      ariaLabel="Support Hugo on Ko-fi in a new tab"
      icon={
        <div className="w-4 h-4 rounded-full bg-[#72a4f2] text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[11px] leading-none">local_cafe</span>
        </div>
      }
      badgeTitle="Ko-fi"
      badgeSubtitle="0% Fee Patron"
    />
  );
};

export default KoFiBadge;
