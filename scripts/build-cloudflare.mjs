import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runBuild(workspace) {
	const args = ['run', 'build', '--workspace', workspace];
	console.log(`Building workspace: ${workspace} (${npmCommand} ${args.join(' ')})`);
	try {
		execFileSync(npmCommand, args, { stdio: 'inherit' });
	} catch (error) {
		const exitCode = error.status ?? 'unknown';
		throw new Error(`Build failed for workspace "${workspace}" with exit code ${exitCode}. See the workspace output above for the root error.`);
	}
}

runBuild('frontend');
runBuild('admin');

await rm('frontend/dist/admin', { recursive: true, force: true });
await mkdir('frontend/dist/admin', { recursive: true });
await cp('admin/dist', 'frontend/dist/admin', { recursive: true });