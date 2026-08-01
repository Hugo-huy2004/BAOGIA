import mongoose from 'mongoose';

/**
 * Push registration for the App Store / Play Store builds.
 *
 * Deliberately a separate collection from NotificationSubscription rather than a
 * variant of it: that schema requires `subscription.endpoint` and marks it
 * unique, and a native device has no endpoint at all. Storing native rows there
 * would leave several documents with a null endpoint, which the unique index
 * rejects — and fixing that would mean dropping a live index on a collection
 * that web push depends on. A second collection costs nothing and leaves the
 * working web path untouched.
 *
 * `token` is the FCM registration token on Android and the APNs device token on
 * iOS. Both are opaque strings that rotate, so the client re-registers on every
 * launch and upserts on token.
 */
const nativePushDeviceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  platform: {
    type: String,
    enum: ['ios', 'android'],
    required: true,
  },
  appVersion: { type: String, default: '' },
  locale: { type: String, default: '' },
  timezone: { type: String, default: '' },
  lastSeenAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

// One person can carry several devices; the token is what must stay unique.
nativePushDeviceSchema.index({ email: 1, platform: 1 });

export default mongoose.models.NativePushDevice
  || mongoose.model('NativePushDevice', nativePushDeviceSchema);
