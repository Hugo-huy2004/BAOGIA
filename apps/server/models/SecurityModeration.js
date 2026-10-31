import mongoose from 'mongoose';

const securityModerationSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    subjectType: { type: String, enum: ['ip', 'email', 'phone'], default: 'ip' },
    subjectValue: { type: String, required: true },
    ip: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    category: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    ruleId: { type: String, default: '' },
    evidence: { type: String, default: '' },
    path: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'dismissed'], default: 'pending', index: true },
    decidedBy: { type: String, default: '' },
    decidedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.SecurityModeration || mongoose.model('SecurityModeration', securityModerationSchema);
