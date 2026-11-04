import type { RouteRecordRaw } from 'vue-router'
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
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@renderer/views/home/home-view.vue'),
        meta: { title: '概览', group: '工作台' }
      },
      {
        path: 'demo/dialog',
        name: 'demo-dialog',
        component: () => import('@renderer/views/demo/dialog-lab.vue'),
        meta: { title: '弹层示例', group: '工作台' }
      },
      {
        path: 'demo/window',
        name: 'demo-window',
        component: () => import('@renderer/views/demo/window-lab.vue'),
        meta: { title: '独立窗口示例', group: '工作台' }
      },
      {
        path: 'system/user',
        name: 'system-user',
        component: () => import('@renderer/views/system/user-view.vue'),
        meta: { title: '用户管理', group: '管理' }
      },
      {
        path: 'system/role',
        name: 'system-role',
        component: () => import('@renderer/views/system/role-view.vue'),
        meta: { title: '角色管理', group: '管理' }
      },
      {
        path: 'system/settings',
        name: 'system-settings',
        component: () => import('@renderer/views/system/settings-view.vue'),
        meta: { title: '系统设置', group: '管理' }
      },
      {
        path: 'dev/ipc',
        name: 'dev-ipc',
        component: () => import('@renderer/views/dev/ipc-console.vue'),
        meta: { title: 'IPC 基座', hidden: true }
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
    path: '/w/user-form',
    name: 'w-user-form',
    component: () => import('@renderer/windows/user-form-window.vue'),
    meta: { title: '用户表单', window: true, hidden: true }
  },
  {
    path: '/w/export-task',
    name: 'w-export-task',
    component: () => import('@renderer/windows/export-task-window.vue'),
    meta: { title: '导出任务', window: true, hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@renderer/views/error/not-found.vue'),
    meta: { title: '页面不存在', hidden: true }
  }
]

/** 侧边栏直接由路由生成，不再维护第二份菜单数据。 */
export const menuRoutes = routes
  .filter((route) => route.path === '/')[0]
  ?.children?.filter((child) => !child.meta?.hidden)
