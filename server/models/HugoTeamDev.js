import mongoose from "mongoose";

// One document per applicant/developer. Tasks, hour logs and the admin↔dev
// message thread are embedded: a dev accumulates tens of entries, not
// thousands, so a single doc keeps every read one query.

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Hướng dẫn chi tiết của admin (văn bản thuần / markdown đơn giản)
    guide: { type: String, default: "" },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ["assigned", "doing", "submitted", "done", "cancelled"],
      default: "assigned",
    },
    // Ghi chú của dev khi cập nhật / nộp task
    devNote: { type: String, default: "" },
    // Nhận xét của admin khi nghiệm thu
    adminNote: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
    doneAt: { type: Date, default: null },
  },
  { _id: true }
);

const hourLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    note: { type: String, default: "" },
    // Optional link to the task the hours were spent on
    taskId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    loggedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["admin", "dev"], required: true },
    text: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
    readByDev: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
  },
  { _id: true }
);

const hugoTeamDevSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true }, // Full name from Google/form
    school: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    cv: { type: String, default: "" },
    cvPath: { type: String, default: "" },
    approvedAt: { type: Date, default: null },

    tasks: [taskSchema],
    hourLogs: [hourLogSchema],
    messages: [messageSchema],
  },
  { timestamps: true }
);

// Tổng giờ đồng hành đã được admin duyệt — nguồn duy nhất cho mốc 500h.
hugoTeamDevSchema.methods.approvedHours = function () {
  return this.hourLogs
    .filter((l) => l.status === "approved")
    .reduce((sum, l) => sum + l.hours, 0);
};

hugoTeamDevSchema.methods.pendingHours = function () {
  return this.hourLogs
    .filter((l) => l.status === "pending")
    .reduce((sum, l) => sum + l.hours, 0);
};

export default mongoose.model("HugoTeamDev", hugoTeamDevSchema);
