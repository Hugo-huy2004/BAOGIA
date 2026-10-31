import mongoose from 'mongoose';

const CheckinRecordSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    lastCheckinDate: { type: String, default: '' },   // 'YYYY-MM-DD', last successful claim
    consecutiveDays: { type: Number, default: 0 },     // daily streak; one missed day per 7 is forgiven (graceUsedOn)
    weekStartDate: { type: String, default: '' },      // 'YYYY-MM-DD' Monday anchoring the current weekly cycle
    weekLocked: { type: Boolean, default: false },     // true once a day is missed mid-week
    claimedDaysThisWeek: { type: [Number], default: [] }, // which day-of-week slots (1-7) claimed this week
    milestone14Awarded: { type: Boolean, default: false },
    milestone30Awarded: { type: Boolean, default: false },
    graceUsedOn: { type: String, default: '' }          // 'YYYY-MM-DD' the forgiven missed day was last used
  },
  { timestamps: true }
);

const CheckinRecord = mongoose.model('CheckinRecord', CheckinRecordSchema);
export default CheckinRecord;
