import { IPC } from '@shared/ipc/channels'
import { logger } from '@main/log/logger'
import { handle } from './handle'

export function registerLogHandlers(): void {
  handle(IPC.Log.Write, (entry) => {
    logger.fromRenderer(entry)
  })
}
