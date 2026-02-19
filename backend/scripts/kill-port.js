/* eslint-disable no-console */
const { execSync } = require('child_process');

const portArg = process.argv[2];
const port = Number(portArg);

if (!portArg || Number.isNaN(port) || port <= 0) {
	console.error('Usage: node scripts/kill-port.js <port>');
	process.exit(2);
}

function run(cmd) {
	return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

function uniq(arr) {
	return Array.from(new Set(arr));
}

try {
	if (process.platform === 'win32') {
		// netstat output example includes PID at end of line.
		const output = run(`cmd /c "netstat -ano | findstr :${port}"`);
		const pids = uniq(
			output
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter(Boolean)
				.map((line) => line.split(/\s+/).pop())
				.filter((pid) => pid && /^\d+$/.test(pid))
		);

		if (pids.length === 0) {
			console.log(`No process is listening on port ${port}.`);
			process.exit(0);
		}

		console.log(`Killing processes on port ${port}: ${pids.join(', ')}`);
		for (const pid of pids) {
			try {
				execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
			} catch (err) {
				console.warn(`Failed to kill PID ${pid}: ${err.message}`);
			}
		}

		process.exit(0);
	}

	// macOS/Linux fallback
	let pids = [];
	try {
		const out = run(`bash -lc "lsof -ti tcp:${port}"`);
		pids = uniq(out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
	} catch {
		// lsof might be missing
	}

	if (pids.length === 0) {
		console.log(`No process is listening on port ${port} (or lsof not available).`);
		process.exit(0);
	}

	console.log(`Killing processes on port ${port}: ${pids.join(', ')}`);
	for (const pid of pids) {
		try {
			execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
		} catch (err) {
			console.warn(`Failed to kill PID ${pid}: ${err.message}`);
		}
	}

	process.exit(0);
} catch (err) {
	// On Windows, findstr returns exit code 1 when no matches.
	if (process.platform === 'win32' && String(err.status) === '1') {
		console.log(`No process is listening on port ${port}.`);
		process.exit(0);
	}

	console.error('kill-port failed:', err.message);
	process.exit(1);
}