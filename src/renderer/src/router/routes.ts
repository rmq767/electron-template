import type { RouteRecordRaw } from 'vue-router'
import { LANDING_PATH, LANDING_ROUTE_NAME, LANDING_TITLE } from '@shared/constants/navigation'
import MainFrame from '@renderer/layouts/main-frame/main-frame.vue'

/**
 * 约定：独立窗口的路由必须挂在 /w/ 下，且 path 要与 main/window/presets.ts
 * 里的 kind 一字不差（manager 是按 `#/w/${kind}` 拼地址的）。
 * 组件与路由名统一 kebab-case，keep-alive 的 include 直接复用路由名。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainFrame,
    redirect: LANDING_PATH,
    children: [
      {
        path: LANDING_PATH.slice(1),
        name: LANDING_ROUTE_NAME,
        component: () => import('@renderer/views/system/user/index.vue'),
        meta: { title: LANDING_TITLE, group: '管理' }
      },
      {
        // 主窗口内的兜底：保留标题栏与侧栏，不让 404 把应用外壳一起替换掉
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@renderer/views/error/not-found.vue'),
        meta: { title: '页面不存在', hidden: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@renderer/views/login/login-view.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/splash',
    name: 'splash',
    component: () => import('@renderer/views/startup/splash-view.vue'),
    meta: { title: '启动', window: true, hidden: true }
  },
  {
    // 独立窗口兜底：路由必须显式声明 meta.window，否则守卫会重定向到它
    path: '/w/:pathMatch(.*)*',
    name: 'window-fallback',
    component: () => import('@renderer/views/window/window-fallback.vue'),
    meta: { title: '窗口未就绪', window: true, hidden: true }
  }
]

/** 侧边栏直接由路由生成，不再维护第二份菜单数据。 */
export const menuRoutes = routes
  .filter((route) => route.path === '/')[0]
  ?.children?.filter((child) => !child.meta?.hidden)
