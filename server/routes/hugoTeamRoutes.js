import express from "express";
import { requireMember, requireAdmin } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import HugoTeamDev from "../models/HugoTeamDev.js";
import {
  sendHugoTeamApplyConfirm,
  sendHugoTeamApproved,
  sendHugoTeamRejected,
  sendCustomEmail,
} from "../services/emailService.js";

const router = express.Router();

// Configure multer for CV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/cvs/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `cv_${timestamp}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Only PDF files allowed"));
    }
    cb(null, true);
  },
});

// Fire-and-forget email — a mail failure must never fail the API call.
const notifyByEmail = (to, subject, html) =>
  sendCustomEmail(to, subject, html).catch(() => {});

const devEmailWrap = (inner) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    ${inner}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">HugoTeam — mở tab Hugo Team trong Member Portal để xem chi tiết.</p>
  </div>`;

/* ─────────────────────────── Public ─────────────────────────── */

// Approved developer list — name/school only, emails are private.
router.get("/developers", async (req, res) => {
  try {
    const devs = await HugoTeamDev.find({ status: "approved" }).select("name school approvedAt");
    res.json({
      developers: devs.map((d) => ({ id: d._id, name: d.name, school: d.school })),
    });
  } catch (error) {
    console.error("GET developers error:", error);
    res.status(500).json({ error: "Failed to load developers" });
  }
});

/* ─────────────────────────── Member (identity = req.memberEmail) ─────────────────────────── */

// Everything the dev dashboard needs in one call.
router.get("/me", requireMember, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail });
    if (!dev) return res.json({ status: null });
    if (dev.status !== "approved") return res.json({ status: dev.status });

    res.json({
      status: "approved",
      name: dev.name,
      approvedAt: dev.approvedAt,
      stats: {
        approvedHours: dev.approvedHours(),
        pendingHours: dev.pendingHours(),
        openTasks: dev.tasks.filter((t) => ["assigned", "doing", "submitted"].includes(t.status)).length,
        doneTasks: dev.tasks.filter((t) => t.status === "done").length,
        unreadMessages: dev.messages.filter((m) => m.from === "admin" && !m.readByDev).length,
      },
      tasks: dev.tasks.sort((a, b) => b.assignedAt - a.assignedAt),
      hourLogs: dev.hourLogs.sort((a, b) => b.date - a.date),
      messages: dev.messages.sort((a, b) => a.at - b.at),
    });
  } catch (error) {
    console.error("GET me error:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// Dev updates their task: start it, or submit it with a note.
router.patch("/me/tasks/:taskId", requireMember, async (req, res) => {
  try {
    const { status, devNote } = req.body;
    if (status && !["doing", "submitted"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail, status: "approved" });
    const task = dev?.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (["done", "cancelled"].includes(task.status)) {
      return res.status(400).json({ error: "Task already closed" });
    }
    if (status) task.status = status;
    if (typeof devNote === "string") task.devNote = devNote.slice(0, 2000);
    await dev.save();
    res.json({ success: true, task });
  } catch (error) {
    console.error("PATCH me task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Dev logs companion hours (pending until admin approves).
router.post("/me/hours", requireMember, async (req, res) => {
  try {
    const { date, hours, note, taskId } = req.body;
    const h = Number(hours);
    if (!date || !Number.isFinite(h) || h < 0.25 || h > 24) {
      return res.status(400).json({ error: "Giờ không hợp lệ (0.25–24)" });
    }
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail, status: "approved" });
    if (!dev) return res.status(403).json({ error: "Not an approved developer" });
    dev.hourLogs.push({
      date: new Date(date),
      hours: h,
      note: String(note || "").slice(0, 500),
      taskId: taskId || null,
    });
    await dev.save();
    res.json({ success: true, hourLogs: dev.hourLogs });
  } catch (error) {
    console.error("POST me hours error:", error);
    res.status(500).json({ error: "Failed to log hours" });
  }
});

// Dev can withdraw an hour log while it's still pending.
router.delete("/me/hours/:logId", requireMember, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail, status: "approved" });
    const log = dev?.hourLogs.id(req.params.logId);
    if (!log) return res.status(404).json({ error: "Log not found" });
    if (log.status !== "pending") return res.status(400).json({ error: "Log already reviewed" });
    log.deleteOne();
    await dev.save();
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE me hours error:", error);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

// Dev sends a message to admin.
router.post("/me/messages", requireMember, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim().slice(0, 2000);
    if (!text) return res.status(400).json({ error: "Empty message" });
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail, status: "approved" });
    if (!dev) return res.status(403).json({ error: "Not an approved developer" });
    dev.messages.push({ from: "dev", text, readByDev: true });
    await dev.save();
    res.json({ success: true, messages: dev.messages });
  } catch (error) {
    console.error("POST me message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark all admin messages as read.
router.post("/me/messages/read", requireMember, async (req, res) => {
  try {
    await HugoTeamDev.updateOne(
      { email: req.memberEmail },
      { $set: { "messages.$[m].readByDev": true } },
      { arrayFilters: [{ "m.from": "admin", "m.readByDev": false }] }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("POST me messages read error:", error);
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// Submit CV application.
router.post("/apply", upload.single("cv"), requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const name = String(req.body.name || "").trim();
    const file = req.file;
    if (!email || !name || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await HugoTeamDev.findOne({ email });
    if (existing && existing.status !== "rejected") {
      return res.status(400).json({ error: "Already applied or approved" });
    }

    // Re-application after rejection overwrites the old doc.
    await HugoTeamDev.findOneAndUpdate(
      { email },
      {
        email,
        name,
        school: req.body.school || "",
        status: "pending",
        cv: file.filename,
        cvPath: file.path,
      },
      { upsert: true }
    );

    await sendHugoTeamApplyConfirm(name, email);
    res.json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("POST apply error:", error);
    res.status(500).json({ error: error.message || "Failed to submit application" });
  }
});

/* ─────────────────────────── Admin ─────────────────────────── */

router.get("/admin/applicants", requireAdmin, async (req, res) => {
  try {
    const apps = await HugoTeamDev.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({
      applicants: apps.map((a) => ({
        email: a.email,
        name: a.name,
        school: a.school,
        createdAt: a.createdAt,
        cv: a.cv,
        cvPath: `/uploads/cvs/${a.cv}`,
      })),
    });
  } catch (error) {
    console.error("GET applicants error:", error);
    res.status(500).json({ error: "Failed to load applicants" });
  }
});

router.post("/admin/approve", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.body.email, status: "pending" });
    if (!dev) return res.status(404).json({ error: "Applicant not found" });
    dev.status = "approved";
    dev.approvedAt = new Date();
    await dev.save();
    await sendHugoTeamApproved(dev.name, dev.email);
    res.json({ success: true, message: `${dev.name} approved as developer` });
  } catch (error) {
    console.error("POST approve error:", error);
    res.status(500).json({ error: "Failed to approve applicant" });
  }
});

router.post("/admin/reject", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.body.email, status: "pending" });
    if (!dev) return res.status(404).json({ error: "Applicant not found" });
    dev.status = "rejected";
    await dev.save();
    await sendHugoTeamRejected(dev.name, dev.email);
    res.json({ success: true, message: `${dev.name} rejected` });
  } catch (error) {
    console.error("POST reject error:", error);
    res.status(500).json({ error: "Failed to reject applicant" });
  }
});

// Team overview: every approved dev with live stats.
router.get("/admin/devs", requireAdmin, async (req, res) => {
  try {
    const devs = await HugoTeamDev.find({ status: "approved" }).sort({ approvedAt: 1 });
    res.json({
      devs: devs.map((d) => ({
        email: d.email,
        name: d.name,
        school: d.school,
        approvedAt: d.approvedAt,
        approvedHours: d.approvedHours(),
        pendingHours: d.pendingHours(),
        openTasks: d.tasks.filter((t) => ["assigned", "doing", "submitted"].includes(t.status)).length,
        submittedTasks: d.tasks.filter((t) => t.status === "submitted").length,
        pendingLogs: d.hourLogs.filter((l) => l.status === "pending").length,
        unreadMessages: d.messages.filter((m) => m.from === "dev" && !m.readByAdmin).length,
      })),
    });
  } catch (error) {
    console.error("GET admin devs error:", error);
    res.status(500).json({ error: "Failed to load devs" });
  }
});

// Full detail for one dev (tasks + hour logs + messages).
router.get("/admin/devs/:email", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email, status: "approved" });
    if (!dev) return res.status(404).json({ error: "Dev not found" });
    res.json({
      dev: {
        email: dev.email,
        name: dev.name,
        school: dev.school,
        approvedAt: dev.approvedAt,
        approvedHours: dev.approvedHours(),
        pendingHours: dev.pendingHours(),
        tasks: dev.tasks.sort((a, b) => b.assignedAt - a.assignedAt),
        hourLogs: dev.hourLogs.sort((a, b) => b.date - a.date),
        messages: dev.messages.sort((a, b) => a.at - b.at),
      },
    });
  } catch (error) {
    console.error("GET admin dev error:", error);
    res.status(500).json({ error: "Failed to load dev" });
  }
});

// Assign a task (emails the dev — admin's main channel is email).
router.post("/admin/devs/:email/tasks", requireAdmin, async (req, res) => {
  try {
    const { title, guide, deadline } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title required" });
    const dev = await HugoTeamDev.findOne({ email: req.params.email, status: "approved" });
    if (!dev) return res.status(404).json({ error: "Dev not found" });
    dev.tasks.push({
      title: title.trim().slice(0, 200),
      guide: String(guide || "").slice(0, 5000),
      deadline: deadline ? new Date(deadline) : null,
    });
    await dev.save();
    notifyByEmail(
      dev.email,
      `Nhiệm vụ mới từ Hugo Studio: ${title.trim().slice(0, 80)}`,
      devEmailWrap(`
        <h2 style="color:#333;">Chào ${dev.name}!</h2>
        <p style="color:#666;">Bạn vừa được giao một nhiệm vụ mới:</p>
        <p style="color:#333;"><strong>${title.trim()}</strong></p>
        ${deadline ? `<p style="color:#666;">Hạn hoàn thành: <strong>${new Date(deadline).toLocaleDateString("vi-VN")}</strong></p>` : ""}
        ${guide ? `<p style="color:#666;white-space:pre-wrap;">${String(guide).slice(0, 1000)}</p>` : ""}
      `)
    );
    res.json({ success: true, tasks: dev.tasks });
  } catch (error) {
    console.error("POST admin task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Edit / review a task: change fields, accept (done) or cancel.
router.patch("/admin/devs/:email/tasks/:taskId", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email, status: "approved" });
    const task = dev?.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const { title, guide, deadline, status, adminNote } = req.body;
    if (title?.trim()) task.title = title.trim().slice(0, 200);
    if (typeof guide === "string") task.guide = guide.slice(0, 5000);
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;
    if (typeof adminNote === "string") task.adminNote = adminNote.slice(0, 2000);
    if (status) {
      if (!["assigned", "doing", "submitted", "done", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      task.status = status;
      task.doneAt = status === "done" ? new Date() : task.doneAt;
    }
    await dev.save();
    res.json({ success: true, task });
  } catch (error) {
    console.error("PATCH admin task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Approve / reject an hour log.
router.patch("/admin/devs/:email/hours/:logId", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const dev = await HugoTeamDev.findOne({ email: req.params.email, status: "approved" });
    const log = dev?.hourLogs.id(req.params.logId);
    if (!log) return res.status(404).json({ error: "Log not found" });
    log.status = status;
    log.reviewedAt = new Date();
    await dev.save();
    res.json({ success: true, approvedHours: dev.approvedHours(), hourLogs: dev.hourLogs });
  } catch (error) {
    console.error("PATCH admin hours error:", error);
    res.status(500).json({ error: "Failed to review hours" });
  }
});

// Send a guidance message to the dev (also emailed).
router.post("/admin/devs/:email/messages", requireAdmin, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim().slice(0, 2000);
    if (!text) return res.status(400).json({ error: "Empty message" });
    const dev = await HugoTeamDev.findOne({ email: req.params.email, status: "approved" });
    if (!dev) return res.status(404).json({ error: "Dev not found" });
    dev.messages.push({ from: "admin", text, readByAdmin: true });
    await dev.save();
    notifyByEmail(
      dev.email,
      "Tin nhắn mới từ Hugo Studio",
      devEmailWrap(`
        <h2 style="color:#333;">Chào ${dev.name}!</h2>
        <p style="color:#666;white-space:pre-wrap;">${text}</p>
      `)
    );
    res.json({ success: true, messages: dev.messages });
  } catch (error) {
    console.error("POST admin message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark a dev's messages as read by admin.
router.post("/admin/devs/:email/messages/read", requireAdmin, async (req, res) => {
  try {
    await HugoTeamDev.updateOne(
      { email: req.params.email },
      { $set: { "messages.$[m].readByAdmin": true } },
      { arrayFilters: [{ "m.from": "dev", "m.readByAdmin": false }] }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("POST admin messages read error:", error);
    res.status(500).json({ error: "Failed to mark read" });
  }
});

export default router;
