import React from 'react';
import TrustBadgePill from './TrustBadgePill';

const W3CBadge = () => {
  return (
    <TrustBadgePill
      href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fwww.hugowishpax.studio%2F"
      title="Check the current markup with the W3C validator"
      ariaLabel="Check the current markup with the W3C validator in a new tab"
      icon={
        <svg viewBox="0 0 512 512" className="w-3.5 h-3.5" aria-hidden="true">
          <path fill="#E34F26" d="M71,460 L30,4 L482,4 L441,460 L256,512 Z" />
          <path fill="#EF652A" d="M256,472 L405,431 L440,37 L256,37 Z" />
          <path fill="#EBEBEB" d="M256,208 L181,208 L176,150 L256,150 L256,94 L114,94 L115,109 L129,265 L256,265 Z M256,355 L255,355 L192,338 L188,293 L132,293 L140,382 L255,414 L256,414 Z" />
          <path fill="#FFFFFF" d="M255,208 L255,265 L325,265 L318,338 L255,355 L255,414 L371,382 L372,372 L385,208 Z M255,94 L255,150 L390,150 L391,138 L395,94 Z" />
        </svg>
      }
      badgeTitle="W3C Valid"
      badgeSubtitle="HTML5 Standard"
    />
  );
};

export default W3CBadge;
