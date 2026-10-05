import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const SSLBadge = () => {
  return (
    <TrustBadgePill
      title="HTTPS transport status; TLS 1.3 encrypted connection"
      ariaLabel="HTTPS transport status; TLS 1.3 encrypted connection"
      statusDot="bg-emerald-500 animate-pulse"
      icon={
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="5" y="10" width="14" height="11" rx="2" fill="#10B981"/>
          <path d="M8 10V7a4 4 0 118 0v3" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="15.5" r="1.5" fill="#FFFFFF"/>
        </svg>
      }
      badgeTitle="HTTPS / TLS"
      badgeSubtitle="Encrypted"
    />
  );
};

export default SSLBadge;
