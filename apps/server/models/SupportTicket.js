import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    issue: {
      type: String,
      required: true
    },
    ipHash: { type: String, select: false },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending'
    },
    adminReply: { type: String, default: '', maxlength: 5000 },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ email: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ ipHash: 1 }, { unique: true, partialFilterExpression: { ipHash: { $type: 'string' } } });

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
