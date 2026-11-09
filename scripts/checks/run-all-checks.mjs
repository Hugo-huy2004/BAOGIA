/**
 * SCRIPT CHẠY TOÀN BỘ CÁC BƯỚC KIỂM TRA (CHECK:ALL)
 * Tuân thủ Quy tắc 5 (Viblo): Đặt các script dài trong thư mục scripts thay vì viết trực tiếp vào package.json
 */
import { spawnSync } from 'node:child_process';

const CHECKS = [
  { name: 'lint', cmd: 'npm', args: ['run', 'lint'] },
  { name: 'check:imports', cmd: 'npm', args: ['run', 'check:imports'] },
  { name: 'check:app-standard', cmd: 'npm', args: ['run', 'check:app-standard'] },
  { name: 'check:gateway', cmd: 'npm', args: ['run', 'check:gateway'] },
  { name: 'check:guards', cmd: 'npm', args: ['run', 'check:guards'] },
  { name: 'check:api-auth', cmd: 'npm', args: ['run', 'check:api-auth'] },
  { name: 'check:telegram', cmd: 'npm', args: ['run', 'check:telegram'] },
  { name: 'check:money', cmd: 'npm', args: ['run', 'check:money'] },
  { name: 'check:wallet-auth', cmd: 'npm', args: ['run', 'check:wallet-auth'] },
  { name: 'check:transfer-caps', cmd: 'npm', args: ['run', 'check:transfer-caps'] },
  { name: 'check:notification-source', cmd: 'npm', args: ['run', 'check:notification-source'] },
  { name: 'check:notification-tone', cmd: 'npm', args: ['run', 'check:notification-tone'] },
  { name: 'check:joy-stability', cmd: 'npm', args: ['run', 'check:joy-stability'] },
  { name: 'check:tier-finance', cmd: 'npm', args: ['run', 'check:tier-finance'] },
  { name: 'check:han-viet', cmd: 'npm', args: ['run', 'check:han-viet'] },
  { name: 'check:sino', cmd: 'npm', args: ['run', 'check:sino'] },
  { name: 'check:today', cmd: 'npm', args: ['run', 'check:today'] },
  { name: 'check:joy-sources', cmd: 'node', args: ['apps/server/scripts/check-joy-sources.mjs'] },
  { name: 'check:joy-currency', cmd: 'node', args: ['apps/server/scripts/check-joy-currency.mjs'] },
  { name: 'check:cors-quiet', cmd: 'node', args: ['apps/server/scripts/check-cors-quiet.mjs'] },
  { name: 'build', cmd: 'npm', args: ['run', 'build'] },
  { name: 'check:seo', cmd: 'npm', args: ['run', 'check:seo'] },
  { name: 'check:csp', cmd: 'npm', args: ['run', 'check:csp'] },
  { name: 'check:performance', cmd: 'npm', args: ['run', 'check:performance'] },
];

console.log(`🚀 Bắt đầu chạy ${CHECKS.length} bước kiểm tra toàn diện...`);

let passed = 0;
for (let i = 0; i < CHECKS.length; i++) {
  const { name, cmd, args } = CHECKS[i];
  console.log(`\n[${i + 1}/${CHECKS.length}] Đang chạy: ${name}...`);
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n❌ Thất bại tại bước: ${name} (exit code: ${result.status})`);
    process.exit(result.status || 1);
  }
  passed++;
}

console.log(`\n✅ TOÀN BỘ ${passed}/${CHECKS.length} BƯỚC KIỂM TRA ĐÃ ĐẠT!`);
