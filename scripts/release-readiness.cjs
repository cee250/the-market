const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml');
const readmePath = path.join(root, 'README.md');
const deploymentPath = path.join(root, 'DEPLOYMENT.md');
const manifestPath = path.join(root, 'release-manifest.json');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(`release readiness check failed: ${message}`);
}

const workflow = read(workflowPath);
const readme = read(readmePath);
const deployment = read(deploymentPath);

assert(/^permissions:\s*$/m.test(workflow), 'workflow must declare top-level permissions');
assert(/permissions:\s*\n\s+contents:\s+read/m.test(workflow), 'workflow contents permission must be read-only');
assert(/concurrency:\s*\n\s+group:\s+market-ci-/m.test(workflow), 'workflow must define a stable concurrency group');
assert(/cancel-in-progress:\s*true/m.test(workflow), 'workflow must cancel superseded runs');
assert(/timeout-minutes:\s+20/m.test(workflow), 'verification job must have a bounded timeout');
assert(/trap cleanup EXIT/.test(workflow), 'container smoke test must trap cleanup on every exit path');
assert(/docker logs market-api-ci/.test(workflow), 'container smoke failure path must print logs');
assert(/docker rm -f market-api-ci/.test(workflow), 'container smoke test must remove its container');
assert(/uses:\s+actions\/checkout@[0-9a-f]{40}/.test(workflow), 'checkout action must be pinned to a commit SHA');
assert(/uses:\s+actions\/setup-node@[0-9a-f]{40}/.test(workflow), 'setup-node action must be pinned to a commit SHA');
assert(/uses:\s+actions\/upload-artifact@[0-9a-f]{40}/.test(workflow), 'artifact action must be pinned to a commit SHA');
assert(/npm run release:manifest/.test(workflow), 'workflow must generate a release manifest');
assert(/path:\s+release-manifest\.json/.test(workflow), 'workflow must publish the release manifest');
assert(/npm run release-readiness/.test(workflow), 'workflow must run release-readiness verification');
assert(/Phase 53.*✅ \*\*Complete\*\*/.test(readme), 'README must mark Phase 53 complete');
assert(/Phase 54.*✅ \*\*Complete\*\*/.test(readme), 'README must mark Phase 54 complete');
assert(/Phase 55.*✅ \*\*Complete\*\*/.test(readme), 'README must mark Phase 55 complete');
assert(/Phase 56.*✅ \*\*Complete\*\*/.test(readme), 'README must mark Phase 56 complete');
assert(/Phase 57.*🚧 \*\*In progress\*\*/.test(readme), 'README must identify Phase 57 as in progress');
assert(/release-readiness/.test(deployment), 'deployment runbook must document the readiness verifier');

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(read(manifestPath));
  assert(typeof manifest.application === 'string' && manifest.application.length > 0, 'manifest application is missing');
  assert(typeof manifest.version === 'string' && manifest.version.length > 0, 'manifest version is missing');
  assert(typeof manifest.commit === 'string' && manifest.commit.length > 0, 'manifest commit is missing');
  assert(typeof manifest.lockfileSha256 === 'string' && /^[a-f0-9]{64}$/.test(manifest.lockfileSha256), 'manifest lockfile digest is invalid');
}

console.log('release readiness checks passed');
