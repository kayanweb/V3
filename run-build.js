const { spawnSync } = require('child_process');
const nodePath = 'C:\\Users\\doctor-01\\nodejs\\node-v24.15.0-win-x64\\node.exe';
const nextPath = './node_modules/next/dist/bin/next';
const result = spawnSync(nodePath, [nextPath, 'build'], {
  cwd: __dirname,
  stdio: 'pipe',
  encoding: 'utf-8'
});
console.log(result.stdout);
console.error(result.stderr);
process.exit(result.status);
