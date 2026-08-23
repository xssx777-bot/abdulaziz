import { spawn, type ChildProcess } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestServer {
  url: string;
  stop: () => Promise<void>;
}

/**
 * Asks the OS for a free port. A hardcoded one collides with a leftover server
 * from an interrupted run, and with a sibling job on the same CI runner.
 */
async function freePort(): Promise<number> {
  const { createServer } = await import('node:net');
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (typeof address === 'string' || address === null) {
        probe.close(() => reject(new Error('could not determine a free port')));
        return;
      }
      const { port } = address;
      probe.close(() => resolve(port));
    });
  });
}

/**
 * Boots the production server against a throwaway SQLite database.
 *
 * `next start` rather than `next dev`: it serves the build CI has already
 * produced, so startup is a second or two instead of half a minute, and what
 * gets exercised is the artifact that would ship.
 */
export async function startTestServer(): Promise<TestServer> {
  const port = await freePort();
  const workspace = mkdtempSync(join(tmpdir(), 'stockvista-e2e-'));
  const env = {
    ...process.env,
    DATABASE_URL: `file:${join(workspace, 'e2e.db')}`,
    AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e_test_secret',
    PORT: String(port),
  };

  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    env,
    stdio: 'pipe',
  });

  // The binary directly, not `npx next`: npx wraps the server in a shell that
  // absorbs SIGTERM, orphaning the server and leaving the test process hanging
  // on a live child handle.
  const binary = join(process.cwd(), 'node_modules', '.bin', 'next');
  const server: ChildProcess = spawn(binary, ['start', '--port', String(port)], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const log: string[] = [];
  server.stdout?.on('data', (chunk) => log.push(String(chunk)));
  server.stderr?.on('data', (chunk) => log.push(String(chunk)));

  const url = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise<void>((resolve) => server.once('exit', () => resolve()));
      server.kill('SIGTERM');
      // Escalate rather than hang forever if it ignores the polite signal.
      const forced = setTimeout(() => server.kill('SIGKILL'), 5_000);
      await exited;
      clearTimeout(forced);
    }
    rmSync(workspace, { recursive: true, force: true });
  };

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      await stop();
      throw new Error(`server exited with code ${server.exitCode}:\n${log.join('')}`);
    }
    try {
      // Any response means the server is listening; the status does not matter.
      await fetch(`${url}/api/tadawul/stocks`);
      return { url, stop };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  await stop();
  throw new Error(`server did not start within 60s:\n${log.join('')}`);
}
