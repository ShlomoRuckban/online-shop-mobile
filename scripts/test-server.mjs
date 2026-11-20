// Starts the shop API from ../online-shop-server in test mode (in-memory MongoDB, seeded items,
// E2E admin) on its own port, and stops it again. Used by the live checks and later by E2E.
import { spawn, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

export const SERVER_DIR = resolve(import.meta.dirname, '../../online-shop-server')
// 4100 belongs to the web client's E2E server; the app uses its own port so both can run
export const TEST_PORT = Number(process.env.MOBILE_TEST_PORT ?? 4101)
export const TEST_API_URL = `http://127.0.0.1:${TEST_PORT}/api`

/** Starts the server and resolves once /api/health answers ok (or rejects after `timeoutMs`). */
export async function startTestServer({ timeoutMs = 120_000 } = {}) {
  const child = spawn('yarn start:test', {
    cwd: SERVER_DIR,
    shell: true,
    env: { ...process.env, PORT: String(TEST_PORT), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))

  const stop = () => stopTree(child)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`test server exited early:\n${output.slice(-2000)}`)
    try {
      const res = await fetch(`${TEST_API_URL}/health`)
      if (res.ok) return { stop, url: TEST_API_URL }
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  stop()
  throw new Error(`test server did not answer within ${timeoutMs} ms:\n${output.slice(-2000)}`)
}

/** Ends the server and everything it started (yarn -> tsx -> node). */
function stopTree(child) {
  if (child.exitCode !== null || !child.pid) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill('SIGTERM')
}
