import React from 'react';
import TrustBadgePill from './TrustBadgePill';
import { DONATION_CONFIG } from '../../config/donationConfig';

const PayPalBadge = () => {
  return (
    <TrustBadgePill
      href={DONATION_CONFIG.paypalUrl}
      title="Donate to Hugo via PayPal (Credit Card & PayPal Wallet)"
      ariaLabel="Donate to Hugo via PayPal in a new tab"
      icon={
        <div className="w-4 h-4 rounded-full bg-[#003087] text-white flex items-center justify-center shrink-0 shadow-sm font-black text-[10px]">
          <span className="text-[#0079C1] font-extrabold italic mr-[-1px]">P</span>
          <span className="text-white font-extrabold italic">P</span>
        </div>
      }
      badgeTitle="PayPal"
      badgeSubtitle="Global Checkout"
    />
  );
};

export default PayPalBadge;
