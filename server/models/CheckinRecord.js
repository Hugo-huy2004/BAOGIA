import mongoose from 'mongoose';

const CheckinRecordSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    lastCheckinDate: { type: String, default: '' },   // 'YYYY-MM-DD', last successful claim
    consecutiveDays: { type: Number, default: 0 },     // unbroken daily streak, resets to 0 on any gap
    weekStartDate: { type: String, default: '' },      // 'YYYY-MM-DD' Monday anchoring the current weekly cycle
    weekLocked: { type: Boolean, default: false },     // true once a day is missed mid-week
    claimedDaysThisWeek: { type: [Number], default: [] }, // which day-of-week slots (1-7) claimed this week
    milestone14Awarded: { type: Boolean, default: false },
    milestone30Awarded: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const CheckinRecord = mongoose.model('CheckinRecord', CheckinRecordSchema);
export default CheckinRecord;
