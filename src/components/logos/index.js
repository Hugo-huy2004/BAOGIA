import SSLBadge from './SSLBadge';
import WebAuthnBadge from './WebAuthnBadge';
import BuyMeACoffeeBadge from './BuyMeACoffeeBadge';
import GitHubSponsorsBadge from './GitHubSponsorsBadge';
import GDPRCompliantBadge from './GDPRCompliantBadge';
import CleanArchitectureBadge from './CleanArchitectureBadge';
import GoogleSafeBrowsingBadge from './GoogleSafeBrowsingBadge';
import NortonSafeWebBadge from './NortonSafeWebBadge';
import DMCABadge from './DMCABadge';
import PrivacyBadge from './PrivacyBadge';
import W3CBadge from './W3CBadge';
import CreativeCommonsBadge from './CreativeCommonsBadge';
import GreenWebBadge from './GreenWebBadge';
import TrustpilotBadge from './TrustpilotBadge';
import VietnamBadge from './VietnamBadge';

// Danh mục các Trust & Credibility Badges của Hugo Wishpax Studio.
// Toàn bộ badge đã được chuẩn hoá với TrustBadgePill:
//   - Chiều cao cố định 32px (h-8), không lệch marquee khi lướt.
//   - Toàn bộ vector SVG inline nội bộ (Zero 3rd-party CDN lag / vỡ ảnh).
//   - Tích hợp tài trợ toàn cầu: Buy Me a Coffee & GitHub Sponsors.
const logos = [
  SSLBadge,
  WebAuthnBadge,
  BuyMeACoffeeBadge,
  GitHubSponsorsBadge,
  GDPRCompliantBadge,
  CleanArchitectureBadge,
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
