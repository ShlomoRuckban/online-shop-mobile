// Copies sections of the web client's message catalogues (../online-shop/src/i18n/messages)
// into src/i18n/messages/web.<lang>.json, so the app uses the same wording.
// Usage: node scripts/import-messages.mjs section1 section2 ...  (sections are top-level keys)
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const sections = process.argv.slice(2)
if (sections.length === 0) {
  console.error('Name the sections to import, e.g. common apiErrors')
  process.exit(1)
}
const webDir = resolve(import.meta.dirname, '../../online-shop/src/i18n/messages')
const outDir = resolve(import.meta.dirname, '../src/i18n/messages')
const tmp = mkdtempSync(join(tmpdir(), 'messages-'))

try {
  for (const lang of ['en', 'he', 'es']) {
    const source = readFileSync(join(webDir, `${lang}.ts`), 'utf8')
    const declaration = new RegExp(`export const ${lang}[:\\s][^=]*=`)
    const start = source.search(declaration)
    if (start < 0) throw new Error(`No "export const ${lang}" in ${lang}.ts`)
    const body = source.slice(start).replace(declaration, 'export default')
    const file = join(tmp, `${lang}.mjs`)
    writeFileSync(file, body.replace(/\}\s*as const\s*$/, '}'))
    const all = (await import(pathToFileURL(file).href)).default
    const outFile = join(outDir, `web.${lang}.json`)
    let picked = {}
    try {
      picked = JSON.parse(readFileSync(outFile, 'utf8'))
    } catch {
      // first import
    }
    for (const name of sections) {
      if (!(name in all)) throw new Error(`Section "${name}" is not in ${lang}.ts`)
      picked[name] = all[name]
    }
    writeFileSync(outFile, JSON.stringify(picked, null, 2) + '\n')
    console.log(`${lang}: ${Object.keys(picked).join(', ')}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
