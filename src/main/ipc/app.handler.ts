import { app } from 'electron'
import { IPC } from '@shared/ipc/channels'
import type { AppPlatform } from '@shared/ipc/types'
import { createDiagnosticsPackage } from '@main/log/diagnostics'
import { getMainWindow } from '@main/window/manager'
import { completeLoginFrom, markMainWindowUiReady, returnToLogin } from '@main/window/app-flow'
import { windowFromContentsId } from '@main/window/chrome'
import { handle } from './handle'

export function registerAppHandlers(): void {
  handle(IPC.App.GetInfo, () => ({
    name: app.getName(),
    version: app.getVersion(),
    isDev: !app.isPackaged,
    platform: process.platform as AppPlatform,
    arch: process.arch,
    userDataPath: app.getPath('userData'),
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    }
  }))

  handle(IPC.App.ExportDiagnostics, () => createDiagnosticsPackage())

  handle(IPC.App.CompleteLogin, (_payload, ctx) => {
    completeLoginFrom(ctx.senderId)
  })

  handle(IPC.App.ShowLogin, (_payload, ctx) => {
    const win = windowFromContentsId(ctx.senderId)
    if (!win || win !== getMainWindow()) {
      throw new Error('[app] 只有主窗口可以退出登录')
    }
    returnToLogin(win)
  })

  // 登录窗/业务窗也会执行同一个 bootstrap，非主窗口的通知直接忽略
  handle(IPC.App.UiReady, (_payload, ctx) => {
    markMainWindowUiReady(ctx.senderId)
  })
}
