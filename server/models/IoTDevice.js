import mongoose from 'mongoose';

const VitalSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    heartRate: { type: Number },
    steps: { type: Number },
    sleepMinutes: { type: Number },
    bloodPressureSys: { type: Number },
    bloodPressureDia: { type: Number },
    weight: { type: Number },
    temperature: { type: Number },
    oxygenSat: { type: Number },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const IoTDeviceSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      unique: true
    },
    deviceName: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ['wearable', 'health_monitor', 'smart_scale', 'blood_pressure'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastSeen: {
      type: Date,
      default: null
    },
    apiToken: {
      type: String,
      required: true,
      index: true
    },
    vitals: {
      type: [VitalSchema],
      default: []
    }
  },
  { timestamps: true }
);

IoTDeviceSchema.index({ email: 1, deviceId: 1 });

const IoTDevice = mongoose.model('IoTDevice', IoTDeviceSchema);
export default IoTDevice;
