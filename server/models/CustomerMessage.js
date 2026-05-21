import mongoose from 'mongoose';

const CustomerMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProject',
      required: true,
      index: true
    },
    sender: {
      type: String,
      enum: ['admin', 'customer'],
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('CustomerMessage', CustomerMessageSchema);
