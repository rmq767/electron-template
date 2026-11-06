import { onScopeDispose, type Ref } from 'vue'

const DEFAULT_KEY = 'default'

/**
 * 竞态防护：同一 key 的在途请求会被新请求取消，被取消的那次返回 undefined。
 * 页面用 `res?.code` 判空即可跳过过期响应，不需要自己写 try/finally。
 * 多数据源页面用 key 分组，不同 key 互不干扰。
 */
export function useAbortableRequest(): {
  run<T>(fetcher: (signal: AbortSignal) => Promise<T>, key?: string): Promise<T | undefined>
  runWithLoading<T>(
    loading: Ref<boolean>,
    fetcher: (signal: AbortSignal) => Promise<T>,
    key?: string
  ): Promise<T | undefined>
} {
  const pending = new Map<string, AbortController>()

  function start(key: string): AbortController {
    pending.get(key)?.abort()
    const controller = new AbortController()
    pending.set(key, controller)
    return controller
  }

  /** 取消（被取代或组件卸载）收敛成 undefined，真异常继续往外抛。 */
  function track<T>(
    key: string,
    controller: AbortController,
    task: Promise<T>
  ): Promise<T | undefined> {
    return task
      .then((value) => (controller.signal.aborted ? undefined : value))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return undefined
        throw error
      })
      .finally(() => {
        if (pending.get(key) === controller) pending.delete(key)
      })
  }

  function run<T>(
    fetcher: (signal: AbortSignal) => Promise<T>,
    key = DEFAULT_KEY
  ): Promise<T | undefined> {
    const controller = start(key)
    // 经 Promise 链发起：fetcher 同步抛错时也走统一收尾，不会把 loading/清理漏掉
    return track(
      key,
      controller,
      Promise.resolve().then(() => fetcher(controller.signal))
    )
  }

  /**
   * 列表页推荐入口。被取消的请求不熄灭 loading——此刻最新请求还在路上，
   * 由它负责收尾；否则慢一步的旧请求会把新请求的加载态提前关掉。
   * 不要与 run 共用同一 key：run 会把这里的在途请求 abort 掉，而 loading 就没人关了。
   */
  async function runWithLoading<T>(
    loading: Ref<boolean>,
    fetcher: (signal: AbortSignal) => Promise<T>,
    key = DEFAULT_KEY
  ): Promise<T | undefined> {
    const controller = start(key)
    loading.value = true
    const result = await track(
      key,
      controller,
      Promise.resolve().then(() => fetcher(controller.signal))
    )
    if (!controller.signal.aborted) loading.value = false
    return result
  }

  onScopeDispose(() => {
    for (const controller of pending.values()) controller.abort()
    pending.clear()
  })

  return { run, runWithLoading }
}
