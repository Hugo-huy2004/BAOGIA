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
        <div className="w-4 h-4 rounded-full bg-[#13C3FF] text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white" aria-hidden="true">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.016 2.935-2.086 2.935-2.086s3.882.269 5.568-2.616c1.688-2.887.804-5.948.804-5.948zm-4.76 4.792c-.672 1.151-1.745 1.168-1.745 1.168V7.327s1.391-.082 2.115.655c.725.738.302 2.417-.37 3.758zm-7.697.587c-2.316 2.196-4.305.617-4.305.617s-.828-.66-1.527-1.46c-.7-1.02-.68-1.921-.68-1.921s.032-1.282 1.341-1.63c1.31-.347 2.052.548 2.052.548s.579-.909 1.947-.643c1.368.267 1.796 1.488 1.796 1.488s.24 1.258-.624 2.158v.843z"/>
          </svg>
        </div>
      }
      badgeTitle="Ko-fi"
      badgeSubtitle="0% Fee Patron"
    />
  );
};

export default KoFiBadge;
