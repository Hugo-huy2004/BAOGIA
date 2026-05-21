import mongoose from 'mongoose';

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    duration: {
      type: Number, // duration value (e.g. 3, 12, 90)
      required: true
    },
    durationUnit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    },
    benefits: {
      type: [String],
      default: []
    },
    color: {
      type: String,
      required: true
    },
    giftCode: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
      unique: true
    }
  },
  { timestamps: true }
);

const Package = mongoose.model('Package', PackageSchema);
export default Package;
