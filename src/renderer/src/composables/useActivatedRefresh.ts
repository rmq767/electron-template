import { onActivated } from 'vue'

/**
 * keep-alive 页面回到前台时刷新数据。
 * 首次激活由 onMounted 负责，这里跳过，避免首屏重复请求。
 */
export function useActivatedRefresh(getList: () => void | Promise<void>): void {
  let firstActivated = true

  onActivated(() => {
    if (firstActivated) {
      firstActivated = false
      return
    }
    void getList()
  })
}
