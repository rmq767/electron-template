import { join } from 'path'
import { BrowserWindow } from 'electron'
import { APP_NAME } from '@shared/constants/app'
import { logger } from '@main/log/logger'
import { rendererEntry } from './entry'
import { attachWindowChrome } from './chrome'
import { resolveAppIcon } from './app-icon'

let loginWindow: BrowserWindow | null = null

export function getLoginWindow(): BrowserWindow | null {
  return loginWindow
}

/**
 * 登录窗独立于主窗口存在：小尺寸、无系统边框，登录成功后由主进程关掉它并展示主窗口。
 * 它不进入 window/registry —— registry 的语义是「带参数进、带结果出的业务弹层」。
 */
export function createLoginWindow(options: { showWhenReady?: boolean } = {}): BrowserWindow {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus()
    return loginWindow
  }

  const showWhenReady = options.showWhenReady ?? true

  const win = new BrowserWindow({
    width: 400,
    height: 560,
    center: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    // 与登录页底色一致，消掉首帧白闪
    backgroundColor: '#f2f0ea',
    title: APP_NAME,
    icon: resolveAppIcon(),
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--window-id=login', '--window-kind=login']
    }
  })

  loginWindow = win
  logger.info('创建登录窗口')
  attachWindowChrome(win)

  if (showWhenReady) win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    if (loginWindow === win) loginWindow = null
  })
  void win.loadURL(rendererEntry('/login'))
  return win
}

export function closeLoginWindow(): void {
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close()
  loginWindow = null
}
