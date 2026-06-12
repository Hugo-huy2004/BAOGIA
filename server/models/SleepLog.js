import mongoose from 'mongoose';

const SleepLogSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  date:  { type: String, required: true }, // "YYYY-MM-DD" — the night date

  // Core sleep data
  bedtime:  { type: String },   // "23:30"
  wakeTime: { type: String },   // "06:45"
  duration: { type: Number },   // hours (computed)
  quality:  { type: Number, min: 1, max: 5 }, // 1=rất tệ, 5=rất tốt

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

  // AI analysis result (cached)
  aiAnalysis: { type: String },
  aiAnalyzedAt: { type: Date },
}, { timestamps: true });

// Compound index: one log per user per date
SleepLogSchema.index({ email: 1, date: 1 }, { unique: true });
SleepLogSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('SleepLog', SleepLogSchema);
