import React from 'react';
import TrustBadgePill from './TrustBadgePill';
import { DONATION_CONFIG } from '../../config/donationConfig';

const BuyMeACoffeeBadge = () => {
  return (
    <TrustBadgePill
      href={DONATION_CONFIG.buyMeACoffeeUrl}
      title="Support Hugo Wishpax on Buy Me a Coffee"
      ariaLabel="Support Hugo Wishpax on Buy Me a Coffee in a new tab"
      icon={
        <div className="w-4 h-4 rounded-full bg-[#FFDD00] flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-black" aria-hidden="true">
            <path d="M20.216 6.415l-.132-.666c-.119-.597-.387-1.127-.775-1.536-.39-.41-1.002-.638-1.771-.645H4.629c-.77.007-1.382.235-1.77.645-.39.41-.657.94-.776 1.536l-.132.666C1.38 7.026 1 8.243 1 9.531c0 2.228 1.107 4.197 2.805 5.372.482 1.488 1.624 2.668 3.12 3.151L6.16 20.5h11.68l-.765-2.446c1.496-.483 2.638-1.663 3.12-3.151 1.698-1.175 2.805-3.144 2.805-5.372 0-1.288-.38-2.505-.784-3.116zm-2.68 5.742c0 1.947-1.42 3.535-3.23 3.738l.635 2.03h-5.88l.635-2.03c-1.81-.203-3.23-1.79-3.23-3.738V6.075h11.07v6.082z"/>
          </svg>
        </div>
      }
      badgeTitle="Buy Me a Coffee"
      badgeSubtitle="Global Patron"
    />
  );
};

export default BuyMeACoffeeBadge;
