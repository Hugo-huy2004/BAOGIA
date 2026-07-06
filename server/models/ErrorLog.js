import mongoose from 'mongoose';

// Persistent error/event log for the admin "System" dashboard. Auto-pruned via
// TTL so it can never bloat the free-tier database.
const ErrorLogSchema = new mongoose.Schema({
  level: { type: String, enum: ['error', 'warn', 'info'], default: 'error', index: true },
  source: { type: String, default: 'server', index: true }, // e.g. 'gemini', 'payos', 'unhandledRejection', 'client'
  message: { type: String, required: true },
  stack: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  path: { type: String, default: '' },      // request path if applicable
  email: { type: String, default: '' },     // affected user if known
  createdAt: { type: Date, default: Date.now },
});

// Keep only 30 days of logs.
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
ErrorLogSchema.index({ createdAt: -1 });

export default mongoose.model('ErrorLog', ErrorLogSchema);
