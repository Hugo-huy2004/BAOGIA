import mongoose from 'mongoose';

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
    phone: {
      type: String,
      default: ''
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
      phoneZalo: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      submitted: { type: Boolean, default: false },
      notifiedStatus: { type: String, default: 'none' }
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
    // Stable sequential index for Redis bitmap addressing (online/DAU presence
    // tracking) — assigned lazily on first heartbeat, see presenceService.js.
    presenceIndex: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
);

const Bio = mongoose.model('Bio', BioSchema);

export default Bio;