import type { Router } from 'vue-router'
import { APP_NAME } from '@shared/constants/app'
import { env } from '@renderer/env'
import { useTabsStore } from '@renderer/stores/tabs'
import { useAuthStore } from '@renderer/stores/auth'

/**
 * 标题由渲染进程负责：BrowserWindow 的 title 会被页面 <title> 覆盖（实测确认），
 * 所以环境标记也在这里加。
 */
function resolveTitle(routeTitle?: string): string {
  const envLabel = env.isDev ? ' [DEV]' : ''
  const base = routeTitle ? `${routeTitle} - ${APP_NAME}` : APP_NAME
  return `${base}${envLabel}`
}

export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    // preload 注入的 argv 决定「当前是不是独立窗口上下文」；
    // 在普通浏览器里打开 dev 地址时 self 为 null，窗口页一律不放行。
    const self = window.api?.window?.self ?? null

    if (to.meta.window && self === null) return { path: '/home' }
    if (!to.meta.window && self !== null) {
      // 窗口进程只应渲染它被创建时那一条窗口路由
      return self.kind ? { path: `/w/${self.kind}` } : false
    }

    // 关掉登录页时，/login 本身也不该可达
    if (!env.featureLogin) {
      return to.path === '/login' ? { path: '/home' } : true
    }

    const auth = useAuthStore()
    if (to.path === '/login') {
      return auth.isAuthenticated ? { path: '/home' } : true
    }
    if (!auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    return true
  })

  router.afterEach((to) => {
    document.title = resolveTitle(to.meta.title)
    // 只给主界面里的叶子路由建标签页；窗口页与登录页都不建
    if (to.meta.title && !to.meta.window && to.matched.length > 1) useTabsStore().add(to)
  })
}
