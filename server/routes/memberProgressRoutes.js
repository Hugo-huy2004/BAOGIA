import express from "express";
import { requireMember } from "../middleware/authMiddleware.js";
import Bio from "../models/Bio.js";
import { isCoderLessonId } from "../../shared/coderProgression.js";
import { CAPSTONE_TRACK_IDS } from "../../shared/capstoneTracks.js";

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

    // Tiến độ Hugo Coder chỉ được ghi qua /api/joy/award-learning sau khi
    // máy chủ chấm bài. Route dùng chung này vẫn phục vụ các khóa HugoSO,
    // nhưng không được trở thành đường vòng tự khai hoàn thành lesson1..100.
    if (isCoderLessonId(lessonId) && !bio.completedLessons.includes(lessonId)) {
      return res.status(409).json({
        code: "CODER_AWARD_REQUIRED",
        error: "Bài Hugo Coder phải được máy chủ chấm và ghi nhận theo đúng thứ tự.",
      });
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
      if (isCoderLessonId(lessonId)) {
        const resetFrom = Number(lessonId.replace("lesson", ""));
        bio.completedLessons = bio.completedLessons.filter((id) => {
          if (!isCoderLessonId(id)) return true;
          return Number(id.replace("lesson", "")) < resetFrom;
        });
      } else {
        bio.completedLessons = bio.completedLessons.filter(id => id !== lessonId);
      }
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
    const completedCoderLessons = new Set(currentLessons.filter(isCoderLessonId));
    const safeIncoming = lessons.filter(
      (lessonId) => !isCoderLessonId(lessonId) || completedCoderLessons.has(lessonId),
    );
    const merged = [...new Set([...currentLessons, ...safeIncoming])];

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

/**
 * GET|PUT /api/member/progress/capstone
 * Đề tài tốt nghiệp của học viên cho chặng đồ án (bài 71–90).
 *
 * Danh sách đề tài nằm ở shared/capstoneTracks.js nên client và server không
 * thể lệch nhau; server chỉ nhận đúng những id có trong đó — nếu tin chuỗi từ
 * client thì trang chấm của admin sẽ gặp những đề tài không tồn tại.
 */
router.get("/capstone", requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail })
      || await Bio.findOne({ contactEmail: req.memberEmail });
    res.json({
      trackId: bio?.capstoneTrack || "",
      chosenAt: bio?.capstoneTrackChosenAt || null,
    });
  } catch (error) {
    console.error("GET capstone error:", error);
    res.status(500).json({ error: "Failed to load capstone track" });
  }
});

router.put("/capstone", requireMember, async (req, res) => {
  try {
    const { trackId } = req.body || {};
    if (!CAPSTONE_TRACK_IDS.includes(String(trackId))) {
      return res.status(400).json({ error: "Đề tài không hợp lệ." });
    }

    const bio = await Bio.findOne({ email: req.memberEmail })
      || await Bio.findOne({ contactEmail: req.memberEmail });
    if (!bio) return res.status(404).json({ error: "Không tìm thấy hồ sơ thành viên." });

    bio.capstoneTrack = trackId;
    bio.capstoneTrackChosenAt = new Date();
    await bio.save();

    res.json({ trackId: bio.capstoneTrack, chosenAt: bio.capstoneTrackChosenAt });
  } catch (error) {
    console.error("PUT capstone error:", error);
    res.status(500).json({ error: "Failed to save capstone track" });
  }
});

export default router;
