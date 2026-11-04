import { join } from 'path'
import { BrowserWindow } from 'electron'
import { APP_NAME } from '@shared/constants/app'
import { rendererEntry } from './entry'
import { attachWindowChrome } from './chrome'
import { resolveAppIcon } from './app-icon'

/**
 * 主窗口。无系统边框，标题栏由渲染层绘制（与登录窗、独立窗口保持同一套桌面外观）。
 * 独立弹窗在 window/manager.ts 统一管理；本文件只负责主窗口本身。
 */
export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    center: true,
    frame: false,
    roundedCorners: true,
    // 先建后显：配合 backgroundColor 消掉首帧白闪
    show: false,
    backgroundColor: '#f4f5f7',
    title: APP_NAME,
    icon: resolveAppIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 官方 electron-vite 模板即为 sandbox: false —— 沙箱化的 preload 无法加载打包后的模块。
      // 下面两项是安全基线，任何情况下都不要关。
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  attachWindowChrome(mainWindow)

  // 何时 show 由 app-flow 决定：登录/启动页退场前，主窗口只加载不显示。
  void mainWindow.loadURL(rendererEntry('/home'))

  return mainWindow
}
