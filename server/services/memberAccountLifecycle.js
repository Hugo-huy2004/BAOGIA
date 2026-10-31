import Bio from '../models/Bio.js';
import VerificationEvidence from '../models/VerificationEvidence.js';
import ArcadeScore from '../models/ArcadeScore.js';
import LearningEvidence from '../models/LearningEvidence.js';
import InAppNotification from '../models/InAppNotification.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import NativePushDevice from '../models/NativePushDevice.js';
import { deleteMemberLogin } from '../auth/betterAuth.js';
import OAuthToken from '../models/OAuthToken.js';
import OAuthAuthorizationCode from '../models/OAuthAuthorizationCode.js';
import UserProfile from '../models/UserProfile.js';
import CompanionHistory from '../models/CompanionHistory.js';
import SleepLog from '../models/SleepLog.js';
import ReadingSession from '../models/ReadingSession.js';
import SurveyResponse from '../models/SurveyResponse.js';
import LessonFeedback from '../models/LessonFeedback.js';
import CheckinRecord from '../models/CheckinRecord.js';
import ChessGame from '../models/ChessGame.js';
import ChessRating from '../models/ChessRating.js';
import StockPosition from '../models/StockPosition.js';
import StockTrade from '../models/StockTrade.js';
import IoTDevice from '../models/IoTDevice.js';
import ScheduledPush from '../models/ScheduledPush.js';
import JoyCreditProfile from '../models/JoyCreditProfile.js';
import JoyLedger from '../models/JoyLedger.js';
import JoyGiftCard from '../models/JoyGiftCard.js';
import StoreCart from '../models/StoreCart.js';
import PendingTransfer from '../models/PendingTransfer.js';
import UtilityOrder from '../models/UtilityOrder.js';
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

const expiredMemberFilter = (now) => ({
  isEduVerified: { $ne: true },
  $or: [
    { trialExpiresAt: { $lte: now } },
    {
      $and: [
        { $or: [{ trialExpiresAt: null }, { trialExpiresAt: { $exists: false } }] },
        { expiresAt: { $lte: now } },
      ],
    },
  ],
});

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

const removeMemberData = async (bio) => {
  const email = String(bio.email || '').trim().toLowerCase();
  const emailFilter = { email };
  const memberEmailFilter = { memberEmail: email };
  const operations = [
    VerificationEvidence.deleteMany({ memberId: bio._id }),
    LearningEvidence.deleteMany({ ownerMemberId: bio._id }),
    ArcadeScore.deleteMany(emailFilter),
    InAppNotification.deleteMany(emailFilter),
    NotificationSubscription.deleteMany(emailFilter),
    NativePushDevice.deleteMany(emailFilter),
    deleteMemberLogin(email),
    OAuthToken.deleteMany(memberEmailFilter),
    OAuthAuthorizationCode.deleteMany(memberEmailFilter),
    UserProfile.deleteMany(emailFilter),
    CompanionHistory.deleteMany(emailFilter),
    SleepLog.deleteMany(emailFilter),
    ReadingSession.deleteMany(memberEmailFilter),
    SurveyResponse.deleteMany(emailFilter),
    LessonFeedback.deleteMany(memberEmailFilter),
    CheckinRecord.deleteMany(emailFilter),
    ChessGame.deleteMany({ $or: [{ 'white.email': email }, { 'black.email': email }] }),
    ChessRating.deleteMany(emailFilter),
    StockPosition.deleteMany(emailFilter),
    StockTrade.deleteMany(emailFilter),
    IoTDevice.deleteMany(emailFilter),
    ScheduledPush.deleteMany(emailFilter),
    JoyCreditProfile.deleteMany(emailFilter),
    JoyLedger.deleteMany(emailFilter),
    JoyGiftCard.deleteMany({ redeemedBy: email }),
    StoreCart.deleteMany(emailFilter),
    PendingTransfer.deleteMany({ $or: [{ fromEmail: email }, { toEmail: email }] }),
    UtilityOrder.deleteMany(emailFilter),
    SupportTicket.deleteMany(emailFilter),
    removeSecurityAppeals(email),
    SecurityModeration.deleteMany(emailFilter),
    ErrorLog.deleteMany(emailFilter),
  ];
  await Promise.all(operations);
};

export async function deleteMemberAccountPermanently(bioId, { onlyIfTrialExpired = false, now = new Date() } = {}) {
  let candidate = await Bio.findById(bioId).select('+deletionStartedAt');
  if (!candidate) return false;
  if (onlyIfTrialExpired) {
    const deadline = candidate.trialExpiresAt || candidate.expiresAt;
    if (candidate.isEduVerified || !deadline || new Date(deadline).getTime() > now.getTime()) return false;
  }

  if (!candidate.deletionStartedAt) {
    const claimFilter = {
      _id: candidate._id,
      deletionStartedAt: null,
      ...(onlyIfTrialExpired ? expiredMemberFilter(now) : {}),
    };
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

  const accountImageUrls = new Set([candidate.avatarUrl, candidate.verificationRequest?.avatarUrl].filter(Boolean));
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

export async function purgeOrphanedVerificationEvidence({ now = new Date(), limit = 100 } = {}) {
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000);
  const evidence = await VerificationEvidence.aggregate([
    { $match: { uploadedAt: { $lte: cutoff } } },
    {
      $lookup: {
        from: Bio.collection.name,
        let: { memberId: '$memberId', evidenceId: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$memberId'] },
                  { $eq: ['$verificationRequest.submitted', true] },
                  { $in: ['$$evidenceId', { $ifNull: ['$verificationRequest.evidenceFileIds', []] }] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: 'activeReview',
      },
    },
    { $match: { activeReview: { $eq: [] } } },
    { $sort: { uploadedAt: 1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);
  if (!evidence.length) return 0;

  const result = await VerificationEvidence.deleteMany({ _id: { $in: evidence.map((item) => item._id) } });
  return result.deletedCount || 0;
}

export async function deleteExpiredMemberAccount(email, now = new Date()) {
  const bio = await Bio.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!bio) return false;
  return deleteMemberAccountPermanently(bio._id, { onlyIfTrialExpired: true, now });
}

export async function purgeExpiredUnverifiedMembers({ now = new Date(), limit = 20 } = {}) {
  const candidates = await Bio.find({
    $or: [
      expiredMemberFilter(now),
      { deletionStartedAt: { $ne: null } },
    ],
  })
    .select('_id +deletionStartedAt')
    .sort({ expiresAt: 1 })
    .limit(limit)
    .lean();
  let deleted = 0;
  for (const candidate of candidates) {
    const removed = candidate.deletionStartedAt
      ? await deleteMemberAccountPermanently(candidate._id, { now })
      : await deleteMemberAccountPermanently(candidate._id, { onlyIfTrialExpired: true, now });
    if (removed) deleted++;
  }
  return { scanned: candidates.length, deleted };
}
