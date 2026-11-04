import { join } from 'path'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { APP_NAME } from '@shared/constants/app'
import icon from '../../../resources/icon.png?asset'

/**
 * 主窗口。独立弹窗（window 体系）在 Step 6 由 window/manager.ts 统一管理，
 * 那里是新建 BrowserWindow 的唯一入口；本文件只负责主窗口本身。
 */
export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    // 先建后显：配合 backgroundColor 消掉首帧白闪，不需要额外的 splash 窗口
    show: false,
    backgroundColor: '#f4f5f7',
    title: is.dev ? `${APP_NAME} [DEV]` : APP_NAME,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 官方 electron-vite 模板即为 sandbox: false —— 沙箱化的 preload 无法加载打包后的模块。
      // 下面两项是安全基线，任何情况下都不要关。
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 应用内不新开浏览器窗口；需要新窗口时走 window/manager。只放行 http(s) 给系统浏览器。
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
