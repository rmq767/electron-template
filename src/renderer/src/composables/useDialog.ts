import { ref, type Ref } from 'vue'

/**
 * 页面内弹层的可见性与提交流程。
 * 默认用法就是页面内声明——生命周期属于当前页，切路由就该消失；
 * 只有确实需要「跨路由还活着」的浮层才升级到全局单例。
 */
export interface UseDialogOptions {
  /** close(true) 后要做的事，通常是刷新列表 */
  onRefresh?: () => void
}

export interface UseDialogReturn<T> {
  visible: Ref<boolean>
  loading: Ref<boolean>
  payload: Ref<T | null>
  open: (data?: T) => void
  close: (refresh?: boolean) => void
}

export function useDialog<T = undefined>(options: UseDialogOptions = {}): UseDialogReturn<T> {
  const visible = ref(false)
  const loading = ref(false)
  const payload = ref<T | null>(null) as Ref<T | null>

  function open(data?: T): void {
    payload.value = (data ?? null) as T | null
    visible.value = true
  }

  function close(refresh = false): void {
    visible.value = false
    loading.value = false
    payload.value = null
    if (refresh) options.onRefresh?.()
  }

  return { visible, loading, payload, open, close }
}
