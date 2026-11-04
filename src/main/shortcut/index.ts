import { globalShortcut } from 'electron'
import { logger } from '@main/log/logger'
import { getMainWindow } from '@main/window/manager'

/**
 * 全局快捷键（应用不在前台也生效）。只放真正需要系统级触发的组合，
 * 窗口内的快捷键交给菜单 role 与渲染层。
 */
export function registerGlobalShortcuts(): void {
  const ok = globalShortcut.register('CommandOrControl+Alt+M', () => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return
    if (win.isFocused() && !win.isMinimized()) win.minimize()
    else if (win.isMinimized()) win.restore()
    win.focus()
  })
  if (!ok) logger.warn('全局快捷键注册失败', { accelerator: 'CommandOrControl+Alt+M' })
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
