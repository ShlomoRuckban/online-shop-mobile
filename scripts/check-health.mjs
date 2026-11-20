// Live check: starts the real API in test mode and runs the app's API client against it
// (tests/live). Prints HEALTH OK only when the server started and every live test passed.
import { spawnSync } from 'node:child_process'
import { startTestServer } from './test-server.mjs'

const server = await startTestServer()
let status = 1
try {
  const result = spawnSync('yarn jest tests/live --ci', {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, LIVE_API: '1', EXPO_PUBLIC_API_URL: server.url },
  })
  status = result.status ?? 1
} finally {
  server.stop()
}
if (status !== 0) {
  console.error('HEALTH FAILED')
  process.exit(1)
}
console.log(`live API tests passed against ${server.url}`)
console.log('HEALTH OK')
