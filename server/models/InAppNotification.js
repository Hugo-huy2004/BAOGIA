import mongoose from 'mongoose';

const MAX_PER_ACCOUNT = 100;

const schema = new mongoose.Schema({
  email:     { type: String, required: true, index: true },
  type:      { type: String, enum: ['success', 'warning', 'info', 'error'], default: 'info' },
  category:  { type: String, enum: ['verification', 'package', 'system', 'wellness', 'security', 'joy', 'payment', 'general'], default: 'system' },
  title:     { type: String, required: true },
  message:   { type: String, default: '' },
  read:      { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete after 90 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

// Hard per-account cap — unified "thông báo" feed now also carries every JOY
// transaction, so it grows much faster than the old alerts-only inbox.
// Trims the oldest entries past MAX_PER_ACCOUNT right after every single
// create()/save(), keeping each account's table bounded regardless of the
// 90-day TTL above (which only kicks in much later).
schema.post('save', async function (doc) {
  const InAppNotification = doc.constructor;
  const count = await InAppNotification.countDocuments({ email: doc.email });
  if (count > MAX_PER_ACCOUNT) {
    const stale = await InAppNotification.find({ email: doc.email })
      .sort({ createdAt: 1 })
      .limit(count - MAX_PER_ACCOUNT)
      .select('_id');
    await InAppNotification.deleteMany({ _id: { $in: stale.map(d => d._id) } });
  }
});

const InAppNotification = mongoose.model('InAppNotification', schema);

// insertMany() (e.g. admin broadcast-all) bypasses document middleware, so
// call this manually afterward for each affected email.
export async function pruneNotifications(email) {
  const count = await InAppNotification.countDocuments({ email });
  if (count > MAX_PER_ACCOUNT) {
    const stale = await InAppNotification.find({ email })
      .sort({ createdAt: 1 })
      .limit(count - MAX_PER_ACCOUNT)
      .select('_id');
    await InAppNotification.deleteMany({ _id: { $in: stale.map(d => d._id) } });
  }
}

export default InAppNotification;
