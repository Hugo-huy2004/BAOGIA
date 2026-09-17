import express from "express";
import crypto from "crypto";
import { BIO_THEMES, getBioThemeById } from "../data/bioThemesData.js";

const router = express.Router();

/**
 * GET /api/bios/themes
 * Lấy danh sách toàn bộ các themes hỗ trợ cho Hugo Bio & App Bio
 */
router.get("/", (req, res) => {
  const bodyString = JSON.stringify(BIO_THEMES);
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
    data: BIO_THEMES,
  });
});

/**
 * GET /api/bios/themes/:themeId
 * Lấy thông tin chi tiết một theme
 */
router.get("/:themeId", (req, res) => {
  const { themeId } = req.params;
  const theme = getBioThemeById(themeId);

  if (!theme) {
    return res.status(404).json({
      success: false,
      error: `Theme '${themeId}' not found.`,
    });
  }

  res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  return res.json({
    success: true,
    data: theme,
  });
});

export default router;
