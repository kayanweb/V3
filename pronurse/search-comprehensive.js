const fs = require('fs');
const path = require('path');

const dirs = ['app', 'components', 'contexts', 'lib', 'hooks', 'types', 'config'];

function walk(dir, results = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.bud') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, results);
      } else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx') || full.endsWith('.mjs') || full.endsWith('.mts')) {
        const content = fs.readFileSync(full, 'utf8');
        // Check for @components/ or @context/ in any import/require
        if (content.includes('@components/') || content.includes('@context/') || content.includes('@contexts/')) {
          // Also check for @/ versions
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('@components/') || line.includes('@context/') || line.includes('@contexts/')) {
              results.push({ file: full, line: idx + 1, content: line.trim() });
            }
          });
        }
      }
    }
  } catch (e) {}
  return results;
}

const all = [];
dirs.forEach(d => walk(d, all));
all.forEach(f => {
  console.log(`${f.file}:${f.line}`);
  console.log(`  ${f.content}`);
});
