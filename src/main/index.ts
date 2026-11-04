import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { closeAllWindows, setMainWindow } from '@main/window/manager'
import { createMainWindow } from '@main/window/main-window'
import { registerIpc } from '@main/ipc'
import { buildApplicationMenu } from '@main/menu'
import { acquireSingleInstanceLock } from '@main/core/single-instance'
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from '@main/shortcut'
import { installCrashHandlers } from '@main/log/crash'
import { logger, pruneLogs } from '@main/log/logger'

// 必须与 electron-builder.yml 的 appId 一致，否则 Windows 任务栏与通知归组会错乱。
const APP_USER_MODEL_ID = 'com.electron.template'

function openMainWindow(): void {
  const main = createMainWindow()
  setMainWindow(main)
  // 主窗口关掉时先把独立窗口收干净，避免残留进程与悬挂的调用方
  main.on('closed', () => closeAllWindows())
}

// 拿不到锁说明已有实例在跑：此时不注册任何监听、不建任何窗口
if (acquireSingleInstanceLock()) {
  installCrashHandlers(openMainWindow)

  app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_USER_MODEL_ID)
    pruneLogs()
    logger.info('主进程就绪', { version: app.getVersion(), packaged: app.isPackaged })

    buildApplicationMenu()
    registerGlobalShortcuts()

    // F12 开 DevTools、生产环境忽略 Ctrl+R / F5，由 @electron-toolkit/utils 统一处理
    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

    registerIpc()
    openMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) openMainWindow()
    })
  })

  app.on('before-quit', () => {
    unregisterGlobalShortcuts()
    closeAllWindows()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
