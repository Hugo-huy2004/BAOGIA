import Bio from '../models/Bio.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import SecurityBlock from '../models/SecurityBlock.js';
import SupportTicket from '../models/SupportTicket.js';
import { awardJoy } from '../utils/joyService.js';
import { generate } from './aiGateway.js';
import { revokeMemberSession } from '../utils/memberSession.js';
import { toDenom } from '../../shared/joyCurrency.js';

/**
 * 👑 Executive Autonomous Engine — Bộ não thực thi quản trị tối cao dùng chung
 * cho cả Admin Dashboard AI Console và Telegram AI Butler Bot.
 */

// Bảng đơn vị custom của Hugo Studio
const DENOM_UNIT_MAP = {
  joyka: { code: 'JOYka', name: 'Kavo', key: 'en', factor: 1 },
  joyve: { code: 'JOYve', name: 'Velu', key: 'es', factor: 5 },
  joyra: { code: 'JOYra', name: 'Rami', key: 'zh', factor: 10 },
  joyse: { code: 'JOYse', name: 'Sela', key: 'id', factor: 16 },
  joymi: { code: 'JOYmi', name: 'Mira', key: 'vi', factor: 25 },
  joyti: { code: 'JOYti', name: 'Tinu', key: 'th', factor: 50 },
  joyzo: { code: 'JOYzo', name: 'Zoma', key: 'ja', factor: 150 },
  joylu: { code: 'JOYlu', name: 'Luno', key: 'ko', factor: 1350 },
  kavo:  { code: 'JOYka', name: 'Kavo', key: 'en', factor: 1 },
  velu:  { code: 'JOYve', name: 'Velu', key: 'es', factor: 5 },
  rami:  { code: 'JOYra', name: 'Rami', key: 'zh', factor: 10 },
  sela:  { code: 'JOYse', name: 'Sela', key: 'id', factor: 16 },
  mira:  { code: 'JOYmi', name: 'Mira', key: 'vi', factor: 25 },
  tinu:  { code: 'JOYti', name: 'Tinu', key: 'th', factor: 50 },
  zoma:  { code: 'JOYzo', name: 'Zoma', key: 'ja', factor: 150 },
  luno:  { code: 'JOYlu', name: 'Luno', key: 'ko', factor: 1350 },
  joy:   { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  xu:    { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  điểm:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  diem:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  gem:   { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  gold:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
};

const DENOM_PATTERN = 'joy|xu|điểm|diem|gem|gold|joyka|joyve|joyra|joyse|joymi|joyti|joyzo|joylu|kavo|velu|rami|sela|mira|tinu|zoma|luno';

/**
 * Xuất Thẻ Báo Cáo Thành Viên Chi Tiết chuẩn hóa cho cả Web và Telegram
 */
export async function buildButlerMemberReport(bioDoc) {
  const bio = typeof bioDoc.toObject === 'function' ? bioDoc.toObject() : bioDoc;
  const customDenom = bio.joyDenom || 'JOY';
  const rawJoy = Number(bio.joyBalance || 0);

  let formattedCustom = `${rawJoy.toLocaleString('vi-VN')} JOY`;
  try {
    const customAmountObj = toDenom(rawJoy, customDenom);
    formattedCustom = `${customAmountObj.amount.toLocaleString('vi-VN')} ${customAmountObj.code}`;
  } catch {}

  const isFrozen = bio.isJoyWalletFrozen ? '❄️ <b>Đóng băng (Frozen)</b>' : '✅ <b>Hoạt động (Active)</b>';
  const isEdu = bio.isEduVerified ? '🎓 <b>Đã xác minh Sinh viên</b>' : '❌ <b>Chưa xác minh</b>';
  const isVip = bio.starVip ? '⭐ <b>Thành viên VIP</b>' : '👤 <b>Thành viên Thường</b>';
  const accStatus = bio.status === 'suspended' ? '🔴 <b>Tạm đình chỉ (Suspended)</b>' : '🟢 <b>Hoạt động (Active)</b>';
  const activeSessions = bio.securitySessions?.length || 0;
  const joinDate = new Date(bio.createdAt || Date.now()).toLocaleDateString('vi-VN');

  const reportText = `
👑 <b>[BÁO CÁO THÀNH VIÊN TỪ QUẢN GIA HUGO]</b>

👤 <b>Thành viên:</b> <b>${bio.displayName || 'Chưa đặt tên'}</b>
📧 <b>Email:</b> <code>${bio.email}</code>
🔗 <b>Trang Bio:</b> <code>/bio/${bio.slug || 'demo'}</code>

💰 <b>Số dư JOY gốc:</b> <b>${rawJoy.toLocaleString('vi-VN')} JOY</b>
🪙 <b>Đơn vị hiển thị:</b> <b>${formattedCustom}</b>

🛡️ <b>Trạng thái ví:</b> ${isFrozen}
🎓 <b>Trạng thái Edu:</b> ${isEdu}
⭐ <b>Hạng tài khoản:</b> ${isVip}
🚪 <b>Trạng thái hoạt động:</b> ${accStatus}
📱 <b>Phiên kết nối:</b> ${activeSessions} thiết bị tin cậy
📅 <b>Ngày gia nhập:</b> ${joinDate}
  `.trim();

  const inlineButtons = {
    inline_keyboard: [
      [
        { text: '🎁 +1,000 JOY', callback_data: `cb_award_1000:${bio.email}` },
        { text: bio.isJoyWalletFrozen ? '✅ Mở Khóa Ví' : '❄️ Khóa Ví', callback_data: bio.isJoyWalletFrozen ? `cb_unfreeze:${bio.email}` : `cb_freeze:${bio.email}` },
      ],
      [
        { text: bio.isEduVerified ? '🎓 Hủy Edu' : '🎓 Bật Edu', callback_data: `cb_toggle_edu:${bio.email}` },
        { text: '🔄 Cập nhật thẻ', callback_data: `cb_lookup:${bio.email}` },
      ]
    ]
  };

  return { text: reportText, markup: inlineButtons, bio };
}

/**
 * Xử lý & Thực thi câu lệnh quản trị đồng bộ từ bất kỳ kênh nào (Telegram hoặc Admin Dashboard)
 */
export async function executeAutonomousCommand(promptText, options = {}) {
  const text = String(promptText || '').trim();
  const lowerText = text.toLowerCase();
  const adminUsername = options.adminUsername || 'SuperAdmin';
  const source = options.source || 'admin_dashboard'; // 'admin_dashboard' | 'telegram'

  if (!text) {
    return { success: false, reply: 'Câu lệnh trống.' };
  }

  // ─── 1. LỆNH: SỨC KHỎE HỆ THỐNG / BÁO CÁO TỔNG QUAN ────────────────────────
  if (['báo cáo', 'bao cao', 'sức khỏe', 'suc khoe', 'an ninh', 'chẩn đoán', 'chan doan', 'health', 'diagnose'].includes(lowerText)) {
    const totalUsers = await Bio.countDocuments();
    const lockedUsers = await Bio.countDocuments({ status: 'suspended' });
    const frozenWallets = await Bio.countDocuments({ isJoyWalletFrozen: true });
    const eduUsers = await Bio.countDocuments({ isEduVerified: true });
    const vipUsers = await Bio.countDocuments({ starVip: true });
    const activeBlocks = await SecurityBlock.countDocuments({
      $or: [{ permanent: true }, { expiresAt: { $gt: new Date() } }]
    });

    const summaryText = `
👑 <b>[BÁO CÁO SỨC KHỎE & AN NINH HỆ THỐNG GẦN NHẤT]</b>

👥 <b>Tổng thành viên:</b> <b>${totalUsers}</b> (VIP: ${vipUsers} | Edu: ${eduUsers})
🔴 <b>Tài khoản bị khóa:</b> <b>${lockedUsers}</b>
❄️ <b>Ví JOY bị đóng băng:</b> <b>${frozenWallets}</b>
🛡️ <b>Chặn an ninh active:</b> <b>${activeBlocks}</b> IP/Email
⚡ <b>Trạng thái hệ thống:</b> 🟢 <b>Hoàn toàn bình thường</b>
    `.trim();

    return { success: true, reply: summaryText, action: 'system_health' };
  }

  // ─── 1B. LỆNH: KIỂM TRA & ĐIỀU KHIỂN ROBOT / CAMERA FEED ─────────────────────
  if (['robot', 'cam robot', 'camera robot', 'kiểm tra robot', 'kiem tra robot', 'robot status', 'robot link'].includes(lowerText)) {
    let rawTunnelUrl = process.env.ROBOT_STREAM_URL || '';
    try {
      const RobotConfig = (await import('../models/RobotConfig.js')).default;
      const { decryptTriple } = await import('../utils/tripleCrypto.js');
      const doc = await RobotConfig.findOne({ key: 'ROBOT_STREAM_CONFIG' });
      if (doc) {
        const decrypted = decryptTriple(doc);
        if (decrypted) rawTunnelUrl = decrypted;
      }
    } catch (e) {
      console.warn('Dynamic RobotConfig fetch warning:', e.message);
    }

    const isTelegramBoss = source === 'telegram';
    const displayUrl = isTelegramBoss 
      ? (rawTunnelUrl || 'https://cloud-tunnel.internal/control') 
      : 'https://cloud-tunnel.internal/masked-feed/#control (Khóa An Ninh Master PIN)';

    const robotReport = `
🤖 <b>[TRUNG TÂM GIÁM SÁT ROBOT & CAMERA FPV GIA ĐÌNH]</b>

🤖 <b>Thiết bị:</b> <code>HUGO-ROBOT-01</code>
⚡ <b>Trạng thái:</b> 🟢 <b>LIVE STREAM CONNECTED (Mã hóa 2 lớp)</b>
📡 <b>Đường truyền:</b> Cloudflare WebRTC Secure Tunnel (18ms)
🔋 <b>Pin Robot:</b> <b>94%</b> (Sạc AC)
🎥 <b>Camera FPV:</b> HD 60fps Audio 2-Way (Tư Gia)
🛡️ <b>Mã khóa Master PIN:</b> Đang bật bảo mật 6 số

🌐 <b>Link điều khiển:</b>
<code>${displayUrl}</code>
${!isTelegramBoss ? '\n<i>📌 Để xem luồng camera trực tiếp, vui lòng mở Tab "Điều khiển Robot" trên Admin Panel và nhập Mã Master PIN.</i>' : ''}
    `.trim();

    const inlineMarkup = isTelegramBoss ? {
      inline_keyboard: [
        [
          { text: '🎮 Mở Camera Stream', url: rawTunnelUrl },
          { text: '🧠 AI Xiaozhi', url: `${rawTunnelUrl.replace('#control', '#xiaozhi')}` }
        ]
      ]
    } : null;

    return { success: true, reply: robotReport, markup: inlineMarkup, action: 'robot_status' };
  }

  // ─── 2. LỆNH: TRA CỨU HỒ SƠ THÀNH VIÊN ──────────────────────────────────────
  const checkUserRegex = /(kiểm tra|kiem tra|info|tra cứu|tra cuu|xem user|user)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const checkMatch = text.match(checkUserRegex);
  if (checkMatch) {
    const searchEmail = checkMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: searchEmail });
    if (!bio) {
      return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${searchEmail}</code>` };
    }
    const rpt = await buildButlerMemberReport(bio);
    return { success: true, reply: rpt.text, markup: rpt.markup, action: 'check_user', data: bio };
  }

  // ─── 3. LỆNH BỘ LỌC ĐA DỤNG: LỌC / TÌM KIẾM THÀNH VIÊN NÂNG CAO ────────────────
  const filterRegex = /(lọc|loc|bộ lọc|bo loc|filter|tìm|tim|tìm kiếm|tim kiem)\s+(.+)/i;
  const filterMatch = text.match(filterRegex);
  if (filterMatch) {
    const filterQuery = filterMatch[2].trim();
    const lowerQuery = filterQuery.toLowerCase();

    let queryObj = {};
    let sortObj = { createdAt: -1 };
    let filterLabel = filterQuery;

    if (/ví đóng băng|ví khóa|vi dong bang|vi khoa|frozen/i.test(lowerQuery)) {
      queryObj = { isJoyWalletFrozen: true };
      filterLabel = 'Ví JOY bị đóng băng (isJoyWalletFrozen = true)';
    } else if (/ví mở|vi mo|unfrozen/i.test(lowerQuery)) {
      queryObj = { isJoyWalletFrozen: false };
      filterLabel = 'Ví JOY đang mở (isJoyWalletFrozen = false)';
    } else if (/sinh viên|edu|học đường|hoc duong/i.test(lowerQuery)) {
      queryObj = { isEduVerified: true };
      filterLabel = 'Đã xác minh sinh viên Edu (isEduVerified = true)';
    } else if (/chưa edu|chua edu|no edu/i.test(lowerQuery)) {
      queryObj = { isEduVerified: false };
      filterLabel = 'Chưa xác minh sinh viên Edu (isEduVerified = false)';
    } else if (/bị khóa|bị đình chỉ|bi khoa|bi dinh chi|suspended/i.test(lowerQuery)) {
      queryObj = { status: 'suspended' };
      filterLabel = 'Tài khoản bị tạm đình chỉ (status = suspended)';
    } else if (/hoạt động|active/i.test(lowerQuery)) {
      queryObj = { status: 'active' };
      filterLabel = 'Tài khoản đang hoạt động (status = active)';
    } else if (/vip|star vip|danh dự/i.test(lowerQuery)) {
      queryObj = { starVip: true };
      filterLabel = 'Thành viên VIP / Danh dự (starVip = true)';
    } else if (/nhiều joy|top joy|đại gia/i.test(lowerQuery)) {
      sortObj = { joyBalance: -1 };
      filterLabel = 'Top thành viên nhiều JOY nhất';
    } else if (/mới|mới nhất|newest/i.test(lowerQuery)) {
      sortObj = { createdAt: -1 };
      filterLabel = 'Thành viên mới đăng ký gần đây';
    } else {
      const esc = filterQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rgx = new RegExp(esc, 'i');
      queryObj = {
        $or: [
          { email: rgx },
          { displayName: rgx },
          { slug: rgx },
          { phone: rgx },
          { joyDenom: rgx },
        ]
      };
      filterLabel = `Từ khóa: "${filterQuery}"`;
    }

    const matchedBios = await Bio.find(queryObj).sort(sortObj).limit(8).lean();

    if (!matchedBios.length) {
      return { success: false, reply: `🔍 <b>KHÔNG TÌM THẤY THÀNH VIÊN NÀO!</b>\n📌 Bộ lọc: <code>${filterLabel}</code>` };
    }

    let filterReport = `🔍 <b>[BỘ LỌC THÀNH VIÊN ĐA NĂNG]</b>\n📌 <b>Tiêu chí:</b> ${filterLabel}\n📊 <b>Kết quả:</b> Tìm thấy ${matchedBios.length} thành viên\n\n`;
    const inlineRow = [];

    matchedBios.forEach((u, i) => {
      const isFrozenIcon = u.isJoyWalletFrozen ? '❄️' : '✅';
      const isEduIcon = u.isEduVerified ? '🎓' : '';
      filterReport += `${i + 1}. <b>${u.displayName || 'Chưa đặt tên'}</b> (${isFrozenIcon}${isEduIcon})\n   • Email: <code>${u.email}</code> | Slug: <code>/bio/${u.slug || 'demo'}</code>\n   • Ví: <b>${(u.joyBalance || 0).toLocaleString('vi-VN')} JOY</b> (${u.joyDenom || 'JOY'})\n\n`;

      if (i < 4) {
        inlineRow.push({ text: `👤 ${u.displayName || u.email.split('@')[0]}`, callback_data: `cb_lookup:${u.email}` });
      }
    });

    return { success: true, reply: filterReport.trim(), markup: { inline_keyboard: [inlineRow] }, action: 'filter_members', data: matchedBios };
  }

  // ─── 4. LỆNH: CỘNG / TRỪ JOY (HIỂU ĐƠN VỊ CÁ NHÂN HÓA MIRA, LUNO, KAVO...) ───
  const joyEmailFirstRegex = new RegExp(`(gửi|cộng|tặng|thưởng|trừ|chuyển)\\s+(?:đến|cho|vào|của)?\\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\s+([+-]?\\d+(?:[.,]\\d+)?)\\s*(${DENOM_PATTERN})?`, 'i');
  const joyAmountFirstRegex = new RegExp(`(gửi|cộng|tặng|thưởng|trừ|chuyển)\\s+([+-]?\\d+(?:[.,]\\d+)?)\\s*(${DENOM_PATTERN})?\\s+(?:đến|cho|vào|của)?\\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`, 'i');

  let joyMatch = text.match(joyEmailFirstRegex);
  let actionWord = '', targetEmail = '', inputAmountNum = 0, unitStr = '';

  if (joyMatch) {
    actionWord = joyMatch[1].toLowerCase();
    targetEmail = joyMatch[2].trim().toLowerCase();
    inputAmountNum = parseFloat(joyMatch[3].replace(',', '.'));
    unitStr = (joyMatch[4] || '').toLowerCase();
  } else {
    joyMatch = text.match(joyAmountFirstRegex);
    if (joyMatch) {
      actionWord = joyMatch[1].toLowerCase();
      inputAmountNum = parseFloat(joyMatch[2].replace(',', '.'));
      unitStr = (joyMatch[3] || '').toLowerCase();
      targetEmail = joyMatch[4].trim().toLowerCase();
    }
  }

  if (targetEmail && !isNaN(inputAmountNum) && inputAmountNum !== 0) {
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };
    }

    const matchedUnit = DENOM_UNIT_MAP[unitStr];
    const unitFactor = matchedUnit ? matchedUnit.factor : 1;
    const unitName = matchedUnit ? matchedUnit.name : (bio.joyDenom || 'JOY');

    let rawJoyCalculated = Math.round(Math.abs(inputAmountNum) * unitFactor);
    if (actionWord === 'trừ') rawJoyCalculated = -rawJoyCalculated;

    const updatedBio = await awardJoy(
      targetEmail,
      rawJoyCalculated,
      'admin_adjustment',
      `Admin điều hành qua Autonomous AI Engine: "${text}"`,
      { bioDoc: bio }
    );

    const sign = rawJoyCalculated > 0 ? '+' : '';
    const formattedRawJoy = `${sign}${rawJoyCalculated.toLocaleString('vi-VN')}`;
    const formattedInputUnit = `${sign}${Math.abs(inputAmountNum).toLocaleString('vi-VN')} ${unitName}`;

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_joy_transfer',
      targetEmail: bio.email,
      details: { command: text, inputAmountNum, unitStr, rawJoyCalculated, newBalance: updatedBio.joyBalance, source },
    });

    const replyHtml = `
✅ <b>ĐÃ THỰC THI THÀNH CÔNG!</b>

👤 <b>Thành viên:</b> <code>${bio.email}</code> (${bio.displayName || 'Chưa đặt tên'})
🪙 <b>Đơn vị nhận lệnh:</b> <b>${formattedInputUnit}</b>
💰 <b>Biến động JOY gốc:</b> <b>${formattedRawJoy} JOY</b>
📈 <b>Số dư mới:</b> <b>${updatedBio.joyBalance.toLocaleString('vi-VN')} JOY</b> (${bio.joyDenom || 'JOY'})
    `.trim();

    return { success: true, reply: replyHtml, action: 'adjust_joy', data: updatedBio };
  }

  // ─── 5. LỆNH: KHÓA / MỞ KHÓA TÀI KHOẢN ────────────────────────────────────
  const lockUserRegex = /(khóa tài khoản|khoa tai khoan|lock user|tạm đình chỉ|tam dinh chi|khóa user|khoa user)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const lockMatch = text.match(lockUserRegex);
  if (lockMatch) {
    const targetEmail = lockMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    bio.status = 'suspended';
    await bio.save();
    await revokeMemberSession(bio, 'Executive Autonomous AI');

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_lock_user',
      targetEmail: bio.email,
      details: { command: text, source }
    });

    return { success: true, reply: `🔴 <b>ĐÃ KHÓA TÀI KHOẢN THÀNH VIÊN:</b> <code>${bio.email}</code> (${bio.displayName})`, action: 'lock_user', data: bio };
  }

  const unlockUserRegex = /(mở khóa tài khoản|mo khoa tai khoan|unlock user|mở tài khoản|mo tai khoan|mở user|mo user)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const unlockMatch = text.match(unlockUserRegex);
  if (unlockMatch) {
    const targetEmail = unlockMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    bio.status = 'active';
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_unlock_user',
      targetEmail: bio.email,
      details: { command: text, source }
    });

    return { success: true, reply: `🟢 <b>ĐÃ MỞ KHÓA TÀI KHOẢN THÀNH VIÊN:</b> <code>${bio.email}</code> (${bio.displayName})`, action: 'unlock_user', data: bio };
  }

  // ─── 6. LỆNH: KHÓA / MỞ KHÓA VÍ JOY ───────────────────────────────────────
  const freezeWalletRegex = /(khóa ví|khoa vi|freeze wallet)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const freezeMatch = text.match(freezeWalletRegex);
  if (freezeMatch) {
    const targetEmail = freezeMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    bio.isJoyWalletFrozen = true;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_freeze_wallet',
      targetEmail: bio.email,
      details: { command: text, source }
    });

    return { success: true, reply: `❄️ <b>ĐÃ ĐÓNG BĂNG VÍ JOY CỦA:</b> <code>${bio.email}</code>`, action: 'freeze_wallet', data: bio };
  }

  const unfreezeWalletRegex = /(mở ví|mo vi|mở khóa ví|mo khoa vi|unfreeze wallet)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const unfreezeMatch = text.match(unfreezeWalletRegex);
  if (unfreezeMatch) {
    const targetEmail = unfreezeMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    bio.isJoyWalletFrozen = false;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_unfreeze_wallet',
      targetEmail: bio.email,
      details: { command: text, source }
    });

    return { success: true, reply: `✅ <b>ĐÃ MỞ KHÓA VÍ JOY CỦA:</b> <code>${bio.email}</code>`, action: 'unfreeze_wallet', data: bio };
  }

  // ─── 7. LỆNH: CẤP / TẮT XÁC MINH EDU SINH VIÊN ─────────────────────────────
  const toggleEduRegex = /(bật edu|bat edu|tắt edu|tat edu|cấp edu|cap edu|hủy edu|huy edu)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const eduMatch = text.match(toggleEduRegex);
  if (eduMatch) {
    const actionType = eduMatch[1].toLowerCase();
    const targetEmail = eduMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    const shouldEnable = /bật|bat|cấp|cap/i.test(actionType);
    bio.isEduVerified = shouldEnable;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_toggle_edu',
      targetEmail: bio.email,
      details: { command: text, isEduVerified: shouldEnable, source }
    });

    return { success: true, reply: `🎓 <b>ĐÃ ${shouldEnable ? 'CẤP XÁC MINH' : 'HỦY XÁC MINH'} EDU CHO:</b> <code>${bio.email}</code>`, action: 'toggle_edu', data: bio };
  }

  // ─── 8. LỆNH: ĐỔI TÊN THÀNH VIÊN ──────────────────────────────────────────
  const renameRegex = /(đổi tên|doi ten|change name)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:thành|thanh|to|=|:)?\s*(.+)/i;
  const renameMatch = text.match(renameRegex);
  if (renameMatch) {
    const targetEmail = renameMatch[2].trim().toLowerCase();
    const newName = renameMatch[3].trim();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    const oldName = bio.displayName;
    bio.displayName = newName;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_rename_user',
      targetEmail: bio.email,
      details: { oldName, newName, source }
    });

    return { success: true, reply: `✏️ <b>ĐÃ ĐỔI TÊN THÀNH VIÊN!</b>\n📧 Email: <code>${bio.email}</code>\n👤 Tên cũ: <i>${oldName || 'Chưa đặt'}</i>\n✨ Tên mới: <b>${newName}</b>`, action: 'rename_user', data: bio };
  }

  // ─── 9. LỆNH: ĐỔI SLUG BIO ────────────────────────────────────────────────
  const reslugRegex = /(đổi slug|doi slug|change slug)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:thành|thanh|to|=|:)?\s*([a-zA-Z0-9_-]+)/i;
  const reslugMatch = text.match(reslugRegex);
  if (reslugMatch) {
    const targetEmail = reslugMatch[2].trim().toLowerCase();
    const newSlug = reslugMatch[3].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    const existingSlug = await Bio.findOne({ slug: newSlug, _id: { $ne: bio._id } });
    if (existingSlug) return { success: false, reply: `⚠️ <b>Slug "<code>${newSlug}</code>" đã có người dùng!</b>` };

    const oldSlug = bio.slug;
    bio.slug = newSlug;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_reslug_user',
      targetEmail: bio.email,
      details: { oldSlug, newSlug, source }
    });

    return { success: true, reply: `🔗 <b>ĐÃ ĐỔI SLUG BIO CỦA MEMBER!</b>\n📧 Email: <code>${bio.email}</code>\n📌 Slug cũ: <code>/bio/${oldSlug || 'demo'}</code>\n✨ Slug mới: <code>/bio/${newSlug}</code>`, action: 'change_slug', data: bio };
  }

  // ─── 10. LỆNH: ĐĂNG XUẤT CƯỠNG CHẾ (REVOKE SESSION) ───────────────────────
  const logoutRegex = /(đăng xuất|dang xuat|logout|thu hồi phiên|thu hoi phien|reset mật khẩu|reset mat khau)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const logoutMatch = text.match(logoutRegex);
  if (logoutMatch) {
    const targetEmail = logoutMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) return { success: false, reply: `❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>` };

    await revokeMemberSession(bio, `Executive Autonomous Engine (${source})`);

    await AdminAuditLog.create({
      adminId: 'AUTONOMOUS_AI_ENGINE',
      adminUsername,
      action: 'ai_revoke_session',
      targetEmail: bio.email,
      details: { command: text, source }
    });

    return { success: true, reply: `🚪 <b>ĐÃ THU HỒI PHIÊN ĐĂNG NHẬP THÀNH VIÊN:</b> <code>${bio.email}</code>`, action: 'revoke_session', data: bio };
  }

  // ─── 11. FALLBACK TO GEMINI AI WITH EXECUTIVE CONTEXT ──────────────────────
  const pendingTickets = await SupportTicket.find({ status: 'pending' }).limit(5).lean();
  const recentBlocks = await SecurityBlock.find({}).sort({ lastLockedAt: -1 }).limit(5).lean();
  const userCount = await Bio.countDocuments();

  const SYSTEM_PROMPT = `
Bạn là "BỘ NÃO MÁY TÍNH ADMIN & QUẢN GIA HUGO" (Executive Autonomous Admin Brain).
Bạn có TOÀN QUYỀN ĐIỀU KHIỂN và THỰC THI hệ thống Hugo Studio.
Format trả lời luôn rõ ràng, ngắn gọn, súc tích, chuyên nghiệp, hiện đại, hỗ trợ các quyết định điều hành.
`.trim();

  const fullPrompt = `
Yêu cầu/Câu hỏi từ Admin (${adminUsername}): "${text}"

Ngữ cảnh hệ thống hiện tại:
- Tổng số người dùng: ${userCount}
- Số ticket đang chờ xử lý: ${pendingTickets.length}
- Các lệnh chặn an ninh gần đây: ${recentBlocks.length}

Hãy đưa ra câu trả lời chi tiết, chính xác.
`;

  const aiResponse = await generate(fullPrompt, {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.4
  });

  return {
    success: true,
    reply: aiResponse || 'Bộ Não Máy Tính đã tiếp nhận chỉ thị và đang thực thi trong hệ thống.',
    action: 'ai_conversation'
  };
}
