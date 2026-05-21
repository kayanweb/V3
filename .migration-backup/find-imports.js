const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.bud') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Match imports like: from '@components/... or from '@context/... but NOT from '@/components/...
        if (/from ["']@[^/]+(?!\/)[^'"]*["']/.test(line) || /from ["']@\w+\//.test(line)) {
          // Actually simpler: we want lines where after the quote there is @ but not @/
          // Pattern: from ['"]@[^/] (i.e., @ followed by something that is not a slash)
          if (/from ["']@[^/]/.test(line)) {
            results.push({ file: fullPath, line: idx + 1, content: line.trim() });
          }
        }
      });
    }
  }
  return results;
}

const findings = walk('.');
findings.forEach(f => {
  console.log(`${f.file}:${f.line} -> ${f.content}`);
});
