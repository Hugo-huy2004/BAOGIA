import mongoose from 'mongoose';
import { unsealField } from '../utils/dbSealingCipher.js';
import { encryptText, decryptText } from '../utils/cryptoUtils.js';

const BioSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    displayName: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true
    },
    customDomainStatus: {
      type: String,
      enum: ['none', 'pending', 'active'],
      default: 'none'
    },
    headline: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    birthday: {
      type: String,
      default: ''
    },
    // Ngày/tháng/năm sinh dùng cho cổng độ tuổi (xem utils/memberAge.js) và
    // vòng quay tháng sinh nhật. Tách riêng khỏi `birthday` vì trường đó là
    // chuỗi tự do người dùng tự gõ và đang được mã hoá — không truy vấn hay
    // so sánh được.
    birthYear: {
      type: Number,
      default: 0
    },
    birthMonth: {
      type: Number,
      default: 0
    },
    birthDay: {
      type: Number,
      default: 0
    },
    // Thời điểm thành viên dưới 16 tuổi xác nhận đã có sự đồng ý của cha mẹ /
    // người giám hộ (Nghị định 13/2023 Điều 20). Rỗng = chưa xác nhận; xem
    // utils/profileRequirements.js.
    guardianConsentAt: {
      type: Date,
      default: null
    },
    // Vòng quay tháng sinh nhật: mỗi năm đúng một lượt. Năm đã quay nằm ở đây
    // nên client có làm gì cũng không quay lại được lượt thứ hai.
    birthdaySpinYear: {
      type: Number,
      default: 0
    },
    birthdaySpinPrize: {
      type: Number,
      default: 0
    },
    // Hạng Star-14/Star-18 suy ra từ ngày sinh (utils/memberTier.js), chỉ hạng
    // danh dự là do admin gắn tay nên mới cần lưu.
    starVip: {
      type: Boolean,
      default: false
    },
    // Voucher giảm giá dịch vụ làm web, phát kèm quà sinh nhật theo hạng.
    // Không tự trừ tiền ở đâu cả: đây là mã người dùng đưa khi trao đổi dự án.
    serviceVouchers: {
      type: [{
        code: { type: String, required: true },
        percent: { type: Number, required: true },
        scope: { type: String, default: '' },
        label: { type: String, default: '' },
        issuedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date, default: null }
      }],
      default: []
    },
    // Năm đã nhận quà sinh nhật theo hạng (ngày duy trì + voucher). Tách khỏi
    // birthdaySpinYear để nếu sau này tách hai luồng thì không đụng nhau.
    birthdayGiftYear: {
      type: Number,
      default: 0
    },
    // Lưu chữ thường (26/10/2026, theo yêu cầu): bản niêm phong cũ lọt ra form
    // qua mọi truy vấn lean(). Bản cũ còn trong DB được giải ở decryptBioFields;
    // chuyển hẳn bằng apps/server/scripts/unseal-phones.mjs.
    phone: {
      type: String,
      default: ''
    },
    // Kiểm tra thông tin cá nhân định kỳ (apps/server/utils/identityCheck.js).
    // Người khai thật nhớ được thông tin của mình; người khai bừa thì vài tuần
    // sau đã quên. `nextDueAt` rỗng = chưa xếp lịch (thành viên mới).
    identityCheck: {
      nextDueAt: { type: Date, default: null },
      tier: { type: Number, default: 0 },          // chỉ số trong SCHEDULE_DAYS
      lastField: { type: String, default: '' },    // món đã hỏi lần trước
      pendingField: { type: String, default: '' }, // món của đợt đang mở
      attempts: { type: Number, default: 0 },      // số lần sai trong đợt này
      failStreak: { type: Number, default: 0 },    // số đợt trượt (cộng dồn)
      lastVerifiedAt: { type: Date, default: null },
      lastFailedAt: { type: Date, default: null },
    },
    // Anomalous-login guard: the first geolocation reading after the member
    // opts in becomes the "trusted" reference point. Later readings further
    // than ~50km away (see bioRoutes.js /me/check-location) flag the session
    // for forced re-login. Never set without explicit browser permission —
    // the geolocation prompt itself is the user's consent.
    trustedLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    lastLocationCheck: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      distanceKm: { type: Number, default: null },
      checkedAt: { type: Date, default: null }
    },
    // Date-keyed daily cap on JOY sent via phone transfer — same reset pattern
    // as ArcadeScore.joyAwardedDate/joyAwardedToday.
    joySentDate: {
      type: String,
      default: ''
    },
    joySentToday: {
      type: Number,
      default: 0
    },
    // Trần THÁNG — cùng khuôn khoá-theo-kỳ như trần ngày ở trên. Khoá là
    // "YYYY-MM"; sang tháng mới thì kỳ không khớp và bộ đếm tự coi như 0, không
    // cần cron nào đi reset.
    joySentMonth: {
      type: String,
      default: ''
    },
    joySentMonthTotal: {
      type: Number,
      default: 0
    },
    // Server-authoritative daily reward reservations. These counters are kept
    // on the wallet owner (not in client game state) so concurrent requests
    // cannot race past the JOY caps.
    arcadeJoyDate: {
      type: String,
      default: ''
    },
    arcadeJoyToday: {
      type: Number,
      default: 0,
      min: 0
    },
    focusJoyDate: {
      type: String,
      default: ''
    },
    focusJoyToday: {
      type: Number,
      default: 0,
      min: 0
    },
    // Set by /joy/focus-start, consumed by /joy/award-focus: the server's own
    // clock decides how long the member focused, never the client's number.
    focusStartedAt: {
      type: Date,
      default: null
    },
    hobbies: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    // Riêng tư: không thuộc danh sách trường của trang Bio công khai.
    exactAddress: { type: String, default: '' },
    adminArea: { type: String, default: '' },
    locality: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    verifiedLatitude: { type: String, default: '' },
    verifiedLongitude: { type: String, default: '' },
    locationVerifiedAt: { type: Date, default: null },
    // Độ chính xác GPS (mét) lúc ghim, địa chỉ OpenStreetMap của điểm ghim và kết
    // quả đối chiếu với địa chỉ đã khai (utils/reverseGeocode.js):
    // 'match' | 'area' (khác tỉnh — admin xem) | 'unchecked' (chưa tra được).
    locationAccuracy: { type: Number, default: 0 },
    locationGeocode: { type: String, default: '' },
    locationMatch: { type: String, default: '' },
    education: {
      type: String,
      default: ''
    },
    skills: {
      type: String,
      default: ''
    },
    jobTitle: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    links: {
      type: [{
        label: { type: String, default: '' },
        url: { type: String, default: '' }
      }],
      default: []
    },
    theme: {
      bgColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#0f172a' },
      accentColor: { type: String, default: '#6366f1' },
      pattern: { type: String, default: 'none' },
      preset: { type: String, default: 'default' },
      btnRadius: { type: Number, default: 16 },
      btnBorderWidth: { type: Number, default: 0 },
      btnShadow: { type: Number, default: 4 },
      template: { type: String, default: 'default' }
    },
    tabs: {
      type: [{
        id: { type: String, default: '' },
        title: { type: String, default: '' },
        content: { type: String, default: '' }
      }],
      default: []
    },
    secretLinks: {
      type: [{
        id: { type: String, required: true },
        title: { type: String, default: '' },
        url: { type: String, required: true },
        password: { type: String, required: true },
        visits: { type: Number, default: 0 }
      }],
      default: []
    },
    projects: {
      type: [{
        id: { type: String },
        title: { type: String },
        description: { type: String },
        imageUrl: { type: String },
        link: { type: String }
      }],
      default: []
    },
    services: {
      type: [{
        id: { type: String },
        name: { type: String },
        description: { type: String },
        price: { type: String },
        icon: { type: String }
      }],
      default: []
    },
    serviceLabel: {
      type: String,
      default: 'Free Bio'
    },
    status: {
      type: String,
      default: 'active'
    },
    packages: {
      type: [{
        packageId: { type: String },
        name: { type: String },
        duration: { type: Number },
        durationUnit: { type: String, default: 'months' },
        benefits: [String],
        color: { type: String },
        addedAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    history: {
      type: [{
        type:      { type: String, default: 'info' },
        icon:      { type: String, default: 'notifications' },
        title:     { type: String, default: '' },
        detail:    { type: String, default: '' },
        timestamp: { type: Date,   default: Date.now }
      }],
      default: []
    },
    birthdayVoucherCode: {
      type: String,
      default: ''
    },
    birthdayVoucherClaimed: {
      type: Boolean,
      default: false
    },
    studentRewards: {
      type: [{
        year: { type: Number, required: true },
        type: { type: String, enum: ['achievement', 'transcript'], required: true },
        awardedDays: { type: Number, required: true },
        verifiedAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      index: true
    },
    deletionStartedAt: {
      type: Date,
      default: null,
      select: false,
    },
    joyBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    isJoyWalletFrozen: {
      type: Boolean,
      default: false
    },
    // Ngôn ngữ chính người dùng chọn lúc onboarding. Lưu ở server vì phần dịch
    // thông báo push và phần đơn vị JOY đều cần biết, không thể tin localStorage.
    language: {
      type: String,
      default: ''
    },
    // Đơn vị JOY của tài khoản (khoá vào packages/shared/joyCurrency.js: 'vi' → JOYmi…).
    //
    // CHỌN MỘT LẦN RỒI CỐ ĐỊNH — kể cả sau này đổi ngôn ngữ giao diện. Đây là
    // chống gian lận, không phải chống tiện: phí đổi đơn vị 15% khi gửi xuyên
    // đơn vị chỉ có nghĩa nếu đơn vị không đổi được tuỳ ý. Ai cũng đổi được đơn
    // vị thì chỉ cần đổi cho khớp người nhận trước khi gửi là né sạch phí.
    // `applyProfileValues` bỏ qua mục đã có giá trị, nên trường này write-once
    // mà không cần khoá riêng.
    joyDenom: {
      type: String,
      default: ''
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    referralApplied: {
      type: Boolean,
      default: false
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    transactionPin: {
      type: String,
      default: null
    },
    // Cross-job push cooldown gate (see apps/server/services/pushGuard.js) — shared
    // by every push cron so
    // a user never gets stacked notifications from unrelated jobs firing close
    // together, regardless of which job sends first.
    lastPushSentAt: {
      type: Date,
      default: null
    },
    antiDeepfakeLock: {
      type: Boolean,
      default: false
    },
    autoLogoutMinutes: {
      type: Number,
      default: 0 // 0 means Never
    },
    privateMode: {
      type: Boolean,
      default: false
    },
    // Legacy HugoAura preference. Kept for old records only; portal rendering
    // must use activePortalTheme below.
    activeAuraTheme: {
      type: String,
      default: 'default'
    },
    // Nền cá nhân của Member Portal. Tách riêng khỏi HugoAura để Pomodoro/Lofi
    // không còn quyền đọc hay thay đổi giao diện toàn hệ thống.
    activePortalTheme: {
      type: String,
      default: 'default'
    },
    // Hugo Profile: thành viên tự bật mới hiện hồ sơ năng lực trên trang Bio
    // công khai. Tách khỏi hạn thuê để tắt/bật không làm mất hạn đã trả.
    profilePublic: {
      type: Boolean,
      default: false
    },
    installedUtilities: {
      type: [String],
      default: []
    },
    // Subset of installedUtilities that also gets a home-screen icon — an app
    // can be installed (usable from Hugo Library) without cluttering the
    // home screen if the member chose "library only" at install time.
    homeScreenUtilities: {
      type: [String],
      default: []
    },
    rentedThemes: {
      type: [{
        themeId: { type: String, required: true },
        expiresAt: { type: Date, required: true }
      }],
      default: []
    },
    locationAnomaly: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Guarantees at most one account per non-empty phone (empty-string default is
// excluded via the partial filter, so it doesn't collide with itself across
// every phoneless Bio) — the basis for "send JOY by phone" resolving to
// exactly one recipient.
// MongoDB partial indexes only support a restricted operator set ($eq/$exists/
// $gt/$gte/$lt/$lte/$type) — $ne isn't allowed, so "non-empty string" is
// expressed as $gt '' (every real phone number sorts after the empty string).
BioSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $gt: '' } } }
);

// contactEmail is the fallback identity on ~29 hot query paths (every JOY /
// companion / bio route does `findOne({email})` then `findOne({contactEmail})`).
// Without an index each fallback was a full collection scan — O(n) per request,
// catastrophic at 1000+ users. Partial index (only rows with a real value)
// keeps it tiny since most bios leave contactEmail empty.
BioSchema.index(
  { contactEmail: 1 },
  { partialFilterExpression: { contactEmail: { $gt: '' } } }
);

// Birthday voucher redemption looks up by code — index so it's O(log n), not a
// scan. Partial: only bios that actually have an active voucher.
BioSchema.index(
  { birthdayVoucherCode: 1 },
  { partialFilterExpression: { birthdayVoucherCode: { $gt: '' } } }
);

const SENSITIVE_FIELDS = [
  'exactAddress',
  'adminArea',
  'locality',
  'verifiedLatitude',
  'verifiedLongitude',
  'locationGeocode'
];

BioSchema.pre('save', function (next) {
  for (const field of SENSITIVE_FIELDS) {
    if (this.isModified(field) && typeof this[field] === 'string' && this[field]) {
      this[field] = encryptText(this[field]);
    }
  }
  next();
});

function decryptBioFields(doc) {
  if (!doc) return;
  const target = doc._doc || doc;
  for (const key of Object.keys(target)) {
    if (typeof target[key] === 'string' && target[key]) {
      if (target[key].startsWith('$enc$a256gcm$v1$')) {
        target[key] = unsealField(target[key]);
      } else if (target[key].startsWith('enc:')) {
        target[key] = decryptText(target[key]);
      }
    }
  }
  for (const field of SENSITIVE_FIELDS) {
    if (typeof target[field] === 'string' && target[field]) {
      if (target[field].startsWith('$enc$a256gcm$v1$')) {
        target[field] = unsealField(target[field]);
      } else if (target[field].startsWith('enc:')) {
        target[field] = decryptText(target[field]);
      }
    }
  }
}

BioSchema.post('init', function (doc) {
  decryptBioFields(doc);
  // Giải không được (khoá đã xoay) thì số đã mất — để trống cho thành viên nhập
  // lại, đừng đẩy chuỗi mã hoá ra form.
  const target = doc._doc || doc;
  if (typeof target.phone === 'string' && target.phone.startsWith('$enc$')) target.phone = '';
});

BioSchema.post('save', function (doc) {
  decryptBioFields(doc);
});

BioSchema.post('find', function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptBioFields);
  }
});

BioSchema.post('findOne', function (doc) {
  decryptBioFields(doc);
});

BioSchema.post('findOneAndUpdate', function (doc) {
  decryptBioFields(doc);
});

const Bio = mongoose.model('Bio', BioSchema);

export default Bio;
