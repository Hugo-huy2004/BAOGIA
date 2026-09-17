import express from "express";
import crypto from "crypto";
import { LEGAL_DOCUMENTS } from "../data/legalDocsData.js";

const router = express.Router();

function getLegalDoc(docId, lang = "vi") {
  const langKey = lang === "en" ? "en" : "vi";
  const doc = LEGAL_DOCUMENTS[langKey]?.[docId] || LEGAL_DOCUMENTS.vi?.[docId];
  return doc || null;
}

/**
 * GET /api/legal-docs
 * Danh sách 2 tài liệu quy chuẩn (metadata tóm tắt)
 */
router.get("/", (req, res) => {
  const lang = req.query.lang || "vi";
  const langKey = lang === "en" ? "en" : "vi";
  const docs = LEGAL_DOCUMENTS[langKey] || LEGAL_DOCUMENTS.vi;

  const list = Object.keys(docs).map((id) => {
    const doc = docs[id];
    return {
      id: doc.id,
      title: doc.title,
      subtitle: doc.subtitle,
      updatedAt: doc.updatedAt,
      sectionsCount: doc.sections?.length || 0,
    };
  });

  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res.json({
    success: true,
    data: list,
  });
});

/**
 * GET /api/legal-docs/:docId
 * Chi tiết văn bản quy chuẩn theo ID và ngôn ngữ
 */
router.get("/:docId", (req, res) => {
  const { docId } = req.params;
  const lang = req.query.lang || "vi";
  const doc = getLegalDoc(docId, lang);

  if (!doc) {
    return res.status(404).json({
      success: false,
      error: `Legal document '${docId}' not found. Available: terms-manifest, database-policy`,
    });
  }

  // Tạo ETag dựa trên nội dung & phiên bản để tăng tốc độ tải
  const bodyString = JSON.stringify(doc);
  const etag = crypto.createHash("md5").update(bodyString).digest("hex");

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.set({
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    ETag: etag,
  });

  return res.json({
    success: true,
    data: doc,
  });
});

export default router;
