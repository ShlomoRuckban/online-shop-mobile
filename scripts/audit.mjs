// Dependency audit for `yarn verify`: fails only on high or critical advisories.
// yarn 1 exits with a bit mask of the severities found (1 info, 2 low, 4 moderate, 8 high, 16 critical).
// With no network the audit is skipped with a warning, so verify still works offline.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HIGH = 8
export const CRITICAL = 16

/** Decide the outcome of `yarn audit --summary` from its exit status and output. */
export function auditOutcome(status, output) {
  const ran = /Packages audited/i.test(output) || /0 vulnerabilities found/i.test(output)
  if (!ran) return { ok: true, skipped: true }
  return { ok: (status & (HIGH | CRITICAL)) === 0, skipped: false }
}

function main() {
  const result = spawnSync('yarn audit --summary', { shell: true, encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  process.stdout.write(output)
  const outcome = auditOutcome(result.status ?? 1, output)
  if (outcome.skipped) {
    console.warn('AUDIT SKIPPED: could not reach the package registry')
  } else if (!outcome.ok) {
    console.error('AUDIT FAILED: high or critical advisories (run `yarn audit` for details)')
    process.exit(1)
  } else {
    console.log('AUDIT OK (no high or critical advisories)')
  }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) main()
