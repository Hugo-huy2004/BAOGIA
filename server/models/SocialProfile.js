import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  discoverable: { type: Boolean, default: false },
  shareLocation: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] },
  },
  locationSource: { type: String, enum: ['gps', 'ip'], default: null },
  locationPrecisionKm: { type: Number, min: 0.1, max: 100, default: null },
  locationUpdatedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ location: '2dsphere' }, { sparse: true });

export default mongoose.model('SocialProfile', schema);
