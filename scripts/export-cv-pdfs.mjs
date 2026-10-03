/**
 * XUẤT CV SANG PDF BẰNG HEADLESS CHROME
 * Tuân thủ Quy tắc 5 (Viblo): Đặt các script dài trong thư mục scripts thay vì viết trực tiếp vào package.json
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME_PATH = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TARGETS = {
  // Primary PDFs: each language follows its intended recruiting context.
  // vi/zh retain the locally familiar visual layout; en is one-column ATS.
  vi: { url: `file://${ROOT}/public/cv/index.html?lang=vi`, out: 'public/hugo-wishpax-cv.pdf' },
  en: { url: `file://${ROOT}/public/cv/index.html?lang=en&layout=ats`, out: 'public/hugo-wishpax-cv-en.pdf' },
  zh: { url: `file://${ROOT}/public/cv/index.html?lang=zh`, out: 'public/hugo-wishpax-cv-zh.pdf' },
};

// Only generate these when a job portal explicitly asks for plain ATS output.
const OPTIONAL_TARGETS = {
  ats: { url: `file://${ROOT}/public/cv/index.html?lang=vi&layout=ats`, out: 'public/hugo-wishpax-cv-ats.pdf' },
  'ats-en': { url: `file://${ROOT}/public/cv/index.html?lang=en&layout=ats`, out: 'public/hugo-wishpax-cv-ats-en.pdf' },
};

const targetKey = process.argv[2];

function printPdf(url, out) {
  const fullOut = path.resolve(ROOT, out);
  console.log(`📄 Đang xuất PDF: ${out}...`);
  execFileSync(CHROME_PATH, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${fullOut}`,
    url,
  ]);
  console.log(`✓ Đã lưu: ${out}`);
}

const selectedTarget = targetKey && (TARGETS[targetKey] || OPTIONAL_TARGETS[targetKey]);

if (selectedTarget) {
  const { url, out } = selectedTarget;
  printPdf(url, out);
} else {
  // Xuất toàn bộ
  for (const [key, { url, out }] of Object.entries(TARGETS)) {
    printPdf(url, out);
  }
}
