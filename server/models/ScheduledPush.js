import mongoose from 'mongoose';

const ScheduledPushSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  feature: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  sent: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

export default mongoose.model('ScheduledPush', ScheduledPushSchema);
