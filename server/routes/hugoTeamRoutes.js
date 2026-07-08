import express from "express";
import { requireMember, requireAdmin } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import { sendHugoTeamApplyConfirm, sendHugoTeamApproved, sendHugoTeamRejected } from "../services/emailService.js";

const router = express.Router();

// Configure multer for CV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/cvs/");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `cv_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Only PDF files allowed"));
    }
    cb(null, true);
  }
});

// In-memory database (replace with MongoDB)
const applicantsDb = new Map(); // email -> { email, name, school, status, cv, createdAt }
const approvedDevsDb = new Map(); // email -> { id, name, email, school, cvPath, approvedAt }

/**
 * GET /api/hugoteam/developers
 * Get list of approved developers
 */
router.get("/developers", (req, res) => {
  try {
    const developers = Array.from(approvedDevsDb.values()).map(dev => ({
      id: dev.id,
      name: dev.name,
      email: dev.email,
      school: dev.school
    }));
    res.json({ developers });
  } catch (error) {
    console.error("GET developers error:", error);
    res.status(500).json({ error: "Failed to load developers" });
  }
});

/**
 * GET /api/hugoteam/status/:email
 * Check application status for user
 */
router.get("/status/:email", (req, res) => {
  try {
    const { email } = req.params;
    if (approvedDevsDb.has(email)) {
      return res.json({ status: "approved" });
    }
    if (applicantsDb.has(email)) {
      return res.json({ status: "pending" });
    }
    res.json({ status: null });
  } catch (error) {
    console.error("GET status error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

/**
 * POST /api/hugoteam/apply
 * Submit CV application
 */
router.post("/apply", upload.single("cv"), requireMember, async (req, res) => {
  try {
    const { email, name } = req.body;
    const file = req.file;

    if (!email || !name || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if already applied or approved
    if (applicantsDb.has(email) || approvedDevsDb.has(email)) {
      return res.status(400).json({ error: "Already applied or approved" });
    }

    // Save application
    applicantsDb.set(email, {
      email,
      name,
      school: req.body.school || "Not provided",
      status: "pending",
      cv: file.filename,
      cvPath: file.path,
      createdAt: new Date()
    });

    // Send confirmation email
    await sendHugoTeamApplyConfirm(name, email);

    res.json({
      success: true,
      message: "Application submitted successfully"
    });
  } catch (error) {
    console.error("POST apply error:", error);
    res.status(500).json({ error: error.message || "Failed to submit application" });
  }
});

/**
 * GET /api/hugoteam/admin/applicants
 * Get all applications (admin only)
 */
router.get("/admin/applicants", requireAdmin, (req, res) => {
  try {
    const applicants = Array.from(applicantsDb.values()).map(app => ({
      ...app,
      cvPath: `/uploads/cvs/${app.cv}` // Serve PDF from uploads
    }));
    res.json({ applicants });
  } catch (error) {
    console.error("GET applicants error:", error);
    res.status(500).json({ error: "Failed to load applicants" });
  }
});

/**
 * POST /api/hugoteam/admin/approve
 * Approve applicant (admin only)
 */
router.post("/admin/approve", requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const applicant = applicantsDb.get(email);
    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    // Move from applicants to approved devs
    approvedDevsDb.set(email, {
      id: `dev_${Date.now()}`,
      name: applicant.name,
      email: applicant.email,
      school: applicant.school,
      cv: applicant.cv,
      cvPath: applicant.cvPath,
      approvedAt: new Date()
    });

    applicantsDb.delete(email);

    // Send approval email
    await sendHugoTeamApproved(applicant.name, email);

    res.json({
      success: true,
      message: `${applicant.name} approved as developer`
    });
  } catch (error) {
    console.error("POST approve error:", error);
    res.status(500).json({ error: "Failed to approve applicant" });
  }
});

/**
 * POST /api/hugoteam/admin/reject
 * Reject applicant (admin only)
 */
router.post("/admin/reject", requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const applicant = applicantsDb.get(email);
    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    // Delete application
    applicantsDb.delete(email);

    // Send rejection email
    await sendHugoTeamRejected(applicant.name, email);

    res.json({
      success: true,
      message: `${applicant.name} rejected`
    });
  } catch (error) {
    console.error("POST reject error:", error);
    res.status(500).json({ error: "Failed to reject applicant" });
  }
});

export default router;
