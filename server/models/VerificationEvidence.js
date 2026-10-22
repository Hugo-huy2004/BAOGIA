import mongoose from 'mongoose';

const VerificationEvidenceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bio',
    required: true,
    index: true,
  },
  mime: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, { versionKey: false });

VerificationEvidenceSchema.index({ memberId: 1, uploadedAt: -1 });

export default mongoose.models.VerificationEvidence
  || mongoose.model('VerificationEvidence', VerificationEvidenceSchema);
