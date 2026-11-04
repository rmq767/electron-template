import { onScopeDispose, ref, shallowRef } from 'vue'
import type { WindowKind, WindowPropsMap } from '@shared/ipc/window-spec'

/**
 * 独立窗口的参数装载：挂载后向主进程要 payload，并订阅后续推送。
 * 数据不进 URL，所以刷新/HMR 后要重取——这个 composable 就是为此存在的。
 */
export function useWindowPayload<K extends WindowKind>(kind: K) {
  const ready = ref(false)
  const error = ref('')
  const props = shallowRef<WindowPropsMap[K] | null>(null)

  // 解绑交给 onScopeDispose，组件卸载即清理，避免监听器跨窗口残留
  const unbind = window.api.window.pushProps<K>((next) => {
    props.value = next ?? null
  })

  async function load(): Promise<void> {
    try {
      const payload = await window.api.window.getPayload<K>()
      if (payload.kind !== kind) {
        throw new Error(`窗口类型不符：路由要 ${kind}，主进程给 ${payload.kind}`)
      }
      props.value = payload.props ?? null
      ready.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    }
  }

  void load()
  onScopeDispose(unbind)

  return { ready, error, props, reload: load }
}
