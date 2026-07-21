import mongoose from 'mongoose';

const SleepLogSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  date:  { type: String, required: true }, // "YYYY-MM-DD" — the night date

  // Core sleep data
  bedtime:  { type: String },   // "23:30"
  wakeTime: { type: String },   // "06:45"
  duration: { type: Number },   // hours (computed)
  quality:  { type: Number, min: 1, max: 5 }, // 1=rất tệ, 5=rất tốt

  // Clinical sleep metrics (PSQI-aligned)
  sleepLatency:   { type: Number, min: 0, max: 120 },   // minutes to fall asleep
  awakenings:     { type: Number, min: 0, max: 20 },     // number of awakenings during night
  wakeAfterSleepOnset: { type: Number, min: 0, max: 180 }, // minutes awake after initially falling asleep

  // Behavioral context (affect sleep quality)
  screenTime:     { type: Number, min: 0, max: 480 },    // minutes of screen use before bed
  caffeine:       { type: String, enum: ["none","light","moderate","heavy",""], default: "" }, // caffeine intake level
  exercise:       { type: String, enum: ["none","light","moderate","intense",""], default: "" }, // exercise level that day
  alcohol:        { type: String, enum: ["none","light","moderate","heavy",""], default: "" }, // alcohol intake
  sleepEnvironment: { type: String, enum: ["excellent","good","fair","poor",""], default: "" }, // room quality
  stressLevel:    { type: Number, min: 1, max: 5 },      // perceived stress before bed

  // Context
  notes:       { type: String, maxlength: 500 },
  mood:        { type: String, enum: ["great","good","okay","bad","terrible"] },
  dreamNotes:  { type: String, maxlength: 300 },

  // Auto-detection metadata
  lastActiveAt:    { type: Date },
  firstActiveAt:   { type: Date },
  passiveDetected: { type: Boolean, default: false },
  autoConfidence:  { type: Number, min: 0, max: 100 }, // AI/signal confidence %
  autoSignals:     [{ type: String }],                  // which signals triggered detection

  // Sleep stages (estimated from motion patterns, auto-detect only)
  sleepStages: {
    light:  { type: Number, min: 0, max: 100 },  // % of total sleep
    deep:   { type: Number, min: 0, max: 100 },  // % of total sleep
    rem:    { type: Number, min: 0, max: 100 },  // % of total sleep
    awake:  { type: Number, min: 0, max: 100 },  // % of total time in bed
  },
  sleepEfficiency: { type: Number, min: 0, max: 100 }, // % (sleep duration / time in bed)

  // AI analysis result (cached)
  aiAnalysis: { type: String },
  aiAnalyzedAt: { type: Date },
}, { timestamps: true });

// Compound index: one log per user per date
SleepLogSchema.index({ email: 1, date: 1 }, { unique: true });
SleepLogSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('SleepLog', SleepLogSchema);
