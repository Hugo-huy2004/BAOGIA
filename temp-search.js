import fs from 'fs';
import path from 'path';

function searchInDir(dir, terms, callback) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(searchInDir(fullPath, terms, callback));
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|json|md)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        for (const term of terms) {
          if (line.includes(term)) {
            results.push(`${fullPath.replace(process.cwd(), '')}:${index + 1}: ${line.trim()}`);
            break; // don't add the same line twice for different terms
          }
        }
      });
    }
  }
  return results;
}

const terms = ["portfolio", "single_page", "basic", "plus", "premium"];
const searchDir = path.join(process.cwd(), 'src');
const results = searchInDir(searchDir, terms);

fs.writeFileSync(path.join(process.cwd(), 'search-results.txt'), results.join('\n'));
console.log("Done");