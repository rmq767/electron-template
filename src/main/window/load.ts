import { dialog, type BrowserWindow } from 'electron'
import { logger } from '@main/log/logger'

/**
 * 统一加载渲染入口：加载失败必须留下日志并给出可见结果。
 * 没有兜底时，show:false 的窗口会永远隐藏、调用方的 Promise 也会永久悬挂。
 */
export function loadRenderer(
  win: BrowserWindow,
  url: string,
  label: string,
  onFail?: (detail: string) => void
): void {
  let failed = false

  const fail = (detail: string): void => {
    if (failed || win.isDestroyed()) return
    failed = true
    logger.error(`窗口加载失败：${label}`, { url, detail })
    if (onFail) {
      onFail(detail)
      return
    }
    dialog.showErrorBox(`${label}加载失败`, `${detail}\n\n${url}`)
    if (!win.isDestroyed()) win.destroy()
  }

  win.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // -3 = ERR_ABORTED：页面被主动取消（例如窗口关闭），不是真失败
      if (!isMainFrame || errorCode === -3) return
      fail(`${errorCode} ${errorDescription} ${validatedURL}`)
    }
  )

  void win.loadURL(url).catch((err: unknown) => {
    // 关闭窗口/取消导航也会 reject，不能当成加载失败弹窗
    const code =
      err && typeof err === 'object' && 'code' in err ? (err as { code?: unknown }).code : undefined
    if (code === 'ERR_ABORTED' || code === -3) return
    fail(err instanceof Error ? err.message : String(err))
  })
}
