// A minimal fetch on Node's http module. Inside jest-expo the global fetch is Expo's runtime version,
// which cannot reach a real server from tests; the live tests (tests/live) use this one instead.
import http from 'node:http'

export const nodeFetch = ((url: string, init: RequestInit = {}) =>
  new Promise<Response>((resolve, reject) => {
    const req = http.request(url, { method: init.method ?? 'GET', headers: init.headers as Record<string, string> }, (res) => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => (text += chunk))
      res.on('end', () => {
        const status = res.statusCode ?? 0
        resolve({ ok: status >= 200 && status < 300, status, json: async () => JSON.parse(text), text: async () => text } as Response)
      })
    })
    req.on('error', (err) => reject(new TypeError(`Network request failed: ${err.message}`)))
    init.signal?.addEventListener('abort', () => req.destroy(new Error('Aborted')))
    if (typeof init.body === 'string') req.write(init.body)
    req.end()
  })) as typeof fetch
