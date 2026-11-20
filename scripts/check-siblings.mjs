// Checks that the server and web client repos have no uncommitted changes, so a mobile-only node
// left them as they were. Prints SIBLINGS OK only when both working trees are clean.
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const problems = []
for (const name of ['online-shop-server', 'online-shop']) {
  const dir = resolve(import.meta.dirname, '../..', name)
  try {
    const status = execSync('git status --porcelain', { cwd: dir, encoding: 'utf8' }).trim()
    if (status) problems.push(`${name} has uncommitted changes:\n${status}`)
    else console.log(`${name}: clean`)
  } catch (err) {
    problems.push(`${name}: git status failed (${err.message})`)
  }
}
if (problems.length) {
  console.error(problems.join('\n'))
  console.error('SIBLINGS FAILED')
  process.exit(1)
}
console.log('SIBLINGS OK')
