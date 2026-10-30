import express from "express";
import { requireMember, requireAdmin, requireAdultMember } from "../middleware/authMiddleware.js";
import { bioAge, MEMBER_MIN_AGE, GUARDIAN_CONSENT_AGE } from "../utils/memberAge.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import HugoTeamDev from "../models/HugoTeamDev.js";
import Bio from "../models/Bio.js";
import { awardJoy } from "../utils/joyService.js";
import {
  sendHugoTeamApplyConfirm,
  sendHugoTeamApproved,
  sendHugoTeamRejected,
  sendCustomEmail,
  escapeHtml,
} from "../services/emailService.js";
import { CODER_TOTAL_STEPS, completedCoderSteps } from "../../shared/coderProgression.js";

const router = express.Router();

// Configure multer for CV upload — ensure the dir exists (a fresh checkout or
// clean deploy doesn't have it, and multer errors with ENOENT instead of creating it).
const CV_DIR = "uploads/cvs";
fs.mkdirSync(CV_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CV_DIR);
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

/**
 * Tiến độ Coding của HugoTeam = tiến độ trong ứng dụng Coding (bio.completedLessons),
 * không còn sổ riêng. Chép lại vào HugoTeamDev chỉ để màn admin/mentor đọc nhanh;
 * đủ toàn bộ step thì gửi lời mời vào Team. Gọi mỗi khi cần số liệu mới nhất.
 */
async function syncTeamCoding(dev) {
  if (!dev?.email) return dev;
  const bio = await Bio.findOne({ $or: [{ email: dev.email }, { contactEmail: dev.email }] }).select("completedLessons hugoCoderExamScores").lean();
  const steps = completedCoderSteps(bio?.completedLessons);
  const scores = Object.fromEntries(steps.filter((id) => bio?.hugoCoderExamScores?.[id]).map((id) => [id, bio.hugoCoderExamScores[id]]));
  const changed = steps.length !== (dev.codingCompletedSteps || []).length;
  dev.codingCompletedSteps = steps;
  dev.codingStepScores = scores;
  const shouldInvite = dev.assessmentStage === "coding" && steps.length >= CODER_TOTAL_STEPS;
  if (shouldInvite) {
    dev.assessmentStage = "passed";
    dev.teamInvitedAt ||= new Date();
  }
  if (changed || dev.isModified?.("assessmentStage")) await dev.save();
  if (shouldInvite) notifyByEmail(dev.email, "Mời bạn tham gia Hugo Team", devEmailWrap(`
    <h2>Chúc mừng ${escapeHtml(dev.name)}!</h2>
    <p>Bạn đã hoàn tất chương trình học Hugo Team và đã đủ điều kiện nhận lời mời tham gia đội ngũ.</p>
    <p>Mở <strong>Hugo Team</strong> trong Member Portal để chấp nhận lời mời.</p>
  `));
  return dev;
}

async function resetCodingProgress(email) {
  const bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] });
  if (!bio) return;
  const coderSteps = new Set(completedCoderSteps(bio.completedLessons));
  bio.completedLessons = (bio.completedLessons || []).filter((id) => !coderSteps.has(id));
  bio.hugoCoderExamScores = Object.fromEntries(Object.entries(bio.hugoCoderExamScores || {}).filter(([id]) => !coderSteps.has(id)));
  bio.markModified("hugoCoderExamScores");
  await bio.save();
}

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
    if (dev.assessmentStage === "coding") await syncTeamCoding(dev);
    if (dev.status !== "approved") {
      const latestAttempt = dev.assessmentAttempts[dev.assessmentAttempts.length - 1];
      return res.json({
        status: dev.status,
        email: dev.email,
        name: dev.name,
        role: dev.role,
        assessmentStage: dev.assessmentStage,
        codingStartedAt: dev.codingStartedAt,
        codingDeadline: dev.codingDeadline,
        codingCompletedSteps: dev.codingCompletedSteps,
        codingStepScores: dev.codingStepScores,
        codingResetReason: dev.codingResetReason,
        mentor: dev.mentor,
        mentorEndsAt: dev.mentorEndsAt,
        teamId: dev.teamId,
        contributionScore: dev.contributionScore,
        latestAssessment: latestAttempt?.completedAt ? { scores: latestAttempt.scores, passed: latestAttempt.passed, completedAt: latestAttempt.completedAt } : null,
      });
    }

    // Membership: 3 years from approved date
    const membershipEnd = new Date(dev.approvedAt);
    membershipEnd.setFullYear(membershipEnd.getFullYear() + 3);

    res.json({
      status: "approved",
      email: dev.email,
      name: dev.name,
      role: dev.role,
      approvedAt: dev.approvedAt,
      assessmentStage: dev.assessmentStage,
      codingStartedAt: dev.codingStartedAt,
      codingDeadline: dev.codingDeadline,
      codingCompletedSteps: dev.codingCompletedSteps,
      codingStepScores: dev.codingStepScores,
      codingResetReason: dev.codingResetReason,
      mentor: dev.mentor,
      mentorEndsAt: dev.mentorEndsAt,
      teamId: dev.teamId,
      contributionScore: dev.contributionScore,
      rewardMembershipEndsAt: dev.rewardMembershipEndsAt,
      membershipEnd: membershipEnd,
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

// Vào thẳng bài học; bài đánh giá cũ không còn là cổng vào.
router.post("/learning/start", requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const name = String(req.body.name || email.split("@")[0]).trim().slice(0, 120);
    let dev = await HugoTeamDev.findOne({ email });
    if (!dev) {
      dev = await HugoTeamDev.create({ email, name, status: "pending", assessmentStage: "coding", codingStartedAt: new Date() });
    } else if (["none", "in_progress"].includes(dev.assessmentStage)) {
      dev.assessmentStage = "coding";
      dev.codingStartedAt ||= new Date();
      dev.codingDeadline = null;
      dev.codingResetReason = "";
      await dev.save();
    }
    await syncTeamCoding(dev);
    res.json({ success: true, stage: dev.assessmentStage });
  } catch (error) {
    console.error("POST learning start error:", error);
    res.status(500).json({ error: "Không thể bắt đầu bài học" });
  }
});

router.post("/invitation/accept", requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ $or: [{ email: req.memberEmail }, { contactEmail: req.memberEmail }] });
    const age = bioAge(bio);
    if (age === null || age < MEMBER_MIN_AGE) return res.status(403).json({ error: "Hugo Team dành cho thành viên từ 14 tuổi và cần hoàn tất ngày sinh." });
    if (age < GUARDIAN_CONSENT_AGE && !bio.guardianConsentAt) return res.status(403).json({ error: "Tài khoản 14–15 tuổi cần xác nhận của phụ huynh/người giám hộ." });
    const dev = await HugoTeamDev.findOne({ email: req.memberEmail, assessmentStage: "passed" });
    if (!dev || dev.codingCompletedSteps.length < CODER_TOTAL_STEPS) return res.status(409).json({ error: "Bạn chưa hoàn tất chương trình học." });
    dev.assessmentStage = "mentor";
    await dev.save();
    res.json({ success: true, stage: dev.assessmentStage });
  } catch (error) {
    console.error("POST invitation accept error:", error);
    res.status(500).json({ error: "Không thể chấp nhận lời mời" });
  }
});

router.get("/mentor/dashboard", requireMember, async (req, res) => {
  try {
    const mentor = await HugoTeamDev.findOne({ email: req.memberEmail, role: "mentor", status: "approved" }).select("name email");
    if (!mentor) return res.status(403).json({ error: "Tài khoản chưa được kích hoạt vai trò Mentor" });
    const mentees = await HugoTeamDev.find({ "mentor.email": req.memberEmail, mentorEndsAt: { $gt: new Date() } }).select("name email assessmentStage mentorEndsAt contributionScore tasks hourLogs").lean();
    res.json({ mentor: { name: mentor.name, email: mentor.email }, capacity: { used: mentees.length, max: 100 }, mentees: mentees.map((mentee) => ({ ...mentee, openTasks: mentee.tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length, approvedHours: mentee.hourLogs.filter((log) => log.status === "approved").reduce((sum, log) => sum + log.hours, 0) })) });
  } catch (error) { console.error("GET mentor dashboard error:", error); res.status(500).json({ error: "Không tải được dashboard Mentor" }); }
});

router.post("/mentor/mentees/:email/feedback", requireMember, async (req, res) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return res.status(400).json({ error: "Điểm đóng góp phải từ 0 đến 100" });
    const mentee = await HugoTeamDev.findOne({ email: req.params.email, "mentor.email": req.memberEmail, mentorEndsAt: { $gt: new Date() } });
    if (!mentee) return res.status(404).json({ error: "Không tìm thấy mentee đang được phân công" });
    mentee.contributionScore = Math.round(score);
    if (req.body.note) mentee.messages.push({ from: "admin", text: `[Mentor] ${String(req.body.note).slice(0, 1000)}`, readByDev: false, readByAdmin: true });
    await mentee.save();
    res.json({ success: true, contributionScore: mentee.contributionScore });
  } catch (error) { console.error("POST mentor feedback error:", error); res.status(500).json({ error: "Không lưu được đánh giá Mentor" }); }
});

router.get("/team/dashboard", requireMember, async (req, res) => {
  try {
    const member = await HugoTeamDev.findOne({ email: req.memberEmail, teamId: { $ne: "" } });
    if (!member) return res.status(404).json({ error: "Bạn chưa được phân vào team" });
    const members = await HugoTeamDev.find({ teamId: member.teamId }).select("name email teamRole assessmentStage contributionScore tasks").lean();
    res.json({ teamId: member.teamId, members: members.map((item) => ({ ...item, openTasks: item.tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length })) });
  } catch (error) { console.error("GET team dashboard error:", error); res.status(500).json({ error: "Không tải được dashboard Team" }); }
});

router.post("/team/tasks", requireMember, async (req, res) => {
  try {
    const owner = await HugoTeamDev.findOne({ email: req.memberEmail, teamId: { $ne: "" } });
    if (!owner || owner.teamRole !== "teamlead") return res.status(403).json({ error: "Chỉ Teamlead mới được phân công nhiệm vụ" });
    const title = String(req.body.title || "").trim().slice(0, 200);
    const target = String(req.body.email || req.memberEmail).trim().toLowerCase();
    if (!title) return res.status(400).json({ error: "Thiếu tên nhiệm vụ" });
    const member = await HugoTeamDev.findOne({ email: target, teamId: owner.teamId });
    if (!member) return res.status(404).json({ error: "Thành viên không thuộc team" });
    member.tasks.push({ title, guide: String(req.body.guide || "").slice(0, 5000), deadline: req.body.deadline || null });
    await member.save();
    res.json({ success: true, task: member.tasks[member.tasks.length - 1] });
  } catch (error) { console.error("POST team task error:", error); res.status(500).json({ error: "Không thể tạo nhiệm vụ team" }); }
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
router.post("/apply", requireAdultMember, upload.single("cv"), async (req, res) => {
  try {
    const email = req.memberEmail;
    // Get displayName from form (sent by frontend from Google auth or session)
    // Fallback: email local-part for WebAuthn or missing name
    const name = String(req.body.name || "").trim() || email?.split("@")[0] || "";
    const file = req.file;
    if (!email || !file) {
      return res.status(400).json({ error: "Thiếu CV đính kèm" });
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
        name, // Full displayName (e.g., "Trần Văn A")
        school: req.body.school || "",
        status: "pending",
        cv: file.filename,
        cvPath: file.path,
      },
      { upsert: true, new: true }
    );

    await sendHugoTeamApplyConfirm(name, email);
    res.json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("POST apply error:", error);
    res.status(500).json({ error: error.message || "Failed to submit application" });
  }
});

/* ─────────────────────────── Admin ─────────────────────────── */

router.post("/admin/mentors/:email/toggle", requireAdmin, async (req, res) => {
  try {
    const mentor = await HugoTeamDev.findOne({ email: req.params.email });
    if (!mentor) return res.status(404).json({ error: "Không tìm thấy thành viên" });
    mentor.role = mentor.role === "mentor" ? "member" : "mentor";
    await mentor.save();
    res.json({ success: true, role: mentor.role });
  } catch (error) { console.error("POST mentor toggle error:", error); res.status(500).json({ error: "Không thể cập nhật vai trò Mentor" }); }
});

router.post("/admin/assign-next-mentor", requireAdmin, async (req, res) => {
  try {
    const candidate = await HugoTeamDev.findOne({ assessmentStage: "mentor", "mentor.email": "" }).sort({ updatedAt: 1 });
    if (!candidate) return res.status(404).json({ error: "Không có ứng viên đang chờ Mentor" });
    const mentors = await HugoTeamDev.find({ role: "mentor" }).select("email name").lean();
    const loads = await HugoTeamDev.aggregate([{ $match: { "mentor.email": { $in: mentors.map((mentor) => mentor.email) }, mentorEndsAt: { $gt: new Date() } } }, { $group: { _id: "$mentor.email", count: { $sum: 1 } } }]);
    const loadMap = new Map(loads.map((item) => [item._id, item.count]));
    const mentor = mentors.sort((a, b) => (loadMap.get(a.email) || 0) - (loadMap.get(b.email) || 0)).find((item) => (loadMap.get(item.email) || 0) < 100);
    if (!mentor) return res.status(409).json({ error: "Tất cả Mentor đã đủ 100 thành viên" });
    candidate.mentor = { name: mentor.name, email: mentor.email, assignedAt: new Date() };
    candidate.mentorEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await candidate.save();
    res.json({ success: true, candidate: candidate.email, mentor: mentor.email, mentorEndsAt: candidate.mentorEndsAt });
  } catch (error) { console.error("POST assign mentor error:", error); res.status(500).json({ error: "Không thể tự phân công Mentor" }); }
});

router.post("/admin/auto-build-teams", requireAdmin, async (req, res) => {
  try {
    const candidates = await HugoTeamDev.find({ assessmentStage: "mentor", mentorEndsAt: { $lte: new Date() }, teamId: "" }).sort({ contributionScore: -1, updatedAt: 1 });
    const teamIds = [];
    for (let index = 0; index < candidates.length; index += 10) {
      const teamId = `hugo-${Date.now()}-${Math.floor(index / 10) + 1}`;
      const group = candidates.slice(index, index + 10);
      for (const [memberIndex, member] of group.entries()) {
        member.teamId = teamId;
        member.teamRole = memberIndex === 0 ? "teamlead" : "member";
        member.assessmentStage = "team";
        await member.save();
      }
      teamIds.push({ teamId, count: group.length });
    }
    res.json({ success: true, teams: teamIds });
  } catch (error) { console.error("POST auto build teams error:", error); res.status(500).json({ error: "Không thể tự xây dựng team" }); }
});

router.post("/admin/devs/:email/mentor", requireAdmin, async (req, res) => {
  try {
    const mentorEmail = String(req.body.mentorEmail || "").trim().toLowerCase();
    const mentorName = String(req.body.mentorName || mentorEmail).trim().slice(0, 120);
    if (!mentorEmail) return res.status(400).json({ error: "Thiếu mentorEmail" });
    const activeCount = await HugoTeamDev.countDocuments({ "mentor.email": mentorEmail, mentorEndsAt: { $gt: new Date() } });
    if (activeCount >= 100) return res.status(409).json({ error: "Mentor đã đủ 100 thành viên trong đợt này." });
    const dev = await HugoTeamDev.findOne({ email: req.params.email, assessmentStage: { $in: ["mentor", "coding"] } });
    if (!dev) return res.status(404).json({ error: "Ứng viên chưa đủ điều kiện Mentor" });
    dev.mentor = { name: mentorName, email: mentorEmail, assignedAt: new Date() };
    dev.mentorEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    dev.assessmentStage = "mentor";
    await dev.save();
    res.json({ success: true, mentor: dev.mentor, mentorEndsAt: dev.mentorEndsAt });
  } catch (error) { console.error("POST mentor assignment error:", error); res.status(500).json({ error: "Không thể phân công mentor" }); }
});

router.post("/admin/teams/assign", requireAdmin, async (req, res) => {
  try {
    const emails = [...new Set((Array.isArray(req.body.emails) ? req.body.emails : []).map((email) => String(email).trim().toLowerCase()).filter(Boolean))];
    const teamId = String(req.body.teamId || `team-${Date.now()}`).trim().slice(0, 80);
    if (!emails.length || emails.length > 10) return res.status(400).json({ error: "Mỗi team cần từ 1 đến 10 thành viên." });
    const result = await HugoTeamDev.updateMany({ email: { $in: emails }, assessmentStage: "mentor", mentorEndsAt: { $lte: new Date() } }, { $set: { teamId, assessmentStage: "team" } });
    res.json({ success: true, teamId, assigned: result.modifiedCount });
  } catch (error) { console.error("POST team assignment error:", error); res.status(500).json({ error: "Không thể phân bổ team" }); }
});

router.post("/admin/devs/:email/officialize", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email, assessmentStage: "team" });
    if (!dev) return res.status(404).json({ error: "Ứng viên chưa hoàn tất các giai đoạn" });
    if (!dev.rewardGrantedAt) {
      await awardJoy(dev.email, 10000, "admin_adjustment", "Quà hoàn tất HugoTeam: 10.000 JOY");
      dev.rewardGrantedAt = new Date();
    }
    dev.status = "approved";
    dev.assessmentStage = "official";
    dev.approvedAt = dev.approvedAt || new Date();
    dev.rewardMembershipEndsAt = dev.rewardMembershipEndsAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await dev.save();
    res.json({ success: true, status: dev.status, assessmentStage: dev.assessmentStage });
  } catch (error) { console.error("POST officialize error:", error); res.status(400).json({ error: error.message || "Không thể công nhận thành viên" }); }
});

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
        cvPath: `/api/hugoteam/admin/cv/${encodeURIComponent(a.cv)}`,
      })),
    });
  } catch (error) {
    console.error("GET applicants error:", error);
    res.status(500).json({ error: "Failed to load applicants" });
  }
});

// Serve a CV PDF — admin only (CVs are private; uploads/ is deliberately not
// served statically). basename() blocks path traversal.
router.get("/admin/cv/:filename", requireAdmin, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(CV_DIR, filename);
  res.sendFile(filePath, { headers: { "Content-Type": "application/pdf" } }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "CV not found" });
  });
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
router.post("/admin/mentors", requireAdmin, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim().slice(0, 120);
    if (!email || !name) return res.status(400).json({ error: "Cần email và tên Mentor" });
    const mentor = await HugoTeamDev.findOneAndUpdate(
      { email },
      { $set: { email, name, status: "approved", role: "mentor", assessmentStage: "official", approvedAt: new Date() }, $setOnInsert: { tasks: [], hourLogs: [], messages: [] } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, mentor: { email: mentor.email, name: mentor.name, role: mentor.role } });
  } catch (error) { console.error("POST admin mentor error:", error); res.status(500).json({ error: "Không thể thêm Mentor" }); }
});

router.get("/admin/devs", requireAdmin, async (req, res) => {
  try {
    const devs = await HugoTeamDev.find({}).sort({ updatedAt: -1 });
    res.json({
      devs: devs.map((d) => ({
        email: d.email,
        name: d.name,
        school: d.school,
        approvedAt: d.approvedAt,
        status: d.status,
        role: d.role,
        assessmentStage: d.assessmentStage,
        assessmentAttempts: d.assessmentAttempts.length,
        latestAssessment: d.assessmentAttempts[d.assessmentAttempts.length - 1]?.scores || null,
        codingCompletedSteps: d.codingCompletedSteps.length,
        codingDeadline: d.codingDeadline,
        mentor: d.mentor,
        mentorEndsAt: d.mentorEndsAt,
        teamId: d.teamId,
        teamRole: d.teamRole,
        contributionScore: d.contributionScore,
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
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    if (!dev) return res.status(404).json({ error: "Dev not found" });
    res.json({
      dev: {
        email: dev.email,
        name: dev.name,
        school: dev.school,
        status: dev.status,
        role: dev.role,
        assessmentStage: dev.assessmentStage,
        mentor: dev.mentor,
        mentorEndsAt: dev.mentorEndsAt,
        teamId: dev.teamId,
        teamRole: dev.teamRole,
        contributionScore: dev.contributionScore,
        latestAssessment: dev.assessmentAttempts[dev.assessmentAttempts.length - 1]?.scores || null,
        assessmentAttempts: dev.assessmentAttempts.length,
        codingStartedAt: dev.codingStartedAt,
        codingDeadline: dev.codingDeadline,
        codingCompletedSteps: dev.codingCompletedSteps,
        codingStepScores: dev.codingStepScores,
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

router.patch("/admin/devs/:email", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    if (!dev) return res.status(404).json({ error: "Không tìm thấy thành viên" });
    const { name, school, status, role, assessmentStage, teamId, teamRole, contributionScore, mentorEmail, mentorName } = req.body || {};
    if (typeof name === "string" && name.trim()) dev.name = name.trim().slice(0, 120);
    if (typeof school === "string") dev.school = school.slice(0, 200);
    if (["pending", "approved", "rejected"].includes(status)) dev.status = status;
    if (["member", "mentor"].includes(role)) dev.role = role;
    if (["none", "in_progress", "passed", "coding", "mentor", "team", "official"].includes(assessmentStage)) dev.assessmentStage = assessmentStage;
    if (typeof teamId === "string") dev.teamId = teamId.slice(0, 80);
    if (["member", "teamlead"].includes(teamRole)) dev.teamRole = teamRole;
    if (Number.isFinite(Number(contributionScore))) dev.contributionScore = Math.max(0, Math.min(100, Math.round(Number(contributionScore))));
    if (mentorEmail !== undefined) dev.mentor = { email: String(mentorEmail).trim().toLowerCase(), name: String(mentorName || mentorEmail).trim().slice(0, 120), assignedAt: new Date() };
    await dev.save();
    res.json({ success: true, dev: { email: dev.email, name: dev.name, status: dev.status, role: dev.role, assessmentStage: dev.assessmentStage, teamId: dev.teamId, teamRole: dev.teamRole, mentor: dev.mentor } });
  } catch (error) { console.error("PATCH admin dev error:", error); res.status(500).json({ error: "Không thể cập nhật thành viên" }); }
});

router.post("/admin/devs/:email/remove-team", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOneAndUpdate({ email: req.params.email }, { $set: { teamId: "", teamRole: "member", assessmentStage: "mentor" } }, { new: true });
    if (!dev) return res.status(404).json({ error: "Không tìm thấy thành viên" });
    res.json({ success: true, teamId: dev.teamId, assessmentStage: dev.assessmentStage });
  } catch (error) { console.error("POST remove team error:", error); res.status(500).json({ error: "Không thể xoá khỏi team" }); }
});

router.post("/admin/devs/:email/reset-assessment", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    if (!dev) return res.status(404).json({ error: "Không tìm thấy thành viên" });
    dev.assessmentAttempts = [];
    dev.assessmentStage = "coding";
    dev.codingStartedAt = null;
    dev.codingDeadline = null;
    dev.codingCompletedSteps = [];
    dev.codingStepScores = {};
    dev.codingResetAt = new Date();
    dev.codingResetReason = "Admin đặt lại toàn bộ lộ trình HugoTeam.";
    dev.mentor = { name: "", email: "", assignedAt: null };
    dev.mentorEndsAt = null;
    dev.teamId = "";
    dev.teamRole = "member";
    dev.contributionScore = 0;
    dev.teamInvitedAt = null;
    await resetCodingProgress(dev.email);
    await dev.save();
    res.json({ success: true, assessmentStage: dev.assessmentStage });
  } catch (error) {
    console.error("POST reset assessment error:", error);
    res.status(500).json({ error: "Không thể đặt lại bài đánh giá" });
  }
});

router.post("/admin/devs/:email/reset-coding", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    if (!dev) return res.status(404).json({ error: "Không tìm thấy thành viên" });
    dev.assessmentStage = "coding";
    dev.codingStartedAt = new Date();
    dev.codingDeadline = null;
    dev.codingCompletedSteps = [];
    dev.codingStepScores = {};
    dev.codingResetAt = new Date();
    dev.codingResetReason = "Admin đặt lại chương trình Coding HugoTeam.";
    dev.mentor = { name: "", email: "", assignedAt: null };
    dev.mentorEndsAt = null;
    dev.teamId = "";
    dev.teamRole = "member";
    dev.teamInvitedAt = null;
    await resetCodingProgress(dev.email);
    await dev.save();
    res.json({ success: true, assessmentStage: dev.assessmentStage, codingDeadline: dev.codingDeadline });
  } catch (error) {
    console.error("POST reset coding error:", error);
    res.status(500).json({ error: "Không thể đặt lại Coding HugoTeam" });
  }
});

// Assign a task (emails the dev — admin's main channel is email).
router.post("/admin/devs/:email/tasks", requireAdmin, async (req, res) => {
  try {
    const { title, guide, deadline } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title required" });
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
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
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    const task = dev?.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const previousStatus = task.status;
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
      task.doneAt = status === "done" ? new Date() : null;
    }
    await dev.save();
    if (status === "doing" && previousStatus !== "doing") notifyByEmail(
      dev.email,
      `Nhiệm vụ cần tiếp tục: ${task.title}`,
      devEmailWrap(`<p>Admin đã trả nhiệm vụ <strong>${escapeHtml(task.title)}</strong> về trạng thái đang làm.</p>${task.adminNote ? `<p>Nhận xét: ${escapeHtml(task.adminNote)}</p>` : ""}`),
    );
    res.json({ success: true, task });
  } catch (error) {
    console.error("PATCH admin task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/admin/devs/:email/tasks/:taskId", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    const task = dev?.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    task.deleteOne();
    await dev.save();
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE admin task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Approve / reject an hour log.
router.patch("/admin/devs/:email/hours/:logId", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    const log = dev?.hourLogs.id(req.params.logId);
    if (!log) return res.status(404).json({ error: "Log not found" });
    log.status = status;
    log.reviewedAt = status === "pending" ? null : new Date();
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
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
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

// Formal email to a dev, optionally with a PDF attached. The PDF lives only
// in memory for the duration of the request — deliberately NOT saved to disk.
const mailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Only PDF files allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/admin/devs/:email/send-mail",
  requireAdmin,
  mailUpload.single("attachment"),
  async (req, res) => {
    try {
      const subject = String(req.body.subject || "").trim().slice(0, 200);
      const body = String(req.body.body || "").trim().slice(0, 10000);
      if (!subject || !body) {
        return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung thư" });
      }
      const dev = await HugoTeamDev.findOne({ email: req.params.email });
      if (!dev) return res.status(404).json({ error: "Dev not found" });

      const attachments = req.file
        ? [{
            content: req.file.buffer.toString("base64"),
            filename: req.file.originalname,
            type: "application/pdf",
            disposition: "attachment",
          }]
        : null;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #333; line-height: 1.7;">
          <div style="white-space: pre-wrap;">${body
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          ${req.file ? `<p style="color:#666;font-size:13px;margin-top:16px;">📎 Văn bản đính kèm: <strong>${req.file.originalname}</strong></p>` : ""}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">Thư được gửi từ hệ thống HugoTeam — Hugo Studio. Bạn có thể phản hồi trực tiếp email này hoặc trao đổi trên tab Hugo Team trong Member Portal.</p>
        </div>`;

      const result = await sendCustomEmail(dev.email, subject, html, null, null, attachments);
      if (!result.success) {
        return res.status(502).json({ error: "Gửi email thất bại: " + (result.error || "unknown") });
      }

      // Lưu dấu vết tương tác vào thread (chỉ subject — file KHÔNG lưu hệ thống).
      dev.messages.push({
        from: "admin",
        text: `[Email đã gửi] ${subject}${req.file ? ` (đính kèm: ${req.file.originalname})` : ""}`,
        readByAdmin: true,
      });
      await dev.save();

      res.json({ success: true });
    } catch (error) {
      console.error("POST send-mail error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  }
);

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

// Delete a developer from HugoTeam completely (admin)
router.delete("/admin/devs/:email", requireAdmin, async (req, res) => {
  try {
    const deleted = await HugoTeamDev.findOneAndDelete({ email: req.params.email });
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy lập trình viên" });
    res.json({ success: true, message: `Đã xóa lập trình viên ${deleted.name} khỏi HugoTeam.` });
  } catch (error) {
    console.error("DELETE admin dev error:", error);
    res.status(500).json({ error: "Thao tác xóa lập trình viên thất bại" });
  }
});

// Block/suspend/unblock developer in HugoTeam (admin)
router.post("/admin/devs/:email/block", requireAdmin, async (req, res) => {
  try {
    const dev = await HugoTeamDev.findOne({ email: req.params.email });
    if (!dev) return res.status(404).json({ error: "Không tìm thấy lập trình viên" });
    
    // Toggle active status/status
    if (dev.status === "approved") {
      dev.status = "rejected"; // Suspend status
      await dev.save();
      res.json({ success: true, message: `Đã đình chỉ/chặn lập trình viên ${dev.name}.`, status: dev.status });
    } else {
      dev.status = "approved";
      dev.approvedAt = new Date();
      await dev.save();
      res.json({ success: true, message: `Đã khôi phục hoạt động cho lập trình viên ${dev.name}.`, status: dev.status });
    }
  } catch (error) {
    console.error("POST block admin dev error:", error);
    res.status(500).json({ error: "Thao tác chặn/đình chỉ lập trình viên thất bại" });
  }
});

export default router;
