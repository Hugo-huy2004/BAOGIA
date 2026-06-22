import fs from 'fs/promises';
import path from 'path';
async function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch (err) {
    console.error('Error reading dir', dirPath, err);
  }
  return size;
}
getDirSize(path.join(process.cwd(), 'public')).then(console.log);
