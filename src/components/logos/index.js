import CreativeCommonsBadge from './CreativeCommonsBadge.jsx';
import W3CBadge from './W3CBadge.jsx';
import GoogleSafeBrowsingBadge from './GoogleSafeBrowsingBadge.jsx';
import DMCABadge from './DMCABadge.jsx';
import NortonSafeWebBadge from './NortonSafeWebBadge.jsx';
import TrustpilotBadge from './TrustpilotBadge.jsx';
import PrivacyBadge from './PrivacyBadge.jsx';
import VietnamBadge from './VietnamBadge.jsx';
import SSLBadge from './SSLBadge.jsx';
import GreenWebBadge from './GreenWebBadge.jsx';
import GDPRCompliantBadge from './GDPRCompliantBadge.jsx';

// Curated trust badges only. A long vanity wall reads as spam and *lowers*
// trust; worse, unaudited certification claims (ISO 27001, PCI-DSS, Cloudflare)
// are misleading for a personal studio and a real credibility/legal risk — so
// they're intentionally dropped. What's kept is verifiable via its own link:
// SSL, GDPR posture, license, W3C validation, Google/Norton safe-reputation,
// DMCA protection, tracking-free (Blacklight), green hosting, Trustpilot reviews.
const logos = [
  SSLBadge,
  GDPRCompliantBadge,
  GoogleSafeBrowsingBadge,
  NortonSafeWebBadge,
  DMCABadge,
  PrivacyBadge,
  W3CBadge,
  CreativeCommonsBadge,
  GreenWebBadge,
  TrustpilotBadge,
  VietnamBadge,
];

export default logos;
