const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.bud') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if ((full.endsWith('.ts') || full.endsWith('.tsx'))) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('@components/ui/button') ||
          content.includes('@context/auth-context') ||
          content.includes('@components/ui/input')) {
        console.log(`FILE: ${full}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('@components/ui/button') ||
              line.includes('@context/auth-context') ||
              line.includes('@components/ui/input')) {
            console.log(`  ${idx+1}: ${line.trim()}`);
          }
        });
        console.log('');
      }
    }
  }
}
walk('.');
