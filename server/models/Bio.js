import mongoose from 'mongoose';
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
    phone: {
      type: String,
      default: ''
    },
    // Kiểm tra thông tin cá nhân định kỳ (server/utils/identityCheck.js).
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
    hobbies: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: ''
    },
    weight: {
      type: String,
      default: ''
    },
    measurements: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
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
    birthdayVoucherYear: {
      type: Number,
      default: 0
    },
    backedUpContacts: {
      type: [{
        name: { type: String, required: true },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
      }],
      default: []
    },
    verificationRequest: {
      fullName: { type: String, default: '' },
      birthday: { type: String, default: '' },
      schoolLevel: { type: String, default: '' },
      schoolName: { type: String, default: '' },
      schoolIdCode: { type: String, default: '' },
      phoneZalo: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      submitted: { type: Boolean, default: false },
      notifiedStatus: { type: String, default: 'none' }
    },
    // True for academic-email signups (instant 1-year access). False means the
    // member is on the 30-day non-edu trial until an admin approves their
    // submitted verificationRequest — see POST /bios/:id/status.
    isEduVerified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
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
    // Đơn vị JOY của tài khoản (khoá vào shared/joyCurrency.js: 'vi' → JOYmi…).
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
    // JOYlater — mở khoá trước, trả bằng thu nhập ngày. MỘT khoản một lúc:
    // `outstanding > 0` là đang nợ. Không có trường "hạn chót" vì thiết kế không
    // có hạn chót — nợ tự trừ dần từ mỗi lần nhận JOY (xem shared/joyLater.js).
    joyLoan: {
      principal:   { type: Number, default: 0, min: 0 },
      fee:         { type: Number, default: 0, min: 0 },
      outstanding: { type: Number, default: 0, min: 0 },
      // Số đợt đã chọn lúc mở. Khoản vay cũ không có trường này nên mặc định 1
      // — đúng với cách chúng đã hoạt động: trả một lần.
      installments: { type: Number, default: 1, min: 1 },
      // Tổng đã hoàn, cộng dồn. Cần lưu riêng chứ không suy từ `outstanding`:
      // khoản trễ hạn làm outstanding TĂNG, nên `total - outstanding` không còn
      // là số đã hoàn nữa, mà lịch đợt lại phải soi đúng con số đó.
      paid: { type: Number, default: 0, min: 0 },
      // Khoản trễ hạn đã cộng, cộng dồn. Tách khỏi `fee` để phiếu chi tiết nói
      // rõ đâu là phần chốt lúc mở, đâu là phần phát sinh do trễ.
      penalty: { type: Number, default: 0, min: 0 },
      // Ngày tới hạn từng đợt, chốt lúc mở (xem dueSchedule).
      dueAt: { type: [Date], default: [] },
      // Chỉ số (0-based) các đợt ĐÃ tính khoản trễ — mỗi đợt chỉ tính một lần.
      penalized: { type: [Number], default: [] },
      openedAt:    { type: Date, default: null },
      repaidAt:    { type: Date, default: null },
      // Món đã mở bằng khoản vay — để đối soát và hiện lại trong ví.
      itemLabel:   { type: String, default: '' },
      itemKey:     { type: String, default: '' },
    },
    // Sổ tay các lượt mở trước, ghi lúc MỞ. `joyLoan` ở trên chỉ giữ lượt đang
    // chạy và bị ghi đè mỗi lần mở lượt mới, nên không có chỗ này thì lượt đã
    // xong biến mất khỏi lịch sử. Chỉ lưu phần KHÔNG suy được từ sổ cái JOY
    // (tách gốc/cộng thêm, số đợt); còn từng lần hoàn thì sổ cái đã có đủ.
    // Giữ 20 lượt gần nhất — đủ để đối soát, không phình vô hạn.
    joyLoanHistory: {
      type: [{
        principal:    { type: Number, default: 0 },
        fee:          { type: Number, default: 0 },
        total:        { type: Number, default: 0 },
        installments: { type: Number, default: 1 },
        itemLabel:    { type: String, default: '' },
        itemKey:      { type: String, default: '' },
        openedAt:     { type: Date, default: Date.now },
      }],
      default: [],
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
    referredBy: {
      type: String,
      default: ''
    },
    referralCount: {
      type: Number,
      default: 0
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    // Bonus AI-chat tokens purchased from the Utility Store (Psy-Study products).
    // Persisted on top of the Python AI server's daily free quota — consumed
    // there once the daily cap is hit. See rate_limit_service.consume_bonus_token.
    bonusChatTokens: {
      type: Number,
      default: 0,
      min: 0
    },
    bonusCallTokens: {
      type: Number,
      default: 0,
      min: 0
    },
    transactionPin: {
      type: String,
      default: null
    },
    // Cross-job push cooldown gate (see server/services/pushGuard.js) — shared
    // by every push cron (proactive, smart, scheduled companion) so
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
    // Stable sequential index for Redis bitmap addressing (online/DAU presence
    // tracking) — assigned lazily on first heartbeat, see presenceService.js.
    presenceIndex: {
      type: Number,
      default: null
    },
    // Bạn Học Đường therapy features unlocked with a one-time 150 JOY spend
    // each (e.g. 'reading', 'meditation', 'depression') — see companionRoutes.js.
    unlockedCompanionFeatures: {
      type: [String],
      default: []
    },
    // List of completed interactive IDE lessons (IDs) that awarded JOY
    completedLessons: {
      type: [String],
      default: []
    },
    // Lifetime HugoSO course entitlements purchased with JOY.
    // Values are stable curriculum ids: calendar, docs, sheets, gemini.
    hugoSOCourses: {
      type: [String],
      default: []
    },
    // One-time JOY bonus for opening the Info & Version utility — see joyRoutes.js claim-info-bonus.
    infoBonusClaimed: {
      type: Boolean,
      default: false
    },
    // Separate one-time bonus for reading the release notes to the end —
    // see joyRoutes.js claim-info-read-bonus.
    infoReadBonusClaimed: {
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
    // Monthly JOY subscriptions gating HugoCoder / HugoAura (Lofi only —
    // Pomodoro stays free) / HugoRadio / HugoArcade (Bứt phá + Huyền
    // thoại tiers). `active` is a cosmetic cache only, written by the nightly
    // cron sweep (cronJobs.js) — actual gating ALWAYS re-derives from
    // `expiresAt` live (see featureSubscriptionService.js's isFeatureActive),
    // so a missed/delayed cron run never grants unpaid access.
    featureSubscriptions: {
      hugoCoder: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderIntermediate: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderAdvanced: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderSecurity: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderExam: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderOptimize: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoCoderUltimate: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoAura: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoRadio: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoArcade: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      },
      hugoChess: {
        expiresAt: { type: Date, default: null },
        active: { type: Boolean, default: false }
      }
    },
    // Hai bậc còn lại của thang "Dùng thử → Thuê → Sở hữu" (appPlanService.js).
    // Bậc THUÊ không nằm ở đây — nó vẫn là `featureSubscriptions` phía trên, để
    // cổng khoá của HugoRadio/Arcade/Aura/Coder chỉ có đúng một nguồn sự thật.
    // Khoá là appId ('radio', 'arcade'…), giá trị:
    //   { trialStartedAt, trialEndsAt, owned, ownedAt, giftedBy }
    appPlans: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    // Paid rental backing theme.template when it's 'brutalism'/'flat'
    // (150 JOY/month). theme.template is the live/rendered value; this is the
    // paid entitlement behind it, reverted to 'default' by the nightly cron
    // sweep once expiresAt passes — even for owners who never log back in,
    // since other people view the public bio page too.
    bioThemeRental: {
      template: { type: String, default: 'default' },
      expiresAt: { type: Date, default: null }
    },
    hugoCoderBasicLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderAll7Lifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderIntermediateLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderAdvancedLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderSecurityLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderExamLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderOptimizeLifetime: {
      type: Boolean,
      default: false
    },
    hugoCoderUltimateLifetime: {
      type: Boolean,
      default: false
    },
    // Chặng 6 mới (Bài 91-100) tách từ gói Ultimate cũ (71-100)
    hugoCoderDevopsLifetime: {
      type: Boolean,
      default: false
    },
    // Số lần đã NỘP mỗi bài thi (lessonId -> count). Lượt 1 nằm trong gói,
    // từ lượt 2 thu 250 JOY/lần tại coder-exam/start.
    hugoCoderExamAttempts: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    courseCompletionAwardClaimed: {
      type: Boolean,
      default: false
    },
    hugoCoderProjectUrl: {
      type: String,
      default: ""
    },
    hugoCoderProjectStatus: {
      type: String,
      enum: ["idle", "pending", "approved", "rejected"],
      default: "idle"
    },
    hugoCoderCertificateUrl: {
      type: String,
      default: ""
    },
    hugoCoderProjectSubmittedAt: {
      type: Date,
      default: null
    },
    hugoCoderProjectNote: {
      type: String,
      default: ""
    },
    hugoCoderProjectAdminNote: {
      type: String,
      default: ""
    },
    hugoCoderRewardClaimed3: {
      type: Boolean,
      default: false
    },
    hugoCoderRewardClaimed4: {
      type: Boolean,
      default: false
    },
    hugoCoderRewardClaimed5: {
      type: Boolean,
      default: false
    },
    hugoCoderRewardClaimed6: {
      type: Boolean,
      default: false
    },
    hugoCoderRewardClaimed7: {
      type: Boolean,
      default: false
    },
    locationAnomaly: {
      type: Boolean,
      default: false
    },
    lastUserAgentHash: {
      type: String,
      default: ''
    },
    // HugoRadio time-based token system — replaces monthly subscription.
    // Free pool resets weekly; purchased pool carries over and is consumed
    // after the free pool is exhausted.
    radioTokens: {
      weeklyFreeMinutes: { type: Number, default: 300 },   // 5 hours free per week
      weeklyUsedMinutes: { type: Number, default: 0 },     // consumed from free pool this week
      weeklyResetAt:     { type: Date, default: null },    // when the current weekly cycle started
      purchasedMinutes:  { type: Number, default: 0 },     // bought add-on minutes (never reset)
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
  'height',
  'weight',
  'measurements',
  'address',
  'education',
  'skills',
  'jobTitle',
  'birthday'
];

const SENSITIVE_VERIFICATION_FIELDS = [
  'fullName',
  'birthday',
  'schoolLevel',
  'schoolName',
  'schoolIdCode',
  'phoneZalo'
];

BioSchema.pre('save', function (next) {
  for (const field of SENSITIVE_FIELDS) {
    if (this.isModified(field) && typeof this[field] === 'string' && this[field]) {
      this[field] = encryptText(this[field]);
    }
  }
  if (this.verificationRequest) {
    for (const field of SENSITIVE_VERIFICATION_FIELDS) {
      if (this.isModified(`verificationRequest.${field}`) && typeof this.verificationRequest[field] === 'string' && this.verificationRequest[field]) {
        this.verificationRequest[field] = encryptText(this.verificationRequest[field]);
      }
    }
  }
  next();
});

function decryptBioFields(doc) {
  if (!doc) return;
  for (const field of SENSITIVE_FIELDS) {
    if (typeof doc[field] === 'string' && doc[field]) {
      doc[field] = decryptText(doc[field]);
    }
  }
  if (doc.verificationRequest) {
    for (const field of SENSITIVE_VERIFICATION_FIELDS) {
      if (typeof doc.verificationRequest[field] === 'string' && doc.verificationRequest[field]) {
        doc.verificationRequest[field] = decryptText(doc.verificationRequest[field]);
      }
    }
  }
}

BioSchema.post('init', function (doc) {
  decryptBioFields(doc);
});

BioSchema.post('save', function (doc) {
  decryptBioFields(doc);
});

const Bio = mongoose.model('Bio', BioSchema);

export default Bio;
