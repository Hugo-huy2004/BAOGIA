import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { calcExchangeTotal } from '../utils/featureSubscriptionService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { serverAiUserId } from '../services/securityEnforcement.js';

const COMPRESS_CHARGE = 50; // JOY/file, only for 'medium'/'strong' — 'light' stays free

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Chế độ demo: HugoKit có trang public /hugokit — khách chưa đăng nhập được
// 3 lượt xử lý file mỗi ngày (đếm theo IP), muốn hơn phải đăng nhập.
// ponytail: đếm trong RAM, mất khi restart; chuyển sang Mongo nếu thấy bị lách.
const DEMO_USES_PER_DAY = 3;
const demoUsage = new Map(); // ip -> { day, count }
const demoDay = () => new Date().toISOString().slice(0, 10);

const hasAuthToken = (req) => Boolean(
  req.headers.authorization?.startsWith('Bearer ')
  || req.cookies?.member_jwt
  || req.cookies?.jwt
);

// consume=true cho thao tác tốn tài nguyên (upload ZIP, nén); các bước phụ
// (tải từng tệp, dọn dẹp) chỉ cần danh tính demo để khớp chủ sở hữu file tạm.
const memberOrDemo = (consume) => (req, res, next) => {
  if (hasAuthToken(req)) return requireMember(req, res, next);

  const ip = req.ip || 'unknown';
  const usage = demoUsage.get(ip);
  const count = usage?.day === demoDay() ? usage.count : 0;
  if (consume) {
    if (count >= DEMO_USES_PER_DAY) {
      return res.status(401).json({
        error: `Bạn đã dùng hết ${DEMO_USES_PER_DAY} lượt demo hôm nay. Đăng nhập Google (miễn phí) để dùng không giới hạn.`,
        code: 'DEMO_LIMIT',
      });
    }
    if (demoUsage.size > 5000) {
      for (const [key, value] of demoUsage) {
        if (value.day !== demoDay()) demoUsage.delete(key);
      }
    }
    demoUsage.set(ip, { day: demoDay(), count: count + 1 });
  }
  // serverAiUserId chỉ HMAC chuỗi này nên cùng IP luôn ra cùng chủ sở hữu file.
  req.memberEmail = `demo:${ip}`;
  req.isDemoActor = true;
  next();
};

const MAX_ZIP_ENTRIES = 1000;
const MAX_ZIP_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_ZIP_ENTRY_BYTES = 50 * 1024 * 1024;

// Define temporary upload directory
const tempDir = path.join(__dirname, '../uploads/temp_file_tools');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const owner = serverAiUserId(req.memberEmail).slice(0, 16);
    cb(null, `${owner}_${uniqueId}${ext}`);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Utility to clean up files
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete temp file ${filePath}:`, err);
    });
  }
};

const ownsTempFile = (req, fileId) => (
  typeof fileId === 'string'
  && fileId.startsWith(`${serverAiUserId(req.memberEmail).slice(0, 16)}_`)
);

// 1. EXTRACT API
// Upload a ZIP file and return its contents
router.post('/extract/upload', memberOrDemo(true), upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Không tìm thấy file tải lên.' });
    
    if (path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: 'Chỉ hỗ trợ định dạng .zip' });
    }

    const zip = new AdmZip(req.file.path);
    const zipEntries = zip.getEntries(); // an array of ZipEntry records
    const totalUncompressed = zipEntries.reduce((sum, entry) => sum + Number(entry.header?.size || 0), 0);
    const hasOversizedEntry = zipEntries.some((entry) => Number(entry.header?.size || 0) > MAX_ZIP_ENTRY_BYTES);
    if (
      zipEntries.length > MAX_ZIP_ENTRIES
      || totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES
      || hasOversizedEntry
    ) {
      cleanupFile(req.file.path);
      return res.status(413).json({ error: 'File ZIP có dấu hiệu giải nén quá lớn hoặc chứa quá nhiều mục.' });
    }
    
    const entries = zipEntries.map(entry => ({
      name: entry.entryName,
      isDirectory: entry.isDirectory,
      size: entry.header.size
    }));

    res.json({
      fileId: req.file.filename,
      entries
    });

  } catch (error) {
    console.error('Extract Error:', error);
    if (req.file) cleanupFile(req.file.path);
    res.status(500).json({ error: 'Lỗi khi đọc file ZIP.' });
  }
});

// Download a specific file from the uploaded ZIP
router.get('/extract/download/:fileId', memberOrDemo(false), (req, res) => {
  try {
    const { fileId } = req.params;
    const { entryName } = req.query; // The path of the file inside the zip

    if (!fileId || typeof fileId !== 'string' || fileId !== path.basename(fileId) || fileId.includes('..') || !ownsTempFile(req, fileId)) {
      return res.status(400).json({ error: 'ID file không hợp lệ.' });
    }

    const zipPath = path.join(tempDir, fileId);
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: 'Không tìm thấy file gốc trên server (có thể đã hết hạn).' });
    }

    const zip = new AdmZip(zipPath);
    const zipEntry = zip.getEntry(entryName);

    if (!zipEntry || zipEntry.isDirectory) {
      return res.status(404).json({ error: 'Không tìm thấy file hoặc đây là một thư mục.' });
    }
    if (Number(zipEntry.header?.size || 0) > MAX_ZIP_ENTRY_BYTES) {
      return res.status(413).json({ error: 'Mục trong ZIP vượt quá giới hạn giải nén an toàn.' });
    }

    const fileData = zipEntry.getData();
    const safeFilename = path.basename(entryName).replace(/[^a-zA-Z0-9.-]/g, '_');

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.setHeader('Content-Length', fileData.length);
    res.send(fileData);

  } catch (error) {
    console.error('Extract Download Error:', error);
    res.status(500).json({ error: 'Lỗi khi tải file từ ZIP.' });
  }
});

// Delete ZIP file when user is done (or let cron job clean it up later)
router.delete('/extract/cleanup/:fileId', memberOrDemo(false), (req, res) => {
  const { fileId } = req.params;
  if (!fileId || typeof fileId !== 'string' || fileId !== path.basename(fileId) || fileId.includes('..') || !ownsTempFile(req, fileId)) {
    return res.status(400).json({ error: 'ID file không hợp lệ.' });
  }
  const zipPath = path.join(tempDir, fileId);
  cleanupFile(zipPath);
  res.json({ success: true });
});

// 2. COMPRESS API
// Upload a file, compress it, and stream back
router.post('/compress', memberOrDemo(true), upload.single('file'), async (req, res) => {
  let outputFilePath = null;

  try {
    if (!req.file) return res.status(400).json({ error: 'Không tìm thấy file tải lên.' });

    const level = req.body.level || 'medium'; // light, medium, strong

    // Khách demo không có ví JOY — chỉ được mức nén miễn phí.
    if (req.isDemoActor && level !== 'light') {
      cleanupFile(req.file.path);
      return res.status(401).json({
        error: 'Mức nén Vừa/Mạnh cần tài khoản Hugo Studio. Đăng nhập Google để mở đủ 3 mức.',
        code: 'DEMO_LOGIN',
      });
    }
    const email = req.memberEmail;
    const willCharge = level !== 'light';
    const inputPath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    outputFilePath = path.join(tempDir, `out_${req.file.filename}`);

    // Pre-check balance BEFORE doing the (expensive) compression work, so
    // users who can't afford it don't waste server compute.
    if (willCharge) {
      if (!email) {
        cleanupFile(inputPath);
        return res.status(400).json({ error: 'Thiếu thông tin tài khoản để trao đổi JOY.' });
      }
      let bio = await Bio.findOne({ email });
      if (!bio) bio = await Bio.findOne({ contactEmail: email });
      if (!bio) {
        cleanupFile(inputPath);
        return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
      }
      const { tax, total } = calcExchangeTotal(COMPRESS_CHARGE);
      if (bio.joyBalance < total) {
        cleanupFile(inputPath);
        return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY thuế) để trao đổi mức nén này.` });
      }
    }

    // Charged only after a successful compression — never for failures.
    const chargeIfNeeded = async () => {
      if (!willCharge) return;
      const { tax, total } = calcExchangeTotal(COMPRESS_CHARGE);
      await awardJoy(email, -total, 'file_compression', `Nén file mức ${level === 'strong' ? 'Mạnh' : 'Vừa'} qua HugoTractare (gồm ${tax} JOY thuế giao dịch)`);
    };

    // IMAGE COMPRESSION
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(originalExt)) {
      let quality = 65; // Vừa (Medium): giảm dung lượng xuống 50-70% (chất lượng ~65)
      if (level === 'light') quality = 85; // Nhẹ (Light): giảm dung lượng xuống 70-90% (chất lượng ~85)
      if (level === 'strong') quality = 40; // Mạnh (Strong): giảm dung lượng xuống 30-50% (chất lượng ~40)

      await sharp(inputPath)
        .jpeg({ quality, force: false })
        .png({ quality, force: false })
        .webp({ quality, force: false })
        .toFile(outputFilePath);

      await chargeIfNeeded();
      res.download(outputFilePath, `compressed_${req.file.originalname}`, (err) => {
        cleanupFile(inputPath);
        cleanupFile(outputFilePath);
      });

    // VIDEO COMPRESSION
    } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(originalExt)) {
      let crf = 32; // Vừa (Medium)
      if (level === 'light') crf = 26; // Nhẹ (Light)
      if (level === 'strong') crf = 38; // Mạnh (Strong)

      outputFilePath = outputFilePath + '.mp4'; // force MP4 output

      ffmpeg(inputPath)
        .videoCodec('libx264')
        .outputOptions([`-crf ${crf}`, '-preset veryfast'])
        .on('error', (err) => {
          console.error('FFmpeg compress error:', err);
          cleanupFile(inputPath);
          cleanupFile(outputFilePath);
          if (!res.headersSent) res.status(500).json({ error: 'Lỗi nén video.' });
        })
        .on('end', async () => {
          try {
            await chargeIfNeeded();
            res.download(outputFilePath, `compressed_${path.basename(req.file.originalname, originalExt)}.mp4`, () => {
              cleanupFile(inputPath);
              cleanupFile(outputFilePath);
            });
          } catch (error) {
            cleanupFile(inputPath);
            cleanupFile(outputFilePath);
            if (!res.headersSent) res.status(400).json({ error: error.message === 'INSUFFICIENT_JOY' ? 'Số dư JOY không đủ.' : 'Không thể hoàn tất trao đổi JOY.' });
          }
        })
        .save(outputFilePath);

    } else {
      cleanupFile(inputPath);
      return res.status(400).json({ error: 'Định dạng file không được hỗ trợ để nén.' });
    }

  } catch (error) {
    console.error('Compress Error:', error);
    if (req.file) cleanupFile(req.file.path);
    if (outputFilePath) cleanupFile(outputFilePath);
    if (!res.headersSent) res.status(500).json({ error: 'Lỗi trong quá trình nén file.' });
  }
});

// Simple automated cleanup: delete files in temp folder older than 1 hour
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && (now - stats.mtimeMs > 60 * 60 * 1000)) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 15 * 60 * 1000); // Check every 15 minutes

export default router;
