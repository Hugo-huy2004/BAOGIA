import mongoose from 'mongoose';

const CompanionHistorySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    blockedUntil: {
      type: Date,
      default: null
    },
    healingActive: {
      type: Boolean,
      default: false
    },
    healingDuration: {
      type: Number,
      default: 30
    },
    healingStartDate: {
      type: Date
    },
    lastCheckinDate: {
      type: String,
      default: ''
    },
    chatDistressCount: {
      type: Number,
      default: 0
    },
    lastTestDate: {
      type: String,
      default: ''
    },
    historyLogs: {
      type: [{
        date: { type: Date, default: Date.now },
        type: { type: String }, // 'checkin' | 'clinical_test' | 'therapy_activity' | 'chat_anomaly' | 'upload_anomaly' | 'duration_change'
        test: { type: String }, // 'phq9' | 'gad7' | 'who5' | 'bigfive' | 'dass42' | 'mmpi30'
        score: { type: Number },
        scores: {
          D: { type: Number },
          A: { type: Number },
          S: { type: Number }
        },
        severities: {
          D: { type: String },
          A: { type: String },
          S: { type: String }
        },
        status: { type: String },
        percent: { type: Number },
        validity: {
          L: { type: Number },
          F: { type: Number },
          K: { type: Number }
        },
        isReliable: { type: Boolean },
        clinical: [{
          code: { type: String },
          score: { type: Number }
        }],
        traits: {
          extraversion: { type: Number },
          agreeableness: { type: Number },
          conscientiousness: { type: Number },
          neuroticism: { type: Number },
          openness: { type: Number }
        },
        desc: { type: String },
        name: { type: String },
        reason: { type: String },
        day: { type: Number },
        note: { type: String },
        wheelRatings: [Number],
        hospitalName: { type: String },
        doctorName: { type: String },
        isUploaded: { type: Boolean }
      }],
      default: []
    },
    chatMessages: {
      type: [{
        id: { type: String },
        sender: { type: String },
        text: { type: String },
        time: { type: Date, default: Date.now },
        isCompanionSetup: { type: Boolean },
        recommendedDays: { type: Number },
        selectedChoice: { type: mongoose.Schema.Types.Mixed },
        showTherapyButton: { type: Boolean },
        suggestPhq9: { type: Boolean },
        suggestGad7: { type: Boolean },
        suggestWho5: { type: Boolean },
        suggestBigFive: { type: Boolean }
      }],
      default: []
    },

    // IoT Integration
    iotDevices: [{ deviceId: String, deviceName: String, lastSync: Date }],
    iotVitalsSnapshot: {
      wellnessScore: { type: Number, default: null },
      lastAnalyzed: { type: Date, default: null },
      heartRateTrend: { type: String },
      sleepQuality: { type: String },
      activityLevel: { type: String }
    },

    // Enhanced personalization
    personalityProfile: {
      bigFiveTraits: {
        extraversion: Number,
        agreeableness: Number,
        conscientiousness: Number,
        neuroticism: Number,
        openness: Number
      },
      lastProfileDate: Date,
      dominantTrait: String
    },

    // Weekly report
    lastWeeklyReport: {
      generatedAt: Date,
      summary: String,
      moodTrend: String,
      wellnessScore: Number
    },

    // Streak tracking
    streaks: {
      currentCheckinStreak: { type: Number, default: 0 },
      longestCheckinStreak: { type: Number, default: 0 },
      lastStreakDate: String,
      totalSessions: { type: Number, default: 0 }
    },

    // Crisis detection
    crisisFlags: [{
      detectedAt: Date,
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      trigger: String,
      resolved: { type: Boolean, default: false },
      // Populated only for instant high-severity flags raised directly by the
      // local self-harm/suicide-risk detector (see ChatTab.jsx isCrisisText),
      // not by the gradual chatDistressCount accumulator — gives Admin the
      // context needed to call the user back immediately without digging
      // through their full chat history.
      phone: { type: String, default: '' },
      conversationSummary: { type: String, default: '' }
    }],

    // JOY session-time tracking (heartbeat-based, see /api/companion/heartbeat)
    activeSecondsToday: { type: Number, default: 0 },
    activeSecondsDate: { type: String, default: '' },     // 'YYYY-MM-DD'
    joyAwardedSecondsToday: { type: Number, default: 0 },
    dailyJoyCapReached: { type: Boolean, default: false },
    claimedChallengesToday: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: false }
);

CompanionHistorySchema.index({ updatedAt: -1 });

const CompanionHistory = mongoose.model('CompanionHistory', CompanionHistorySchema);
export default CompanionHistory;
