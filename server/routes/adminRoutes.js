/**
 * /api/admin — chỉ là mục lục. Mỗi nhóm chức năng nằm ở một tệp trong
 * routes/admin/; thứ tự mount giữ đúng thứ tự route trong tệp gốc (2.468 dòng)
 * trước khi tách, nên Express so khớp y như cũ.
 */
import express from 'express';
import adminAuthRoutes from './admin/adminAuthRoutes.js';
import adminUsersRoutes from './admin/adminUsersRoutes.js';
import adminSystemRoutes from './admin/adminSystemRoutes.js';
import adminCommerceRoutes from './admin/adminCommerceRoutes.js';
import adminDataRoutes from './admin/adminDataRoutes.js';

// Được nơi khác import từ tệp này từ trước khi tách — giữ nguyên lối vào.

const router = express.Router();
router.use(adminAuthRoutes);
router.use(adminUsersRoutes);
router.use(adminSystemRoutes);
router.use(adminCommerceRoutes);
router.use(adminDataRoutes);

export default router;
