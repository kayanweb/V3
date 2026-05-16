const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.bud') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/from ['"]@components\//.test(line) ||
            /from ['"]@context\//.test(line) ||
            /from ['"]@contexts\//.test(line)) {
          results.push({ file: full, line: idx + 1, content: line.trim() });
        }
      });
    }
  }
  return results;
}

const findings = walk('.');
findings.forEach(f => {
  console.log(`${f.file}`);
  console.log(`  ${f.line}: ${f.content}`);
});
