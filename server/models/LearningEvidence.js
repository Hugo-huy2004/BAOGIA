import mongoose from 'mongoose';

const LearningEvidenceSchema = new mongoose.Schema(
  {
    schemaVersion: { type: Number, default: 1, immutable: true },
    ownerMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bio',
      required: true,
      index: true,
      immutable: true,
    },
    sourceApp: { type: String, required: true, enum: ['study'], immutable: true },
    source: {
      type: {
        type: String,
        required: true,
        enum: ['lesson'],
        immutable: true,
      },
      id: { type: String, required: true, maxlength: 100, immutable: true },
    },
    kind: {
      type: String,
      required: true,
      enum: ['lesson_completion'],
      immutable: true,
    },
    title: {
      type: String,
      required() { return this.status === 'active'; },
      maxlength: 240,
    },
    skillTags: {
      type: [{ type: String, maxlength: 60 }],
      default: [],
      validate: [(tags) => tags.length <= 8, 'Too many skill tags'],
    },
    occurredAt: { type: Date, required: true, index: true },
    proof: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

// Vĩnh viễn không có hai minh chứng cho cùng một sự kiện. Bản ghi đã xoá vẫn
// giữ tuple này làm tombstone, nhờ vậy retry/đồng bộ cũ không dựng nó lại.
LearningEvidenceSchema.index(
  {
    ownerMemberId: 1,
    sourceApp: 1,
    'source.type': 1,
    'source.id': 1,
    kind: 1,
  },
  { unique: true },
);
LearningEvidenceSchema.index({ ownerMemberId: 1, status: 1, occurredAt: -1, _id: -1 });

export default mongoose.models.LearningEvidence
  || mongoose.model('LearningEvidence', LearningEvidenceSchema);
