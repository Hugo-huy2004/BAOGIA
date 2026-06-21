import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email:     { type: String, required: true, index: true },
  type:      { type: String, enum: ['success', 'warning', 'info', 'error'], default: 'info' },
  category:  { type: String, enum: ['verification', 'package', 'system', 'wellness', 'security', 'joy'], default: 'system' },
  title:     { type: String, required: true },
  message:   { type: String, default: '' },
  read:      { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete after 90 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

export default mongoose.model('InAppNotification', schema);
