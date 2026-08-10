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

// Các badge dưới đây do chính dịch vụ tương ứng yêu cầu chủ site gắn vào, nên
// chúng ở lại. Hai lưu ý khi sửa hoặc thêm mới:
//
//   1. Dùng đúng ảnh/mã nhúng chính thức của họ khi có (DMCA đang làm đúng:
//      ảnh và ID lấy thẳng từ dmca.com). Logo vẽ tay mô phỏng lại nhãn hiệu
//      thường nằm ngoài phạm vi chương trình cho phép, kể cả với tài khoản đã
//      đăng ký — Google G, dấu tick Norton và sao Trustpilot hiện đang là SVG
//      vẽ lại, nên thay bằng asset gốc khi có điều kiện.
//   2. Không thêm dấu chứng nhận mà site chưa thực sự được cấp. Các tuyên bố
//      chưa qua kiểm định (ISO 27001, PCI-DSS, Cloudflare) đã bị loại từ trước
//      vì sai sự thật với một studio cá nhân.
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
