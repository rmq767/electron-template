import { onScopeDispose, ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { WindowKind, WindowPropsMap } from '@shared/ipc/window-spec'

export interface UseWindowPayloadReturn<K extends WindowKind> {
  ready: Ref<boolean>
  error: Ref<string>
  props: ShallowRef<WindowPropsMap[K] | null>
  reload: () => Promise<void>
}

/**
 * 独立窗口的参数装载：挂载后向主进程要 payload，并订阅后续推送。
 * 数据不进 URL，所以刷新/HMR 后要重取——这个 composable 就是为此存在的。
 */
export function useWindowPayload<K extends WindowKind>(kind: K): UseWindowPayloadReturn<K> {
  const ready = ref(false)
  const error = ref('')
  // 泛型参数会被 Vue 的 UnwrapRef 重新推断，这里显式定型为接口声明的形状
  const props = shallowRef<WindowPropsMap[K] | null>(null) as ShallowRef<WindowPropsMap[K] | null>

  // 解绑交给 onScopeDispose，组件卸载即清理，避免监听器跨窗口残留
  const unbind = window.api.window.pushProps<K>((next) => {
    props.value = next ?? null
  })

  async function reload(): Promise<void> {
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

  void reload()
  onScopeDispose(unbind)

  return { ready, error, props, reload }
}
