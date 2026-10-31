import Data from '../models/Data.js';
import { clearCache, fetchWithCache } from './cacheHelper.js';

/**
 * Công tắc hệ thống (Data.systemSettings) mà server THẬT SỰ thi hành.
 * Admin bật/tắt ở Trung Tâm Điều Khiển; thêm công tắc mới thì thêm vào đây
 * VÀ thêm chỗ đọc nó — công tắc không ai đọc là công tắc giả.
 */
export const SWITCHES = ['maintenanceMode', 'vacationMode', 'allowRegistration', 'allowBooking'];

export const getSystemSettings = () => fetchWithCache('system_settings', 15000, async () =>
  (await Data.findOne({ userId: 'default' }, 'systemSettings').lean())?.systemSettings || {});

export async function setSystemSwitches(patch = {}) {
  const $set = Object.fromEntries(SWITCHES.filter((k) => typeof patch[k] === 'boolean').map((k) => [`systemSettings.${k}`, patch[k]]));
  if (!Object.keys($set).length) return null;
  const doc = await Data.findOneAndUpdate({ userId: 'default' }, { $set }, { new: true, upsert: true, projection: 'systemSettings' }).lean();
  await Promise.all(['system_settings', 'public_data', 'app_bootstrap_metadata'].map(clearCache));
  return { changed: Object.keys($set).map((k) => k.split('.')[1]), settings: doc.systemSettings };
}
