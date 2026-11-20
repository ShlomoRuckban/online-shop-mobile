/** A fetch stand-in: each call answers with the next queued response (or throws when queued as an error). */
export interface FakeAnswer {
  status?: number
  body?: unknown
  /** Make fetch reject, as on a network failure. */
  fail?: boolean
}

export interface FakeFetch extends jest.Mock {
  answer: (...answers: FakeAnswer[]) => void
  lastRequest: () => { url: string; init: RequestInit & { headers: Record<string, string> } }
}

export function installFakeFetch(): FakeFetch {
  const queue: FakeAnswer[] = []
  const mock = jest.fn(async (_url: string, _init?: RequestInit) => {
    const next = queue.shift() ?? { status: 200, body: {} }
    if (next.fail) throw new TypeError('Network request failed')
    const status = next.status ?? 200
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (next.body === undefined) throw new SyntaxError('Unexpected end of JSON input')
        return next.body
      },
    } as Response
  }) as unknown as FakeFetch
  mock.answer = (...answers) => void queue.push(...answers)
  mock.lastRequest = () => {
    const call = mock.mock.calls.at(-1)
    if (!call) throw new Error('fetch was not called')
    return { url: call[0] as string, init: call[1] as RequestInit & { headers: Record<string, string> } }
  }
  globalThis.fetch = mock as unknown as typeof fetch
  return mock
}
