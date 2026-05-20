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
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
