import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_ID, APP_NAME } from '@shared/constants/app'
import { closeAllWindows } from '@main/window/manager'
import { rebuildMainWindow, startApplication } from '@main/window/app-flow'
import { closeLoginWindow } from '@main/window/login-window'
import { closeSplashWindow } from '@main/window/splash-window'
import { registerIpc } from '@main/ipc'
import { buildApplicationMenu } from '@main/menu'
import { acquireSingleInstanceLock } from '@main/core/single-instance'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from '@main/shortcut'
import { installCrashHandlers } from '@main/log/crash'
import { logger, pruneLogs } from '@main/log/logger'

// 名称必须在 ready 前设置：userData 路径、菜单与 AppInfo 都跟着它走。
app.setName(APP_NAME)

// 拿不到锁说明已有实例在跑：此时不注册任何监听、不建任何窗口
if (acquireSingleInstanceLock()) {
  installCrashHandlers(rebuildMainWindow)

  app.whenReady().then(() => {
    // 与 .env 的 APP_ID 同源，Windows 任务栏与通知才能正确归组
    electronApp.setAppUserModelId(APP_ID)
    pruneLogs()
    logger.info('主进程就绪', { version: app.getVersion(), packaged: app.isPackaged })

    buildApplicationMenu()
    registerGlobalShortcuts()

    // F12 开 DevTools、生产环境忽略 Ctrl+R / F5，由 @electron-toolkit/utils 统一处理
    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

    registerIpc()
    startApplication()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) startApplication()
    })
  })

  app.on('before-quit', () => {
    unregisterGlobalShortcuts()
    closeSplashWindow()
    closeLoginWindow()
    closeAllWindows()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
