import Bio from '../models/Bio.js';
import LearningEvidence from '../models/LearningEvidence.js';
import InAppNotification from '../models/InAppNotification.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import NativePushDevice from '../models/NativePushDevice.js';
import { deleteMemberLogin } from '../auth/betterAuth.js';
import OAuthToken from '../models/OAuthToken.js';
import OAuthAuthorizationCode from '../models/OAuthAuthorizationCode.js';
import UserProfile from '../models/UserProfile.js';
import ReadingSession from '../models/ReadingSession.js';
import CheckinRecord from '../models/CheckinRecord.js';
import StockPosition from '../models/StockPosition.js';
import StockTrade from '../models/StockTrade.js';
import ScheduledPush from '../models/ScheduledPush.js';
import mongoose from 'mongoose';
import JoyLedger from '../models/JoyLedger.js';
import JoyGiftCard from '../models/JoyGiftCard.js';
import PendingTransfer from '../models/PendingTransfer.js';
import SupportTicket from '../models/SupportTicket.js';
import SecurityAppeal from '../models/SecurityAppeal.js';
import SecurityModeration from '../models/SecurityModeration.js';
import ErrorLog from '../models/ErrorLog.js';
import DeletedMemberAccount from '../models/DeletedMemberAccount.js';
import { hashMemberEmail } from '../utils/deletedMemberAccount.js';
import { deleteAvatar, getPublicIdFromUrl } from '../utils/cloudinary.js';
import { clearCache } from '../utils/cacheHelper.js';
import slugIndex from './slugIndex.js';
import { broadcastToEmail } from '../utils/realtime.js';
import Persona from '../models/Persona.js';
import UserReport from '../models/UserReport.js';
import TodayPost from '../models/TodayPost.js';

const removeOwnedImage = async (url) => {
  if (!getPublicIdFromUrl(url)) return;
  if (!await deleteAvatar(url)) {
    throw new Error('Could not remove an account-owned image asset.');
  }
};

// Kháng nghị đã có quyết định thì không giữ gì: xoá selfie trên Cloudinary rồi xoá
// luôn bản ghi (vị trí, IP). Nhật ký admin chỉ còn caseId. Xoá ảnh hỏng thì GIỮ
// bản ghi để lượt dọn sau còn URL mà thử lại.
export async function purgeSecurityAppeal(appeal) {
  await removeOwnedImage(appeal.imageUrl);
  await SecurityAppeal.deleteOne({ _id: appeal._id });
}

// TTL của Mongo xoá bản ghi nhưng không biết tới Cloudinary — đơn treo tới hết hạn
// sẽ để lại selfie mồ côi vĩnh viễn. Dọn trước hạn TTL một ngày.
export async function purgeExpiringSecurityAppeals({ now = new Date(), limit = 50 } = {}) {
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const appeals = await SecurityAppeal.find({ expiresAt: { $lte: soon } }, 'imageUrl').limit(limit).lean();
  let removed = 0;
  for (const appeal of appeals) {
    try {
      await purgeSecurityAppeal(appeal);
      removed += 1;
    } catch (error) {
      console.error('[appeal purge]', error.message);
    }
  }
  return removed;
}

const removeSecurityAppeals = async (email) => {
  const appeals = await SecurityAppeal.find({ email }, 'imageUrl').lean();
  await Promise.all(appeals.map((appeal) => removeOwnedImage(appeal.imageUrl)));
  await SecurityAppeal.deleteMany({ email });
};

// Persona, báo cáo, bài Today + lượt thích.
const removeEduData = async (email) => {
  await Promise.all([
    Persona.deleteOne({ email }),
    UserReport.deleteMany({ $or: [{ reporterEmail: email }, { targetEmail: email }] }),
    TodayPost.deleteMany({ authorEmail: email }),
    TodayPost.updateMany({ likes: email }, { $pull: { likes: email }, $inc: { likeCount: -1 } }),
  ]);
};

const removeMemberData = async (bio) => {
  const email = String(bio.email || '').trim().toLowerCase();
  const emailFilter = { email };
  const memberEmailFilter = { memberEmail: email };
  const operations = [
    LearningEvidence.deleteMany({ ownerMemberId: bio._id }),
    InAppNotification.deleteMany(emailFilter),
    NotificationSubscription.deleteMany(emailFilter),
    NativePushDevice.deleteMany(emailFilter),
    deleteMemberLogin(email),
    OAuthToken.deleteMany(memberEmailFilter),
    OAuthAuthorizationCode.deleteMany(memberEmailFilter),
    UserProfile.deleteMany(emailFilter),
    ReadingSession.deleteMany(memberEmailFilter),
    CheckinRecord.deleteMany(emailFilter),
    StockPosition.deleteMany(emailFilter),
    StockTrade.deleteMany(emailFilter),
    ScheduledPush.deleteMany(emailFilter),
    // JOYlater đã gỡ 31/10/2026 (bỏ cả model) nhưng hồ sơ tín dụng cũ vẫn là dữ
    // liệu cá nhân — xoá tài khoản thì phải xoá theo.
    mongoose.connection.collection('joycreditprofiles').deleteMany(emailFilter),
    JoyLedger.deleteMany(emailFilter),
    JoyGiftCard.deleteMany({ redeemedBy: email }),
    PendingTransfer.deleteMany({ $or: [{ fromEmail: email }, { toEmail: email }] }),
    SupportTicket.deleteMany(emailFilter),
    removeSecurityAppeals(email),
    SecurityModeration.deleteMany(emailFilter),
    ErrorLog.deleteMany(emailFilter),
    removeEduData(email),
  ];
  await Promise.all(operations);
};

export async function deleteMemberAccountPermanently(bioId, { now = new Date() } = {}) {
  let candidate = await Bio.findById(bioId).select('+deletionStartedAt');
  if (!candidate) return false;

  if (!candidate.deletionStartedAt) {
    const claimFilter = { _id: candidate._id, deletionStartedAt: null };
    candidate = await Bio.findOneAndUpdate(
      claimFilter,
      { $set: { deletionStartedAt: now } },
      { new: true },
    );
    if (!candidate) return false;
  }

  const emailHash = hashMemberEmail(candidate.email);
  await DeletedMemberAccount.updateOne(
    { emailHash },
    { $setOnInsert: { emailHash, deletedAt: now } },
    { upsert: true },
  );

  const accountImageUrls = new Set([candidate.avatarUrl].filter(Boolean));
  await Promise.all([...accountImageUrls].map(removeOwnedImage));
  await removeMemberData(candidate);
  await Promise.all([
    candidate.slug && clearCache(`bio_slug_${candidate.slug}`),
    candidate.customDomain && clearCache(`bio_domain_${candidate.customDomain}`),
    slugIndex.deleteSlug(candidate.slug),
    slugIndex.deleteCustomDomain(candidate.customDomain),
  ]);
  await Bio.deleteOne({ _id: candidate._id });
  broadcastToEmail(candidate.email, { type: 'member_account_deleted' });
  return true;
}

/** Xoá dở dang (máy chủ khởi động lại giữa chừng) thì làm nốt. Tài khoản hết hạn KHÔNG bị xoá. */
export async function resumePendingDeletions({ now = new Date(), limit = 20 } = {}) {
  const pending = await Bio.find({ deletionStartedAt: { $ne: null } }).select('_id +deletionStartedAt').limit(limit).lean();
  let deleted = 0;
  for (const { _id } of pending) if (await deleteMemberAccountPermanently(_id, { now })) deleted++;
  return { scanned: pending.length, deleted };
}
