import { BrowserWindow, shell, webContents } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { logger } from '@main/log/logger'

/**
 * 所有窗口共用的安全边界：
 * 应用内不新开浏览器窗口，外链交给系统浏览器；页面不得跳出自身文档。
 */
function attachNavigationPolicy(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const own = win.webContents.getURL().split('#')[0]
    if (!url.startsWith(own)) {
      event.preventDefault()
      logger.warn('拦截页面跳转', { url })
    }
  })
}

/** 自定义标题栏：把最大/还原状态推给渲染进程，图标与拖拽区才有反馈。 */
export function attachWindowChrome(win: BrowserWindow): void {
  const push = (): void => {
    if (win.isDestroyed()) return
    win.webContents.send(IPC.Evt.WindowState, { maximized: win.isMaximized() })
  }
  win.on('maximize', push)
  win.on('unmaximize', push)
  attachNavigationPolicy(win)
}

/** IPC 只能操作发起调用的那个窗口，渲染进程无法冒充别的窗口关窗/最大化。 */
export function windowFromContentsId(contentsId: number): BrowserWindow | null {
  const contents = webContents.fromId(contentsId)
  return contents ? BrowserWindow.fromWebContents(contents) : null
}
