import mongoose from "mongoose";

const ClientMetricSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["web-vital", "api-summary"],
    required: true,
    index: true,
  },
  name: { type: String, default: "", index: true },
  rating: { type: String, default: "" },
  value: { type: Number, default: 0 },
  requestCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  device: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"], default: "unknown", index: true },
  network: { type: String, default: "" },
  page: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

ClientMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
ClientMetricSchema.index({ type: 1, name: 1, createdAt: -1 });

export default mongoose.model("ClientMetric", ClientMetricSchema);
