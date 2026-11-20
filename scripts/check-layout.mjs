// Checks the repo layout leaf 1.1 promises: git with the pre-push hook, ignore rules, AI docs,
// README, env example, and no configuration that would reach an outside service (EAS, OTA updates).
// Prints LAYOUT OK only when every check passes.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (file) => readFileSync(resolve(root, file), 'utf8')
const problems = []
const check = (ok, message) => ok || problems.push(message)

// git and the hook
check(existsSync(resolve(root, '.git')), 'not a git repository')
let hooksPath = ''
try {
  hooksPath = execSync('git config core.hooksPath', { cwd: root, encoding: 'utf8' }).trim()
} catch {
  // not set
}
check(hooksPath === '.githooks', `core.hooksPath is "${hooksPath}", expected .githooks`)
check(existsSync(resolve(root, '.githooks/pre-push')) && read('.githooks/pre-push').includes('yarn verify'), '.githooks/pre-push must run yarn verify')

// ignore rules: things that must never be committed
const ignore = read('.gitignore').split(/\r?\n/).map((line) => line.trim())
for (const entry of ['.unlazy/', 'node_modules/', '.env', '.env*.local', '.claude/settings.local.json', 'dist/', '.expo/', '*.jks', '*.key']) {
  check(ignore.includes(entry), `.gitignore is missing ${entry}`)
}
let tracked = ''
try {
  tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
} catch {
  // no index yet
}
for (const line of tracked.split(/\r?\n/)) {
  if (/^(\.unlazy\/|node_modules\/|\.env$|dist\/)/.test(line)) problems.push(`tracked file that must be ignored: ${line}`)
}

// docs
check(read('CLAUDE.md').includes('@.ai/rules.md'), 'CLAUDE.md must load .ai/rules.md')
for (const file of ['.ai/rules.md', '.ai/README.md', '.ai/progress.md', '.ai/feedback.md', 'README.md', '.env.example']) {
  check(existsSync(resolve(root, file)) && read(file).trim().length > 0, `missing or empty ${file}`)
}
check(read('.ai/rules.md').includes('Do not push unless told to'), '.ai/rules.md lost the git rules')

// no outside services: no EAS project, no over-the-air updates, no EAS tooling
const expo = JSON.parse(read('app.json')).expo ?? {}
check(!expo.updates?.url, 'app.json sets an updates URL (over-the-air updates contact Expo servers)')
check(!expo.extra?.eas, 'app.json has an EAS project id')
check(!expo.owner, 'app.json names an Expo account owner')
check(expo.scheme === 'onlineshop', 'app.json scheme must be "onlineshop" (deep links)')
check(!existsSync(resolve(root, 'eas.json')), 'eas.json exists (EAS builds are deferred)')
const pkg = JSON.parse(read('package.json'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
for (const name of ['expo-updates', 'eas-cli', 'expo-notifications', 'expo-dev-client']) check(!(name in deps), `${name} is a dependency (deferred until launch)`)
check(pkg.main === 'expo-router/entry', 'package.json main must be expo-router/entry')
check(existsSync(resolve(root, 'src/app/_layout.tsx')), 'routes must live in src/app (Expo SDK 58)')

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'))
  console.error(`LAYOUT FAILED (${problems.length} problem(s))`)
  process.exit(1)
}
console.log('LAYOUT OK')
