import React from 'react';
import TrustBadgePill from './TrustBadgePill';
import { DONATION_CONFIG } from '../../config/donationConfig';

const GitHubSponsorsBadge = () => {
  return (
    <TrustBadgePill
      href={DONATION_CONFIG.githubSponsorsUrl}
      title="Sponsor Hugo on GitHub Sponsors"
      ariaLabel="Sponsor Hugo on GitHub Sponsors in a new tab"
      icon={
        <div className="flex items-center text-rose-500">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      }
      badgeTitle="GitHub Sponsors"
      badgeSubtitle="Open Source"
    />
  );
};

export default GitHubSponsorsBadge;
