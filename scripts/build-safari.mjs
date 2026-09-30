import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Build outside synced Documents folders: file-provider Finder metadata breaks codesigning.
const derived = await mkdtemp(join(tmpdir(), 'system-shade-build-'));
const result = spawnSync('xcodebuild', [
  '-project', 'safari/System Shade/System Shade.xcodeproj',
  '-scheme', 'System Shade', '-configuration', 'Debug', '-derivedDataPath', derived,
  'CODE_SIGN_IDENTITY=-', 'CODE_SIGNING_REQUIRED=NO', 'build'
], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error(`Build failed. Xcode output retained at ${derived}`);
  process.exit(result.status ?? 1);
}
await mkdir('build', { recursive: true });
await rm('build/System Shade.app', { recursive: true, force: true });
await cp(join(derived, 'Build/Products/Debug/System Shade.app'), 'build/System Shade.app', { recursive: true });
for (const [command, args] of [
  ['xattr', ['-cr', 'build/System Shade.app']],
  ['codesign', ['--verify', '--deep', '--strict', 'build/System Shade.app']],
  ['ditto', ['-c', '-k', '--norsrc', '--keepParent', 'build/System Shade.app', 'build/System Shade.zip']]
]) {
  const check = spawnSync(command, args, { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status ?? 1);
}
await rm(derived, { recursive: true, force: true });
console.log('Built and verified build/System Shade.app and build/System Shade.zip');
