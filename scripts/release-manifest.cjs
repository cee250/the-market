const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lockfile = fs.readFileSync(path.join(root, 'package-lock.json'));
const outputPath = path.resolve(process.env.RELEASE_MANIFEST_PATH || path.join(root, 'release-manifest.json'));

const manifest = {
  application: packageJson.name,
  version: packageJson.version,
  commit: process.env.GITHUB_SHA || 'local',
  workflowRun: process.env.GITHUB_RUN_ID || null,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  lockfileSha256: crypto.createHash('sha256').update(lockfile).digest('hex'),
};

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}${os.EOL}`);
console.log(`Release manifest written to ${path.relative(root, outputPath)}`);
