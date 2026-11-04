import { app, BrowserWindow } from 'electron'
import { logger } from '@main/log/logger'

/**
 * 单实例锁。二次启动时聚焦已有主窗口，而不是开第二个应用。
 *
 * dev 下必须跳过：实测确认多实例共用同一 userData 会让 Chromium 抢缓存目录，
 * 报 "Unable to move the cache: 拒绝访问"，而开发期本来就需要随时起重启。
 */
export function acquireSingleInstanceLock(): boolean {
  if (!app.isPackaged) {
    logger.warn('开发环境跳过单实例锁（多开可调试，但请注意 userData 争用）')
    return true
  }
  const acquired = app.requestSingleInstanceLock()
  if (!acquired) {
    logger.info('已有实例在运行，本次启动退出')
    app.quit()
    return false
  }
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows().find((item) => !item.isDestroyed())
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })
  return true
}
