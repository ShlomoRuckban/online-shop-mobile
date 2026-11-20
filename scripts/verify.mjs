// Full regression check: dependency audit, lint, typecheck, unit and screen tests, and a production
// bundle of the app for Android, iOS and web (expo export). Prints MOBILE VERIFY OK only if all pass.
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const steps = [
  ['audit', 'yarn audit:check'],
  ['lint', 'yarn lint'],
  ['typecheck', 'yarn typecheck'],
  ['i18n', 'node scripts/check-i18n.mjs'],
  ['test', 'yarn test'],
  ['export', 'npx expo export --platform all --output-dir dist --no-bytecode'],
]

for (const [name, command] of steps) {
  console.log(`\n> ${command}`)
  const result = spawnSync(command, { stdio: 'inherit', shell: true, env: { ...process.env, CI: '1' } })
  if (result.status !== 0) {
    console.error(`\nMOBILE VERIFY FAILED at "${name}"`)
    process.exit(1)
  }
}
// the export only proves the app bundles; nothing ships from dist/
rmSync('dist', { recursive: true, force: true })
console.log('\nMOBILE VERIFY OK')
