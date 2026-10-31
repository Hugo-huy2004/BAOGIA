import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const WebAuthnBadge = () => {
  return (
    <TrustBadgePill
      title="FIDO2 / WebAuthn Biometric Security: TouchID, FaceID & Passkeys supported"
      ariaLabel="FIDO2 WebAuthn biometric security"
      statusDot="bg-blue-500 animate-pulse"
      icon={
        <span className="material-symbols-outlined text-[16px] text-blue-500" aria-hidden="true">
          fingerprint
        </span>
      }
      badgeTitle="WebAuthn"
      badgeSubtitle="Biometric Ready"
    />
  );
};

export default WebAuthnBadge;
