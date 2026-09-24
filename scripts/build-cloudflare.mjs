import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

execFileSync(npmCommand, ['run', 'build', '--workspace', 'frontend'], { stdio: 'inherit' });
execFileSync(npmCommand, ['run', 'build', '--workspace', 'admin'], { stdio: 'inherit' });

await rm('frontend/dist/admin', { recursive: true, force: true });
await mkdir('frontend/dist/admin', { recursive: true });
await cp('admin/dist', 'frontend/dist/admin', { recursive: true });