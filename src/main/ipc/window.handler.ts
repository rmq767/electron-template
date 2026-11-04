import { IPC } from '@shared/ipc/channels'
import { closeWindow, focusWindow, getPayload, openWindow, pushProps } from '@main/window/manager'
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
}
