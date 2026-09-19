import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = 'src';

console.log(`Bắt đầu quét thư mục: ${targetDir} để sửa đuôi import`);
let modifiedCount = 0;

walkDir(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Thay thế import './bla.js' thành import './bla'
  // Regex match các import/export nội bộ (bắt đầu bằng . hoặc /)
  const newContent = content.replace(/(import|export)\s+([^'"]*?)\s+from\s+(['"])(\.\/|\.\.\/|src\/)(.*?)\.(js|jsx)\3/g, "$1 $2 from $3$4$5$3");
  
  // Cũng cần match các import động kiểu `import('./bla.js')`
  const newContent2 = newContent.replace(/import\((['"])(\.\/|\.\.\/|src\/)(.*?)\.(js|jsx)\1\)/g, "import($1$2$3$1)");

  if (content !== newContent2) {
    fs.writeFileSync(filePath, newContent2);
    console.log(`Đã sửa import trong: ${filePath}`);
    modifiedCount++;
  }
});

console.log(`Hoàn thành. Đã sửa ${modifiedCount} file.`);
