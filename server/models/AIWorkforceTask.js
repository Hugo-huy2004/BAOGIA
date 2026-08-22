import mongoose from 'mongoose';

const AIWorkforceTaskSchema = new mongoose.Schema(
  {
    agentKey: {
      type: String,
      enum: [
        'support',
        'operations',
        'knowledge',
        'risk',
        'server_specialist',
        'ui_specialist',
      ],
      required: true,
      index: true,
    },
    objective: { type: String, required: true, maxlength: 2000 },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    requestedBy: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'awaiting_approval',
        'executing',
        'completed',
        'failed',
        'rejected',
      ],
      default: 'queued',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    requiresApproval: { type: Boolean, default: false },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    proposedAction: { type: mongoose.Schema.Types.Mixed, default: null },
    executionResult: { type: mongoose.Schema.Types.Mixed, default: null },
    decision: {
      status: {
        type: String,
        enum: ['not_required', 'pending', 'approved', 'rejected'],
        default: 'not_required',
      },
      decidedBy: { type: String, default: '' },
      decidedAt: { type: Date, default: null },
      note: { type: String, default: '', maxlength: 2000 },
    },
    error: { type: String, default: '', maxlength: 4000 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AIWorkforceTaskSchema.index({ status: 1, createdAt: -1 });
AIWorkforceTaskSchema.index({ agentKey: 1, createdAt: -1 });

export default mongoose.models.AIWorkforceTask ||
  mongoose.model('AIWorkforceTask', AIWorkforceTaskSchema);
