import { env } from '@renderer/env'

/**
 * 极简 fetch 封装。不引 axios：桌面端只需要基址、token、超时和 401 联动，
 * 这三件用 fetch 足够，少一个依赖。
 *
 * 模板不虚构后端接口，所以默认没有真实请求可发；
 * 接真实后端时在 main.ts 里把 configureHttp 的两个回调接到 auth store。
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

interface HttpConfig {
  getToken: () => string | null
  onUnauthorized: () => void
}

let config: HttpConfig = { getToken: () => null, onUnauthorized: () => {} }

export function configureHttp(next: HttpConfig): void {
  config = next
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!env.apiBaseUrl) {
    throw new Error(
      '[http] 未配置 RENDERER_VITE_API_BASE_URL。模板默认不连后端；' +
        '接真实接口时先填环境变量，再把 api/modules 下的 mock 换成 request() 调用。'
    )
  }
  const url = new URL(path, env.apiBaseUrl)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = config.getToken()
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })

  if (response.status === 401) {
    config.onUnauthorized()
    throw new HttpError(401, '登录状态已失效，请重新登录')
  }
  if (!response.ok) {
    throw new HttpError(response.status, `${response.status} ${response.statusText}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
