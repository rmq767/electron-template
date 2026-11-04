import { app, dialog } from 'electron'
import { logger } from './logger'
import { getMainWindow } from '@main/window/manager'

/**
 * 主进程异常与渲染进程崩溃。
 * 主窗口崩溃时重建主窗口；独立窗口崩溃由 registry 的 settle 给调用方返回 crashed，
 * 不在这里重建，也不做全局重启。
 */
let dialogShown = false

function notifyOnce(message: string): void {
  if (dialogShown) return
  dialogShown = true
  dialog.showMessageBox({ type: 'error', title: '运行异常', message, buttons: ['知道了'] })
}

export function installCrashHandlers(rebuildMainWindow: () => void): void {
  process.on('uncaughtException', (err) => {
    logger.error('主进程未捕获异常', { message: err.message, stack: err.stack })
    notifyOnce('应用遇到未预期的错误，已记录到日志。若反复出现请导出诊断包。')
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝', {
      reason: reason instanceof Error ? reason.message : String(reason)
    })
  })

  app.on('web-contents-created', (_event, contents) => {
    contents.on('render-process-gone', (_goneEvent, details) => {
      const wasMain = getMainWindow()?.webContents === contents
      logger.error('渲染进程消失', {
        reason: details.reason,
        exitCode: details.exitCode,
        wasMain
      })
      if (wasMain) rebuildMainWindow()
    })
  })
}
