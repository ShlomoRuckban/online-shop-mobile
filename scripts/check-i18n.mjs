// Checks the app's message catalogues: English, Hebrew and Spanish must have exactly the same keys
// (web texts in web.<lang>.json merged with app texts in mobile.<lang>.ts), and no text may be empty.
// Prints I18N OK only when they match.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = resolve(import.meta.dirname, '../src/i18n/messages')
const LANGS = { en: 'mobileEn', he: 'mobileHe', es: 'mobileEs' }

/** Loads mobile.<lang>.ts without a TypeScript toolchain: its body is a plain object literal. */
async function loadAppTexts(lang, exportName, tmp) {
  const source = readFileSync(join(dir, `mobile.${lang}.ts`), 'utf8')
  const declaration = new RegExp(`export const ${exportName}[:\\s][^=]*=`)
  const start = source.search(declaration)
  if (start < 0) throw new Error(`mobile.${lang}.ts has no "export const ${exportName}"`)
  const file = join(tmp, `${lang}.mjs`)
  writeFileSync(file, source.slice(start).replace(declaration, 'export default'))
  return (await import(pathToFileURL(file).href)).default
}

function isTree(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function merge(base, extra) {
  const out = { ...base }
  for (const [key, value] of Object.entries(extra)) out[key] = isTree(out[key]) && isTree(value) ? merge(out[key], value) : value
  return out
}

/** Every leaf as "path" (a plural object counts as one leaf), plus the paths of empty texts. */
function leaves(tree, prefix = '', empty = []) {
  const keys = []
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      keys.push(path)
      if (!value.trim()) empty.push(path)
    } else if (isTree(value) && typeof value.other === 'string') {
      keys.push(path)
      for (const [form, text] of Object.entries(value)) if (typeof text !== 'string' || !text.trim()) empty.push(`${path}.${form}`)
    } else if (isTree(value)) {
      keys.push(...leaves(value, path, empty).keys)
    } else {
      empty.push(`${path} (not text)`)
    }
  }
  return { keys, empty }
}

const tmp = mkdtempSync(join(tmpdir(), 'i18n-check-'))
const problems = []
const sets = {}
try {
  for (const [lang, exportName] of Object.entries(LANGS)) {
    const web = JSON.parse(readFileSync(join(dir, `web.${lang}.json`), 'utf8'))
    const app = await loadAppTexts(lang, exportName, tmp)
    const { keys, empty } = leaves(merge(web, app))
    sets[lang] = new Set(keys)
    for (const path of empty) problems.push(`${lang}: empty text at ${path}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

for (const lang of ['he', 'es']) {
  for (const key of sets.en) if (!sets[lang].has(key)) problems.push(`${lang}: missing ${key}`)
  for (const key of sets[lang]) if (!sets.en.has(key)) problems.push(`${lang}: extra ${key} (not in English)`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`I18N FAILED (${problems.length} problem(s))`)
  process.exit(1)
}
console.log(`${sets.en.size} keys in en, he and es`)
console.log('I18N OK')
