import { IPC } from '@shared/ipc/channels'
import type { LogEntry, LogLevel } from '@shared/ipc/types'
import { logger } from '@main/log/logger'
import { handle } from './handle'

const MAX_MESSAGE_LENGTH = 4000
const LEVELS: readonly LogLevel[] = ['info', 'warn', 'error']

/** 渲染层日志是跨进程输入：校验 level、截断 message，避免脏数据/超大行写坏日志。 */
function sanitize(entry: LogEntry): LogEntry {
  const level = entry?.level
  if (!LEVELS.includes(level)) throw new Error('[log] 非法 level')
  const message = typeof entry.message === 'string' ? entry.message : String(entry.message ?? '')
  return {
    level,
    scope: 'renderer',
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    meta: entry.meta
  }
}

export function registerLogHandlers(): void {
  handle(IPC.Log.Write, (entry) => {
    logger.fromRenderer(sanitize(entry))
  })
}
