import CreativeCommonsBadge from './CreativeCommonsBadge';
import W3CBadge from './W3CBadge';
import GoogleSafeBrowsingBadge from './GoogleSafeBrowsingBadge';
import DMCABadge from './DMCABadge';
import NortonSafeWebBadge from './NortonSafeWebBadge';
import TrustpilotBadge from './TrustpilotBadge';
import PrivacyBadge from './PrivacyBadge';
import VietnamBadge from './VietnamBadge';
import SSLBadge from './SSLBadge';
import GreenWebBadge from './GreenWebBadge';
import GDPRCompliantBadge from './GDPRCompliantBadge';

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
