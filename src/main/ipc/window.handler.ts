import { IPC } from '@shared/ipc/channels'
import { closeWindow, focusWindow, getPayload, openWindow, pushProps } from '@main/window/manager'
import { windowFromContentsId } from '@main/window/chrome'
import { handle } from './handle'

export function registerWindowHandlers(): void {
  // open 的 Promise 要到窗口关闭才兑现，耗时天然不可控，标 interactive
  handle(
    IPC.Window.Open,
    ({ kind, props, options }, ctx) => openWindow(kind, props, options, ctx.senderId),
    { interactive: true }
  )

  // 关闭「自己」：用 senderId 反查窗口，渲染进程冒充不了别的窗口
  handle(IPC.Window.Close, ({ result }, ctx) => {
    closeWindow(ctx.senderId, result)
  })

  handle(IPC.Window.GetPayload, (_payload, ctx) => getPayload(ctx.senderId))

  handle(IPC.Window.PushProps, ({ windowId, props }) => {
    pushProps(windowId, props)
  })

  handle(IPC.Window.Focus, ({ windowId }) => {
    focusWindow(windowId)
  })

  // 标题栏控件只作用于发起调用的窗口；主窗口、登录窗、独立窗口共用
  handle(IPC.Window.Minimize, (_payload, ctx) => {
    windowFromContentsId(ctx.senderId)?.minimize()
  })

  handle(IPC.Window.ToggleMaximize, (_payload, ctx) => {
    const win = windowFromContentsId(ctx.senderId)
    if (!win) return false
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
    return win.isMaximized()
  })

  handle(IPC.Window.GetState, (_payload, ctx) => {
    const win = windowFromContentsId(ctx.senderId)
    return { maximized: win?.isMaximized() ?? false }
  })

  handle(IPC.Window.CloseSelf, (_payload, ctx) => {
    const win = windowFromContentsId(ctx.senderId)
    if (!win) throw new Error(`[window] 未找到来源窗口：${ctx.senderId}`)
    win.close()
  })
}
