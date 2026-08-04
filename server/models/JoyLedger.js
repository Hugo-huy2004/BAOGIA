import mongoose from 'mongoose';
import { JOY_SOURCE_KEYS } from '../utils/joySources.js';

const JoyLedgerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  // Danh mục nguồn nằm ở utils/joySources.js — thêm nguồn mới sửa ở đó, đừng
  // chép lại danh sách vào đây (đó chính là thứ đã làm app_plan bị rớt).
  source: {
    type: String,
    enum: JOY_SOURCE_KEYS,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  refId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

JoyLedgerSchema.index({ email: 1, createdAt: -1 });

const JoyLedger = mongoose.model('JoyLedger', JoyLedgerSchema);
export default JoyLedger;
