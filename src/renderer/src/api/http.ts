import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { env } from '@renderer/env'
import type { ApiResponse } from '@renderer/types/common'

/**
 * 请求层：axios 实例 + 拦截器，对外仍是 request({ url, method, params, data, signal })。
 *
 * 拦截器只做三件事：注入 token、把 AxiosResponse 拆成响应体、把失败归一成 HttpError。
 * 不在这里弹 ElMessage：桌面端统一走 window.api.log，页面按 res.code 自己判断，
 * 取消与真失败才不会混成同一层。
 *
 * 响应包络（code/msg/data 与 code/msg/rows/total）不在这层拆，
 * 页面按 `res.code === HttpStatus.SUCCESS` 判断；要拆包只拆具体接口模块的返回值。
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestConfig {
  /** 相对路径，与 RENDERER_VITE_API_BASE_URL 拼接 */
  url: string
  method?: HttpMethod
  /** 查询参数；值为 undefined / null / 空串时不发送 */
  params?: Record<string, unknown>
  /** 请求体，axios 自动 JSON 序列化 */
  data?: unknown
  /** 竞态取消，由 useAbortableRequest 注入 */
  signal?: AbortSignal
  /** 单次请求超时（毫秒），覆盖 configureHttp 的全局值 */
  timeout?: number
  headers?: Record<string, string>
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

interface HttpConfig {
  getToken: () => string | null
  onUnauthorized: () => void
  timeout: number
}

let config: HttpConfig = {
  getToken: () => null,
  onUnauthorized: () => {},
  timeout: 15000
}

/** 身份与会话仍由 main.ts 注入 getter 闭包，避免 http ↔ store 循环依赖。 */
export function configureHttp(next: Partial<HttpConfig>): void {
  config = { ...config, ...next }
}

const service: AxiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' }
})

service.interceptors.request.use((request) => {
  const token = config.getToken()
  if (token) request.headers.set('Authorization', `Bearer ${token}`)
  return request
})

service.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 主动取消原样透出，交给 useAbortableRequest 收敛成 undefined
    if (axios.isCancel(error)) return Promise.reject(error)
    return Promise.reject(toHttpError(error))
  }
)

/** fetch 时代的「空值不下发」口径保持一致，避免把空筛选项发给后端。 */
function cleanParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  )
  return Object.fromEntries(entries)
}

/** 后端返回的 JSON 包络通常带 msg/message；优先把它透出，避免只剩状态码。 */
function readServerMessage(error: AxiosError): string | null {
  const data: unknown = error.response?.data
  if (typeof data === 'string') {
    const text = data.trim()
    // HTML 错误页/超长文本不适合直接弹给用户
    return text && !text.startsWith('<') && text.length <= 300 ? text : null
  }
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  for (const key of ['msg', 'message', 'error'] as const) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 300)
  }
  return null
}

function toHttpError(error: AxiosError): HttpError {
  const status = error.response?.status
  if (status === 401) {
    config.onUnauthorized()
    return new HttpError(401, '登录状态已失效，请重新登录')
  }
  if (status) {
    const serverMessage = readServerMessage(error)
    return new HttpError(
      status,
      serverMessage ?? `${status} ${error.response?.statusText ?? ''}`.trim()
    )
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    const timeout = error.config?.timeout ?? config.timeout
    return new HttpError(0, `请求超时（${timeout}ms）：${error.config?.url ?? ''}`)
  }
  return new HttpError(0, '网络连接失败，请检查网络或服务地址')
}

async function request<T = ApiResponse>(options: RequestConfig): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new Error(
      '[http] 未配置 RENDERER_VITE_API_BASE_URL。模板默认不连后端；' +
        '接真实接口时先填环境变量，再把 api/<模块> 下的 mock 换成 request() 调用。'
    )
  }
  const response = await service.request<T>({
    url: options.url,
    method: options.method ?? 'GET',
    baseURL: env.apiBaseUrl,
    params: cleanParams(options.params),
    data: options.data,
    signal: options.signal,
    timeout: options.timeout ?? config.timeout,
    headers: options.headers
  })
  return response.data
}

export default request
