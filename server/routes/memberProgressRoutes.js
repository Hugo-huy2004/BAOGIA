import express from "express";
import { requireMember } from "../middleware/authMiddleware.js";
import Bio from "../models/Bio.js";
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

// Ghi tiến độ KHÔNG có ở đây: step Coding chỉ được ghi qua /api/joy/award-learning
// sau khi máy chủ chấm trắc nghiệm. Ba route tự khai cũ (complete/delete/sync)
// phục vụ học phần văn phòng đã gỡ 27/10/2026 — để lại thì ai cũng tự thêm được
// lesson1–100 và in giả giấy chứng nhận khoá Web cũ.

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
