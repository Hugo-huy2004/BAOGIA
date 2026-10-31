// Trang Bio công khai: theo slug, theo tên miền, mở liên kết bí mật — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { fetchWithCache } from '../../utils/cacheHelper.js';
import { decryptText, comparePassword } from '../../utils/cryptoUtils.js';
import slugIndex from '../../services/slugIndex.js';
import { getUnexpiredPublicBio, toPublicBio } from './bioShared.js';

const router = express.Router();

router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    // Thuật toán O(1) Bloom Filter: Chặn ngay nếu Slug không tồn tại trong DB (Tránh DDoS DB)
    if (!slugIndex.hasSlug(slug)) {
      return res.status(404).json({ error: 'Bio not found (Bloom Filter rejected)' });
    }

    const cacheKey = `bio_slug_${slug}`;
    
    // Kích hoạt Single-flight & Stale-while-revalidate (giữ fresh trong 60 giây)
    const bio = await fetchWithCache(cacheKey, 60000, async () => {
      const found = await Bio.findOne({ slug });
      const bioDoc = getUnexpiredPublicBio(found);
      if (bioDoc) {
        const doc = bioDoc.toObject();
        // Remove sensitive info for public view
        if (doc.secretLinks && Array.isArray(doc.secretLinks)) {
          doc.secretLinks = doc.secretLinks.map(link => ({
            id: link.id,
            title: link.title,
            hasPassword: !!link.password
          }));
        }
        return toPublicBio(doc);
      }
      return null;
    });

    if (!bio) {
      // Nếu không tìm thấy, xóa khỏi Bloom Filter
      slugIndex.deleteSlug(slug);
      return res.status(404).json({ error: 'Bio not found' });
    }

    res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /by-domain/:domain - Truy vấn Bio công khai bằng Tên miền riêng (Custom Domain)
router.get('/by-domain/:domain', async (req, res) => {
  try {
    const rawDomain = req.params.domain || '';
    const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    
    // Thuật toán O(1) in-memory Bloom check: nếu domain không có trong danh sách, từ chối ngay lập tức
    if (!slugIndex.hasCustomDomain(domain)) {
      return res.status(404).json({ error: 'Tên miền chưa được đăng ký trong hệ thống.' });
    }

    const cacheKey = `bio_domain_${domain}`;
    const bio = await fetchWithCache(cacheKey, 60000, async () => {
      const found = await Bio.findOne({ customDomain: domain });
      const bioDoc = getUnexpiredPublicBio(found);
      if (bioDoc) {
        const doc = bioDoc.toObject();
        if (doc.secretLinks && Array.isArray(doc.secretLinks)) {
          doc.secretLinks = doc.secretLinks.map(link => ({
            id: link.id,
            title: link.title,
            hasPassword: !!link.password
          }));
        }
        return toPublicBio(doc);
      }
      return null;
    });

    if (!bio) {
      slugIndex.deleteCustomDomain(domain);
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ liên kết với tên miền này.' });
    }

    res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/slug/:slug/secret-link/:linkId/unlock', async (req, res) => {
  try {
    const { slug, linkId } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Mật khẩu không được để trống' });
    }

    const bioDoc = await Bio.findOne({ slug });
    if (!bioDoc) return res.status(404).json({ error: 'Bio not found' });
    
    const link = (bioDoc.secretLinks || []).find(l => l.id === linkId);
    if (!link) return res.status(404).json({ error: 'Secret link not found' });
    
    const isValid = await comparePassword(password, link.password);
    if (!isValid) return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    
    const decryptedUrl = decryptText(link.url);
    return res.json({ url: decryptedUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
