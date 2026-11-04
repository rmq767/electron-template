import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from '@main/window/main-window'

// 必须与 electron-builder.yml 的 appId 一致，否则 Windows 任务栏与通知归组会错乱。
const APP_USER_MODEL_ID = 'com.electron.template'

app.whenReady().then(() => {
  electronApp.setAppUserModelId(APP_USER_MODEL_ID)

  // F12 开 DevTools、生产环境忽略 Ctrl+R / F5，由 @electron-toolkit/utils 统一处理
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
