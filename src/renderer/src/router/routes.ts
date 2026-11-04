import type { RouteRecordRaw } from 'vue-router'
import MainFrame from '@renderer/layouts/MainFrame/index.vue'

/**
 * 约定：独立窗口的路由必须挂在 /w/ 下，且 path 要与 main/window/presets.ts
 * 里的 kind 一字不差（manager 是按 `#/w/${kind}` 拼地址的）。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainFrame,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@renderer/views/home/index.vue'),
        meta: { title: '概览', keepAlive: true }
      },
      {
        path: 'demo/dialog',
        name: 'DemoDialog',
        component: () => import('@renderer/views/demo/DialogLab.vue'),
        meta: { title: '弹层示例', keepAlive: true }
      },
      {
        path: 'demo/window',
        name: 'DemoWindow',
        component: () => import('@renderer/views/demo/WindowLab.vue'),
        meta: { title: '独立窗口示例', keepAlive: true }
      },
      {
        path: 'system/user',
        name: 'SystemUser',
        component: () => import('@renderer/views/system/UserView.vue'),
        meta: { title: '用户管理', keepAlive: true }
      },
      {
        path: 'system/role',
        name: 'SystemRole',
        component: () => import('@renderer/views/system/RoleView.vue'),
        meta: { title: '角色管理', keepAlive: true }
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: () => import('@renderer/views/system/SettingsView.vue'),
        meta: { title: '系统设置', keepAlive: true }
      },
      {
        path: 'dev/ipc',
        name: 'DevIpc',
        component: () => import('@renderer/views/dev/IpcConsole.vue'),
        meta: { title: 'IPC 基座', hidden: true }
      }
    ]
  },
  {
    path: '/w/user-form',
    name: 'WUserForm',
    component: () => import('@renderer/windows/UserFormWindow.vue'),
    meta: { title: '用户表单', window: true, hidden: true }
  },
  {
    path: '/w/export-task',
    name: 'WExportTask',
    component: () => import('@renderer/windows/ExportTaskWindow.vue'),
    meta: { title: '导出任务', window: true, hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@renderer/views/error/NotFound.vue'),
    meta: { title: '页面不存在', hidden: true }
  }
]

/** 侧边栏直接由路由生成，不再维护第二份菜单数据。 */
export const menuRoutes = routes
  .filter((route) => route.path === '/')[0]
  ?.children?.filter((child) => !child.meta?.hidden)
