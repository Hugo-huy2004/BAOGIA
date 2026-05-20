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
    }
  },
  { timestamps: true }
);

const Package = mongoose.model('Package', PackageSchema);
export default Package;
