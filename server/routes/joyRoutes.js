/**
 * /api/joy — chỉ là mục lục. Mỗi nhóm chức năng nằm ở một tệp trong
 * routes/joy/; mỗi nhóm có tiền tố đường dẫn riêng nên thứ tự giữa các nhóm không đổi kết quả so khớp.
 */
import express from 'express';
import joyWalletRoutes from './joy/joyWalletRoutes.js';
import joyShopRoutes from './joy/joyShopRoutes.js';
import joyRewardsRoutes from './joy/joyRewardsRoutes.js';
import joyLaterRoutes from './joy/joyLaterRoutes.js';

// Được export từ tệp này từ trước khi tách — giữ nguyên lối vào.
export { birthdaySpinStatus } from './joy/joyShared.js';

const router = express.Router();
router.use(joyWalletRoutes);
router.use(joyShopRoutes);
router.use(joyRewardsRoutes);
router.use(joyLaterRoutes);

export default router;
