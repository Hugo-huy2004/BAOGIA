/**
 * /api/bios — chỉ là mục lục. Mỗi nhóm chức năng nằm ở một tệp trong
 * routes/bio/; các đoạn giữ ĐÚNG thứ tự route của tệp gốc (có route /:id xen giữa, đổi thứ tự là đổi route nào bắt request).
 */
import express from 'express';
import bioAdminRoutes from './bio/bioAdminRoutes.js';
import bioMeRoutes from './bio/bioMeRoutes.js';
import bioPublicRoutes from './bio/bioPublicRoutes.js';
import bioWriteRoutes from './bio/bioWriteRoutes.js';
import bioIdentityRoutes from './bio/bioIdentityRoutes.js';

const router = express.Router();
router.use(bioAdminRoutes);
router.use(bioMeRoutes);
router.use(bioPublicRoutes);
router.use(bioWriteRoutes);
router.use(bioIdentityRoutes);

export default router;
