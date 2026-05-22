import CreativeCommonsBadge from './CreativeCommonsBadge.jsx';
import W3CBadge from './W3CBadge.jsx';
import GoogleSEO100Badge from './GoogleSEO100Badge.jsx';
import GoogleSafeBrowsingBadge from './GoogleSafeBrowsingBadge.jsx';
import DMCABadge from './DMCABadge.jsx';
import LighthouseBestPracticesBadge from './LighthouseBestPracticesBadge.jsx';
import A11yBadge from './A11yBadge.jsx';
import NortonSafeWebBadge from './NortonSafeWebBadge.jsx';

// Export an array of logo components so Footer can render them dynamically
const logos = [
  CreativeCommonsBadge,
  W3CBadge,
  GoogleSEO100Badge,
  GoogleSafeBrowsingBadge,
  NortonSafeWebBadge,
  LighthouseBestPracticesBadge,
  A11yBadge,
  DMCABadge,
];

export default logos;
