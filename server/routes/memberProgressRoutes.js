import express from "express";
import { requireMember } from "../middleware/authMiddleware.js";
import Bio from "../models/Bio.js";

const router = express.Router();

/**
 * GET /api/member/progress
 * Load all completed lessons for current member from MongoDB
 */
router.get("/", requireMember, async (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    let bio = await Bio.findOne({ email: memberEmail });
    if (!bio) bio = await Bio.findOne({ contactEmail: memberEmail });

    const lessons = bio?.completedLessons || [];
    res.json({
      lessons,
      updatedAt: bio?.updatedAt || new Date()
    });
  } catch (error) {
    console.error("GET progress error:", error);
    res.status(500).json({ error: "Failed to load progress" });
  }
});

/**
 * POST /api/member/progress/lesson/:lessonId/complete
 * Mark lesson as completed in MongoDB (persisted & sync'd cross-device)
 */
router.post("/lesson/:lessonId/complete", requireMember, async (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessonId } = req.params;

    if (!lessonId || typeof lessonId !== "string") {
      return res.status(400).json({ error: "Invalid lessonId" });
    }

    let bio = await Bio.findOne({ email: memberEmail });
    if (!bio) bio = await Bio.findOne({ contactEmail: memberEmail });
    if (!bio) return res.status(404).json({ error: "Không tìm thấy hồ sơ thành viên." });

    if (!bio.completedLessons) {
      bio.completedLessons = [];
    }

    if (!bio.completedLessons.includes(lessonId)) {
      bio.completedLessons.push(lessonId);
      bio.markModified("completedLessons");
      await bio.save();
    }

    res.json({
      success: true,
      completedCount: bio.completedLessons.length,
      lessons: bio.completedLessons,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("POST lesson complete error:", error);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

/**
 * DELETE /api/member/progress/lesson/:lessonId
 * Reset/uncomplete lesson in MongoDB (for testing)
 */
router.delete("/lesson/:lessonId", requireMember, async (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessonId } = req.params;

    let bio = await Bio.findOne({ email: memberEmail });
    if (!bio) bio = await Bio.findOne({ contactEmail: memberEmail });
    if (!bio) return res.status(404).json({ error: "Không tìm thấy hồ sơ thành viên." });

    if (bio.completedLessons) {
      bio.completedLessons = bio.completedLessons.filter(id => id !== lessonId);
      bio.markModified("completedLessons");
      await bio.save();
    }

    res.json({ success: true, lessons: bio.completedLessons || [] });
  } catch (error) {
    console.error("DELETE lesson error:", error);
    res.status(500).json({ error: "Failed to reset progress" });
  }
});

/**
 * POST /api/member/progress/sync
 * Bulk sync progress (client sends all completed lessons to save to MongoDB)
 */
router.post("/sync", requireMember, async (req, res) => {
  try {
    const memberEmail = req.memberEmail;
    const { lessons } = req.body;

    if (!Array.isArray(lessons)) {
      return res.status(400).json({ error: "lessons must be an array" });
    }

    let bio = await Bio.findOne({ email: memberEmail });
    if (!bio) bio = await Bio.findOne({ contactEmail: memberEmail });
    if (!bio) return res.status(404).json({ error: "Không tìm thấy hồ sơ thành viên." });

    const currentLessons = bio.completedLessons || [];
    const merged = [...new Set([...currentLessons, ...lessons])];

    bio.completedLessons = merged;
    bio.markModified("completedLessons");
    await bio.save();

    res.json({
      success: true,
      completedCount: bio.completedLessons.length,
      lessons: bio.completedLessons,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("POST sync error:", error);
    res.status(500).json({ error: "Failed to sync progress" });
  }
});

export default router;
