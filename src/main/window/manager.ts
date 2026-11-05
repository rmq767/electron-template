import { join } from 'path'
import { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc/channels'
import type {
  OpenOutcome,
  OpenWindowOptions,
  WindowKind,
  WindowPayload
} from '@shared/ipc/window-spec'
import { logger } from '@main/log/logger'
import { windowPresets, type WindowPreset } from './presets'
import { attachWindowLifecycle } from './lifecycle'
import { attachWindowChrome } from './chrome'
import { resolveAppIcon } from './app-icon'
import { rendererEntry } from './entry'
import * as registry from './registry'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function entryHref(kind: WindowKind, windowId: string): string {
  return rendererEntry(`/w/${kind}?windowId=${encodeURIComponent(windowId)}`)
}

export function openWindow(
  kind: WindowKind,
  props?: unknown,
  options?: OpenWindowOptions,
  openerContentsId?: number
): Promise<OpenOutcome<unknown>> {
  // 空窗口目录时 WindowKind 为 never；按字符串查表并收敛成可选类型，
  // 新增窗口后这一段不用再改。
  const preset = (windowPresets as Partial<Record<string, WindowPreset>>)[String(kind)]
  if (!preset) throw new Error(`[window] 未知窗口类型：${String(kind)}`)

  // 当前模板只允许一个业务独立窗口：
  // 同 kind 聚焦并推送新参数；不同 kind 直接拒绝，避免多窗口状态与焦点成本。
  const active = registry.findActive()
  if (active) {
    active.win.focus()
    if (active.kind === kind) {
      pushProps(active.windowId, props)
      logger.info(`复用独立窗口 ${active.windowId}`)
      return new Promise((resolve) => registry.enqueueSetter(active.windowId, resolve))
    }
    logger.info(`已有独立窗口 ${active.windowId}，拒绝打开 ${kind}`)
    return Promise.resolve({
      ok: false,
      reason: 'busy',
      message: `已有独立窗口打开：${active.kind}`
    })
  }

  const windowId = registry.createWindowId(kind)
  const win = new BrowserWindow({
    width: options?.width ?? preset.width,
    height: options?.height ?? preset.height,
    title: options?.title ?? preset.title,
    show: false,
    frame: false,
    roundedCorners: true,
    backgroundColor: '#f4f5f7',
    icon: resolveAppIcon(),
    // 模态必须同时给 parent 与 modal，二者缺一不可
    parent: preset.modal ? (mainWindow ?? undefined) : undefined,
    modal: preset.modal,
    resizable: preset.resizable,
    minimizable: false,
    maximizable: preset.resizable,
    skipTaskbar: preset.skipTaskbar,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // 身份走 argv（同步可得），业务数据一律走 registry + GetPayload，不进 URL
      additionalArguments: [`--window-id=${windowId}`, `--window-kind=${kind}`]
    }
  })

  attachWindowChrome(win)

  registry.add({
    windowId,
    kind,
    win,
    contentsId: win.webContents.id,
    props,
    pending: [],
    createdAt: Date.now()
  })

  logger.info(`打开独立窗口 ${windowId}`, { kind, opener: openerContentsId })

  return new Promise((resolve) => {
    registry.enqueueSetter(windowId, resolve)

    win.once('ready-to-show', () => win.show())

    // 无条件兜底：点 X、父窗口关闭、崩溃都要让调用方的 await 有返回值，
    // 否则 Promise 永久悬挂，这是多窗口体系最常见的 bug。
    win.on('closed', () => {
      registry.settle(windowId, { ok: false, reason: 'cancelled' })
      registry.remove(windowId)
    })

    attachWindowLifecycle(win, windowId, Date.now())
    void win.loadURL(entryHref(kind, windowId))
  })
}

export function closeWindow(contentsId: number, result?: unknown): void {
  const entry = registry.findByContents(contentsId)
  if (!entry) throw new Error(`[window] 未知窗口来源：${contentsId}`)
  registry.settle(
    entry.windowId,
    result === undefined ? { ok: false, reason: 'cancelled' } : { ok: true, data: result }
  )
  if (!entry.win.isDestroyed()) entry.win.close()
}

export function getPayload(contentsId: number): WindowPayload {
  const entry = registry.findByContents(contentsId)
  if (!entry) throw new Error(`[window] 未知窗口来源：${contentsId}`)
  // registry 存的是 unknown（结构化克隆的原样数据），这里按登记时的 kind 收敛回去
  return {
    windowId: entry.windowId,
    kind: entry.kind,
    props: entry.props as WindowPayload['props']
  }
}

/** 向窗口页推送新的 props（单例复用时用），窗口页通过 pushProps 订阅接收。 */
export function pushProps(windowId: string, props: unknown): void {
  const entry = registry.get(windowId)
  if (!entry || entry.win.isDestroyed()) return
  entry.props = props
  entry.win.webContents.send(IPC.Evt.WindowProps, { windowId, props })
}

export function focusWindow(windowId: string): void {
  const entry = registry.get(windowId)
  if (!entry || entry.win.isDestroyed()) return
  if (entry.win.isMinimized()) entry.win.restore()
  entry.win.focus()
}

/** 主窗口关闭或应用退出前调用，避免残留进程与悬挂的调用方。 */
export function closeAllWindows(): void {
  for (const entry of registry.list()) {
    registry.settle(entry.windowId, { ok: false, reason: 'closed-by-parent' })
    registry.remove(entry.windowId)
    if (!entry.win.isDestroyed()) entry.win.destroy()
  }
}
