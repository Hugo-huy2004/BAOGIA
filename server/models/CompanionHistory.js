import mongoose from 'mongoose';

const CompanionHistorySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
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
    }
  },
  { timestamps: true, versionKey: false }
);

const CompanionHistory = mongoose.model('CompanionHistory', CompanionHistorySchema);
export default CompanionHistory;
