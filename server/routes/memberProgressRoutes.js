import express from "express";
import { requireMember } from "../middleware/authMiddleware.js";

const router = express.Router();

// In-memory storage for development (replace with MongoDB in production)
const progressDb = new Map(); // memberEmail -> { lessons: [lesson1, lesson2, ...], updatedAt }

/**
 * GET /api/member/progress
 * Load all completed lessons for current member
 */
router.get("/", requireMember, (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const progress = progressDb.get(memberEmail) || { lessons: [], updatedAt: new Date() };
    res.json(progress);
  } catch (error) {
    console.error("GET progress error:", error);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

/**
 * POST /api/member/progress/lesson/:lessonId/complete
 * Mark lesson as completed (sync across devices)
 */
router.post("/lesson/:lessonId/complete", requireMember, (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessonId } = req.params;

    if (!lessonId || typeof lessonId !== "string") {
      return res.status(400).json({ error: "Invalid lessonId" });
    }

    // Get or create progress record
    let progress = progressDb.get(memberEmail) || { lessons: [], updatedAt: new Date() };

    // Add lesson if not already completed
    if (!progress.lessons.includes(lessonId)) {
      progress.lessons.push(lessonId);
      progress.updatedAt = new Date();
    }

    // Save to in-memory DB
    progressDb.set(memberEmail, progress);

    res.json({
      success: true,
      completedCount: progress.lessons.length,
      lessons: progress.lessons,
      updatedAt: progress.updatedAt
    });
  } catch (error) {
    console.error("POST lesson complete error:", error);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

/**
 * DELETE /api/member/progress/lesson/:lessonId
 * Reset/uncomplete lesson (for testing)
 */
router.delete("/lesson/:lessonId", requireMember, (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessonId } = req.params;

    let progress = progressDb.get(memberEmail) || { lessons: [], updatedAt: new Date() };
    progress.lessons = progress.lessons.filter(id => id !== lessonId);
    progress.updatedAt = new Date();

    progressDb.set(memberEmail, progress);

    res.json({ success: true, lessons: progress.lessons });
  } catch (error) {
    console.error("DELETE lesson error:", error);
    res.status(500).json({ error: "Failed to reset progress" });
  }
});

/**
 * POST /api/member/progress/sync
 * Bulk sync progress (client sends all completed lessons)
 */
router.post("/sync", requireMember, (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessons } = req.body;

    if (!Array.isArray(lessons)) {
      return res.status(400).json({ error: "lessons must be an array" });
    }

    const progress = {
      lessons: [...new Set(lessons)], // deduplicate
      updatedAt: new Date()
    };

    progressDb.set(memberEmail, progress);

    res.json({
      success: true,
      completedCount: progress.lessons.length,
      lessons: progress.lessons,
      updatedAt: progress.updatedAt
    });
  } catch (error) {
    console.error("POST sync error:", error);
    res.status(500).json({ error: "Failed to sync progress" });
  }
});

export default router;
