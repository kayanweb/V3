const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.bud') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if ((full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx'))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Look for patterns: @components/, @context/, but not @/components, not @/contexts
        if (/@components\//.test(line) || /@context\//.test(line)) {
          results.push({ file: full, line: idx + 1, content: line.trim() });
        }
      });
    }
  }
  return results;
}

const findings = walk('.');
findings.forEach(f => {
  console.log(`${f.file}:${f.line}`);
  console.log(`  ${f.content}`);
});
