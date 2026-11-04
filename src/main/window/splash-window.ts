import { join } from 'path'
import { BrowserWindow } from 'electron'
import { APP_NAME } from '@shared/constants/app'
import { logger } from '@main/log/logger'
import { rendererEntry } from './entry'
import { attachWindowChrome } from './chrome'
import { resolveAppIcon } from './app-icon'

let splashWindow: BrowserWindow | null = null

/**
 * 启动页：只在「不需要登录」的路径出现，等主窗口渲染完成（app:ui-ready）后退场。
 * 它是启动等待面，不是业务窗口，不进入 window/registry。
 */
export function createSplashWindow(): BrowserWindow {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.focus()
    return splashWindow
  }

  const win = new BrowserWindow({
    width: 400,
    height: 460,
    center: true,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    // 与登录页/启动页底色一致，消掉首帧白闪
    backgroundColor: '#f2f0ea',
    title: APP_NAME,
    icon: resolveAppIcon(),
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--window-id=splash', '--window-kind=splash']
    }
  })

  splashWindow = win
  logger.info('创建启动页')
  attachWindowChrome(win)

  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    if (splashWindow === win) splashWindow = null
  })
  void win.loadURL(rendererEntry('/splash'))
  return win
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close()
  splashWindow = null
}
