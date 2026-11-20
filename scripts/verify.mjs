// Full regression check: dependency audit, lint, typecheck, unit and screen tests, and a production
// bundle of the app for Android, iOS and web (expo export). Prints MOBILE VERIFY OK only if all pass.
// Each step's output is also saved in .verify/<step>.log, so a failure seen through a tool that keeps
// only the end of the output can still be read in full.
import { spawn } from 'node:child_process'
import { createWriteStream, mkdirSync, rmSync } from 'node:fs'

const steps = [
  ['audit', 'yarn audit:check'],
  ['lint', 'yarn lint'],
  ['typecheck', 'yarn typecheck'],
  ['i18n', 'node scripts/check-i18n.mjs'],
  ['test', 'yarn test'],
  ['export', 'npx expo export --platform all --output-dir dist'],
]

rmSync('.verify', { recursive: true, force: true })
mkdirSync('.verify')

function run(name, command) {
  return new Promise((resolve) => {
    const log = createWriteStream(`.verify/${name}.log`)
    const child = spawn(command, { shell: true, env: { ...process.env, CI: '1' } })
    for (const [stream, target] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      stream.on('data', (chunk) => {
        target.write(chunk)
        log.write(chunk)
      })
    }
    child.on('close', (code) => log.end(() => resolve(code ?? 1)))
  })
}

for (const [name, command] of steps) {
  console.log(`\n> ${command}`)
  if ((await run(name, command)) !== 0) {
    console.error(`\nMOBILE VERIFY FAILED at "${name}" (full output in .verify/${name}.log)`)
    process.exit(1)
  }
}
// the export only proves the app bundles; nothing ships from dist/
rmSync('dist', { recursive: true, force: true })
console.log('\nMOBILE VERIFY OK')
