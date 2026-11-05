import type { Router } from 'vue-router'
import { APP_NAME } from '@shared/constants/app'
import { LANDING_PATH } from '@shared/constants/navigation'
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

    // 登录是独立窗口：它只渲染 /login，绝不进主框架
    if (self?.kind === 'login') {
      return to.path === '/login' ? true : { path: '/login' }
    }

    // 启动页只渲染 /splash；主界面与业务窗口都不可达
    if (self?.kind === 'splash') {
      return to.path === '/splash' ? true : { path: '/splash' }
    }

    if (to.meta.window && self === null) return { path: LANDING_PATH }
    if (!to.meta.window && self !== null) {
      // 窗口进程只应渲染它被创建时那一条窗口路由
      return self.kind ? { path: `/w/${self.kind}` } : false
    }

    // 关掉登录页时，/login 本身也不该可达
    if (!env.featureLogin) {
      return to.path === '/login' ? { path: LANDING_PATH } : true
    }

    const auth = useAuthStore()
    if (to.path === '/login') {
      if (auth.isAuthenticated) return { path: LANDING_PATH }
      // 主窗口不该渲染登录页：交给主进程切成独立登录窗（浏览器预览则直接放行）
      if (window.api?.app?.showLogin) {
        void window.api.app.showLogin().catch(() => {})
        return false
      }
      return true
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
