import { app, Menu, dialog, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { is } from '@electron-toolkit/utils'
import { logger } from '@main/log/logger'
import { createDiagnosticsPackage } from '@main/log/diagnostics'

/**
 * 应用菜单。菜单项只做主进程能自己做完的事（刷新、DevTools、缩放、打开日志目录），
 * 需要驱动界面时才经 IPC 推给渲染进程——目前还没有这种项，所以不预留 MenuAction 通道。
 */
export function buildApplicationMenu(): void {
  const isMac = process.platform === 'darwin'
  // 重载与 DevTools 只在开发期出现；生产菜单不提供绕过 webContents 快捷键的入口
  const devViewItems: MenuItemConstructorOptions[] = is.dev
    ? [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' }
      ]
    : []

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([{ role: 'appMenu' }] as MenuItemConstructorOptions[])
      : ([
          {
            label: '应用',
            submenu: [
              {
                label: '重启应用',
                click: () => {
                  app.relaunch()
                  // quit 而不是 exit：让 before-quit / will-quit 正常跑完，日志能 flush
                  app.quit()
                }
              },
              { type: 'separator' },
              { role: 'close', label: '关闭窗口' },
              { role: 'quit', label: '退出' }
            ]
          }
        ] as MenuItemConstructorOptions[])),
    { role: 'editMenu', label: '编辑' },
    {
      label: '视图',
      submenu: [
        ...devViewItems,
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    { role: 'windowMenu', label: '窗口' },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: `${app.getName()} ${app.getVersion()}`,
              detail: [
                `Electron ${process.versions.electron}`,
                `Node ${process.versions.node}`,
                `Chromium ${process.versions.chrome}`,
                `数据目录 ${app.getPath('userData')}`
              ].join('\n')
            })
          }
        },
        {
          label: '打开日志目录',
          click: async () => {
            const result = await shell.openPath(logger.dir())
            if (result) logger.warn('打开日志目录失败', { result })
          }
        },
        {
          label: '导出诊断包',
          click: () => {
            try {
              const file = createDiagnosticsPackage()
              dialog.showMessageBox({
                type: 'info',
                title: '诊断包已生成',
                message: file,
                detail: '把这份文件连同同目录下的 app-*.log 一起发给支持人员即可。'
              })
            } catch (err) {
              logger.error('生成诊断包失败', { message: String(err) })
            }
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
