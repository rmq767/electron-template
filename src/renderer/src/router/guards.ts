import type { Router } from 'vue-router'
import { APP_NAME } from '@shared/constants/app'
import { useTabsStore } from '@renderer/stores/tabs'

/**
 * 标题由渲染进程负责：BrowserWindow 的 title 会被页面 <title> 覆盖（实测确认），
 * 所以环境标记也在这里加。
 */
function resolveTitle(routeTitle?: string): string {
  const envLabel = import.meta.env.DEV ? ' [DEV]' : ''
  const base = routeTitle ? `${routeTitle} - ${APP_NAME}` : APP_NAME
  return `${base}${envLabel}`
}

export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    // preload 注入的 argv 决定「当前是不是独立窗口上下文」；
    // 在普通浏览器里打开 dev 地址时 self 为 null，窗口页一律不放行。
    const inWindowContext = window.api?.window?.self !== null

    if (to.meta.window && !inWindowContext) {
      return { path: '/home' }
    }
    if (!to.meta.window && inWindowContext) {
      // 窗口进程只应渲染它被创建时那一条窗口路由
      const kind = window.api.window.self?.kind
      return kind ? { path: `/w/${kind}` } : false
    }
    return true
  })

  router.afterEach((to) => {
    document.title = resolveTitle(to.meta.title)
    // 只给主界面里的叶子路由建标签页；窗口页 matched 只有一层，天然不建
    if (to.meta.title && !to.meta.window && to.matched.length > 1) useTabsStore().add(to)
  })
}
