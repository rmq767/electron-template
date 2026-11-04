import type { LogLevel } from '@shared/ipc/types'
import { IPC } from '@shared/ipc/channels'
import { invoke } from '../ipc'

function send(level: LogLevel, message: string, meta?: unknown): void {
  invoke(IPC.Log.Write, { level, scope: 'renderer', message, meta }).catch((err: unknown) => {
    // 日志通道本身故障不能反过来打断业务；本地留一份可见的痕迹
    console.error('[log] 上报主进程失败', level, message, err)
  })
}

export const logApi = {
  info: (message: string, meta?: unknown): void => send('info', message, meta),
  warn: (message: string, meta?: unknown): void => send('warn', message, meta),
  error: (message: string, meta?: unknown): void => send('error', message, meta)
}
