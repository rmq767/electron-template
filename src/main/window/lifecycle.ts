import { app, type BrowserWindow } from 'electron'
import { logger } from '@main/log/logger'
import * as registry from './registry'

/**
 * 所有渲染进程（Electron 在指标里叫 Tab）的内存占用合计，单位 MB。
 * 用它衡量「多开一个窗口值不值 30MB」这类判断。
 */
function rendererMemoryMb(): number {
  const kb = app
    .getAppMetrics()
    .filter((item) => item.type === 'Tab')
    .reduce((sum, item) => sum + item.memory.workingSetSize, 0)
  return Math.round((kb / 1024) * 100) / 100
}

/**
 * 独立窗口的异常路径与实测埋点。
 * 崩溃只影响它自己 —— 这是决策表里触发条件 5 的唯一硬收益。
 * did-finish-load 的耗时与内存增量用来替换决策表里「待实测」的估计数字。
 */
export function attachWindowLifecycle(
  win: BrowserWindow,
  windowId: string,
  createdAt: number
): void {
  const baseline = rendererMemoryMb()

  win.webContents.on('did-finish-load', () => {
    logger.info(`窗口 ${windowId} 首屏完成`, {
      elapsedMs: Date.now() - createdAt,
      rendererCount: app.getAppMetrics().filter((item) => item.type === 'Tab').length,
      footprintDeltaMb: Math.round((rendererMemoryMb() - baseline) * 100) / 100
    })
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    logger.error(`窗口 ${windowId} 渲染进程消失`, {
      reason: details.reason,
      exitCode: details.exitCode
    })
    registry.settle(windowId, { ok: false, reason: 'crashed', message: details.reason })
  })

  win.webContents.on('unresponsive', () => {
    logger.warn(`窗口 ${windowId} 无响应`)
  })

  // 窗口页不允许跳出自身文档（外链走 shell.openExternal）
  win.webContents.on('will-navigate', (event, url) => {
    const own = win.webContents.getURL().split('#')[0]
    if (!url.startsWith(own)) {
      event.preventDefault()
      logger.warn(`拦截窗口 ${windowId} 的跳转`, { url })
    }
  })

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}
