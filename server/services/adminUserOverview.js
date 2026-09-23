import crypto from 'node:crypto';

/**
 * Hồ sơ 360° của MỘT người dùng — gom mọi thứ họ để lại trên hệ thống.
 *
 * Trước đây `/admin/users/:id/details` chỉ đọc 5 nguồn (Bio, JoyLedger,
 * SupportTicket, đếm SecurityEvent, UtilityOrder) trong khi phía Member có 18
 * app và hơn 60 model. Hậu quả: admin không nhìn thấy lịch hẹn dịch vụ, nợ JOY
 * Gối Đầu, đơn kháng nghị mở khoá, giao dịch bị giữ — toàn những thứ CẦN người
 * duyệt mới đi tiếp được.
 *
 * KHOÁ TRA CỨU KHÔNG ĐỒNG NHẤT, đây là chỗ dễ sai nhất:
 *   · phần lớn model khoá theo `email`
 *   · `JoyDefaultRecord` khoá theo `emailHash` (SHA-256) — sổ đen cố ý không
 *     lưu email thô
 *   · `PendingTransfer` có `fromEmail`/`toEmail`, phải tra cả hai chiều
 *   · `Friendship` có `requesterEmail`/`recipientEmail`
 *   · `LearningEvidence` khoá theo `ownerMemberId`, KHÔNG phải email
 * Tra nhầm khoá thì truy vấn trả về rỗng mà không báo lỗi — admin tưởng người
 * dùng sạch sẽ trong khi thật ra là mình hỏi sai câu.
 *
 * Mỗi nguồn chạy độc lập: một model hỏng hoặc chưa có collection thì phần đó
 * trả rỗng kèm `error`, các phần còn lại vẫn hiện. Một màn hình quản trị chết
 * trắng vì một truy vấn lỗi là vô dụng.
 */

const emailHashOf = (email) =>
  crypto.createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');

/** Nạp một model theo tên, trả null nếu tệp không tồn tại (bản triển khai cắt bớt). */
async function loadModel(name) {
  try {
    return (await import(`../models/${name}.js`)).default;
  } catch {
    return null;
  }
}

/** Chạy một truy vấn có rào: lỗi ở một mảng không được làm sập cả hồ sơ. */
async function section(name, run) {
  try {
    return { name, data: await run() };
  } catch (error) {
    return { name, data: null, error: error.message };
  }
}

const recent = (Model, filter, limit = 20, sort = { createdAt: -1 }) =>
  Model ? Model.find(filter).sort(sort).limit(limit).lean() : [];

const count = (Model, filter) => (Model ? Model.countDocuments(filter) : 0);

/**
 * @param {string} email  email của người dùng (đã chuẩn hoá thường)
 * @param {string} memberId  _id của Bio — dùng cho model khoá theo ownerMemberId
 */
export async function buildUserOverview(email, memberId) {
  const hash = emailHashOf(email);
  const byEmail = { email };

  const [
    JoyLedger, JoyCreditProfile, JoyDefaultRecord, PendingTransfer, JoyGiftCard,
    Booking, SupportTicket, CustomerProject, UtilityOrder,
    SecurityEvent, SecurityBlock, SecurityAppeal, WebAuthnCredential,
    NativePushDevice, NotificationSubscription, InAppNotification,
    SurveyResponse, SleepLog, ReadingSession, LessonFeedback, LearningEvidence,
    StockPosition, StockTrade, ArcadeScore, ChessRating, CheckinRecord,
    Friendship, UserProfile, SocialProfile,
  ] = await Promise.all([
    'JoyLedger', 'JoyCreditProfile', 'JoyDefaultRecord', 'PendingTransfer', 'JoyGiftCard',
    'Booking', 'SupportTicket', 'CustomerProject', 'UtilityOrder',
    'SecurityEvent', 'SecurityBlock', 'SecurityAppeal', 'WebAuthnCredential',
    'NativePushDevice', 'NotificationSubscription', 'InAppNotification',
    'SurveyResponse', 'SleepLog', 'ReadingSession', 'LessonFeedback', 'LearningEvidence',
    'StockPosition', 'StockTrade', 'ArcadeScore', 'ChessRating', 'CheckinRecord',
    'Friendship', 'UserProfile', 'SocialProfile',
  ].map(loadModel));

  const sections = await Promise.all([
    // ── Ví và tín dụng ───────────────────────────────────────────────────
    section('wallet', async () => ({
      ledger: await recent(JoyLedger, byEmail, 30),
      credit: JoyCreditProfile ? await JoyCreditProfile.findOne(byEmail).lean() : null,
      // Sổ đen khoá theo BĂM email, không phải email thô.
      defaults: await recent(JoyDefaultRecord, { emailHash: hash }, 20),
      giftCards: await recent(JoyGiftCard, byEmail, 10),
      // Giao dịch bị giữ: tra CẢ HAI chiều, người này có thể là bên nhận.
      heldTransfers: PendingTransfer
        ? await PendingTransfer.find({ $or: [{ fromEmail: email }, { toEmail: email }] })
            .sort({ createdAt: -1 }).limit(20).lean()
        : [],
    })),

    // ── Thương mại: lịch hẹn, dự án, đơn hàng, hỗ trợ ────────────────────
    section('commerce', async () => ({
      bookings: await recent(Booking, byEmail, 20),
      projects: await recent(CustomerProject, byEmail, 20),
      orders: await recent(UtilityOrder, byEmail, 20),
      tickets: await recent(SupportTicket, byEmail, 20),
    })),

    // ── An ninh ──────────────────────────────────────────────────────────
    section('security', async () => ({
      eventCount: await count(SecurityEvent, { emailHash: hash }),
      blocks: await recent(SecurityBlock, { $or: [{ email }, { emailHash: hash }] }, 10),
      appeals: await recent(SecurityAppeal, byEmail, 10),
      passkeys: await recent(WebAuthnCredential, byEmail, 10),
    })),

    // ── Thiết bị và thông báo ────────────────────────────────────────────
    section('devices', async () => ({
      nativePush: await recent(NativePushDevice, byEmail, 10),
      webPush: await recent(NotificationSubscription, byEmail, 10),
      unreadNotifications: await count(InAppNotification, { email, read: false }),
    })),

    // ── Học tập và sức khoẻ ──────────────────────────────────────────────
    section('learning', async () => ({
      evidence: LearningEvidence && memberId
        ? await LearningEvidence.find({ ownerMemberId: memberId }).sort({ createdAt: -1 }).limit(20).lean()
        : [],
      feedback: await recent(LessonFeedback, byEmail, 10),
      reading: await recent(ReadingSession, byEmail, 10),
      sleep: await recent(SleepLog, byEmail, 14),
      surveys: await recent(SurveyResponse, byEmail, 10),
    })),

    // ── Trò chơi và sàn ảo ───────────────────────────────────────────────
    section('play', async () => ({
      stockPositions: await recent(StockPosition, byEmail, 20),
      stockTrades: await recent(StockTrade, byEmail, 20),
      arcadeScores: await recent(ArcadeScore, byEmail, 10, { score: -1 }),
      chess: ChessRating ? await ChessRating.findOne(byEmail).lean() : null,
      checkins: await recent(CheckinRecord, byEmail, 10),
    })),

    // ── Xã hội ───────────────────────────────────────────────────────────
    section('social', async () => ({
      friends: Friendship
        ? await Friendship.find({ $or: [{ requesterEmail: email }, { recipientEmail: email }] })
            .sort({ createdAt: -1 }).limit(30).lean()
        : [],
      interests: UserProfile ? await UserProfile.findOne(byEmail).lean() : null,
      socialProfile: SocialProfile ? await SocialProfile.findOne(byEmail).lean() : null,
    })),
  ]);

  const overview = {};
  const failed = [];
  for (const { name, data, error } of sections) {
    overview[name] = data;
    if (error) failed.push({ section: name, error });
  }
  return { overview, failed };
}

export { emailHashOf };
