import mongoose from 'mongoose';

const RobotConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'ROBOT_STREAM_CONFIG'
    },
    // Triple-Layer Encryption Fields
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    checksum: { type: String, required: true },
    updatedBy: { type: String, default: 'SuperAdmin' },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const RobotConfig = mongoose.models.RobotConfig || mongoose.model('RobotConfig', RobotConfigSchema);
export default RobotConfig;
