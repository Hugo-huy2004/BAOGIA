import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    index: true
  },
  adminEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    index: true
  }, // e.g. 'ADJUST_JOY', 'REVOKE_SESSION', 'LOCK_USER', 'UNLOCK_USER', 'SEND_EMAIL', 'UPDATE_SETTINGS'
  targetUserId: {
    type: String,
    default: '',
    index: true
  },
  targetUserEmail: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema);
export default AdminAuditLog;
