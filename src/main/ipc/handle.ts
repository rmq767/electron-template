import { BrowserWindow, ipcMain } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { logger } from '@main/log/logger'
import type { InvokeChannel, RequestPayload, RequestResult } from '@shared/ipc/schema'

export interface HandlerContext {
  senderId: number
}

export type IpcHandler<C extends InvokeChannel> = (
  payload: RequestPayload<C>,
  ctx: HandlerContext
) => RequestResult<C> | Promise<RequestResult<C>>

const SLOW_MS = 800

export interface HandleOptions {
  /**
   * 交互型通道（系统文件对话框等）会阻塞到用户操作完成，耗时天然不可控。
   * 标上它就不再做慢调用告警，否则日志里全是无效噪音，反而教人忽略告警。
   */
  interactive?: boolean
}

/**
 * 统一注册 invoke 型通道：来源校验、慢调用告警、异常落日志都在这一处，
 * 业务 handler 只写业务。
 *
 * 失败口径：可预期的业务结果（如用户取消文件对话框）作为返回值给出；
 * 真正的异常一律 throw，由调用侧的 Promise reject 承载。
 */
export function handle<C extends InvokeChannel>(
  channel: C,
  handler: IpcHandler<C>,
  options: HandleOptions = {}
): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, payload: RequestPayload<C>) => {
    const sender = event.sender
    const trusted = !sender.isDestroyed() && BrowserWindow.fromWebContents(sender) !== null
    if (!trusted) {
      logger.warn(`拒绝未知来源的 IPC 调用：${channel}`)
      throw new Error(`[ipc] E_UNKNOWN_SENDER: ${channel}`)
    }

    const startedAt = Date.now()
    try {
      const result = await handler(payload, { senderId: sender.id })
      if (!options.interactive) {
        const cost = Date.now() - startedAt
        if (cost > SLOW_MS) logger.warn(`IPC ${channel} 耗时 ${cost}ms`)
      }
      return result
    } catch (err) {
      logger.error(`IPC ${channel} 处理失败`, {
        message: err instanceof Error ? err.message : String(err)
      })
      throw err
    }
  })
}
