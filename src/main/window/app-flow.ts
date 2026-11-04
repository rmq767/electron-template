import type { BrowserWindow } from 'electron'
import { APP_FEATURE_LOGIN, APP_SPLASH_MIN_MS } from '@shared/constants/app'
import { logger } from '@main/log/logger'
import { getSetting } from '@main/store/settings'
import { closeAllWindows, getMainWindow, setMainWindow } from './manager'
import { createMainWindow } from './main-window'
import { createLoginWindow, getLoginWindow } from './login-window'
import { closeSplashWindow, createSplashWindow } from './splash-window'

/** 主窗口迟迟没有首屏反馈时的兜底，避免启动页永久盖住桌面。 */
const SPLASH_MAX_MS = 8000

let splashActive = false
let splashShownAt = 0
let mainUiReady = false
let mainReadyToShow = false
let mainRevealPending = false
let splashMinTimer: ReturnType<typeof setTimeout> | null = null
let splashMaxTimer: ReturnType<typeof setTimeout> | null = null

function hasStoredSession(): boolean {
  const session = getSetting('auth.session')
  return typeof session === 'object' && session !== null && Boolean(session.token)
}

function clearSplashTimers(): void {
  if (splashMinTimer) clearTimeout(splashMinTimer)
  if (splashMaxTimer) clearTimeout(splashMaxTimer)
  splashMinTimer = null
  splashMaxTimer = null
}

function showMain(main: BrowserWindow): void {
  if (main.isDestroyed()) return
  if (main.isVisible()) {
    main.focus()
    return
  }
  logger.info('显示主窗口')
  main.show()
  main.focus()
}

/** 启动页退场后调用：主窗已 ready 就直接显示，否则等 ready-to-show。 */
function ensureMainVisible(): void {
  const main = getMainWindow()
  if (!main || main.isDestroyed()) return
  if (mainReadyToShow) {
    showMain(main)
    return
  }
  if (mainRevealPending) return
  mainRevealPending = true
  main.once('ready-to-show', () => {
    mainRevealPending = false
    showMain(main)
  })
}

/** 登录窗完成认证后调用：先关登录窗，再显示主窗，避免两个窗口同时可见。 */
function revealMainAfter(source: BrowserWindow): void {
  const main = getMainWindow()
  if (!main || main.isDestroyed()) {
    if (!source.isDestroyed()) source.close()
    return
  }
  const reveal = (): void => {
    if (!source.isDestroyed()) source.close()
    showMain(main)
  }
  if (mainReadyToShow) reveal()
  else main.once('ready-to-show', reveal)
}

function dismissSplash(): void {
  clearSplashTimers()
  splashActive = false
  closeSplashWindow()
  // splashWindow 可能已经被用户关掉（closed 不会再触发），这里兜底一次
  ensureMainVisible()
}

/** 主窗已挂载 + 启动页已展示 + 达到最短展示时间，三个条件齐了才退场。 */
function scheduleSplashClose(): void {
  if (!splashActive || !mainUiReady || splashShownAt === 0 || splashMinTimer) return
  const remaining = Math.max(0, APP_SPLASH_MIN_MS - (Date.now() - splashShownAt))
  splashMinTimer = setTimeout(dismissSplash, remaining)
}

function startWithSplash(): void {
  splashActive = true
  splashShownAt = 0
  mainUiReady = false
  mainReadyToShow = false
  mainRevealPending = false
  clearSplashTimers()

  const splash = createSplashWindow()

  splash.once('ready-to-show', () => {
    if (splash.isDestroyed()) return
    splashShownAt = Date.now()
    logger.info('启动页已展示，主窗口后台加载（保持隐藏）')
    // 主窗加载可以并行，但启动页退场前不 show，确保任意时刻只有一个窗口可见
    splashMaxTimer = setTimeout(dismissSplash, Math.max(SPLASH_MAX_MS, APP_SPLASH_MIN_MS + 2000))
    openMainWindow({ showWhenReady: false })
    scheduleSplashClose()
  })

  splash.on('closed', () => {
    splashActive = false
    clearSplashTimers()
    ensureMainVisible()
  })
}

export function openMainWindow(options: { showWhenReady?: boolean } = {}): BrowserWindow {
  const showWhenReady = options.showWhenReady ?? true
  const existing = getMainWindow()
  if (existing && !existing.isDestroyed()) {
    if (showWhenReady) showMain(existing)
    return existing
  }

  mainReadyToShow = false
  mainRevealPending = false
  logger.info('创建主窗口', { showWhenReady })
  const main = createMainWindow()
  setMainWindow(main)

  main.once('ready-to-show', () => {
    mainReadyToShow = true
    logger.info('主窗口首屏就绪', { visible: main.isVisible(), showWhenReady })
    if (showWhenReady) showMain(main)
  })

  main.on('closed', () => {
    logger.info('主窗口已关闭')
    mainReadyToShow = false
    mainRevealPending = false
    if (getMainWindow() === main) setMainWindow(null)
    // 主窗口关掉时先把独立窗口收干净，避免残留进程与悬挂的调用方
    closeAllWindows()
  })
  return main
}

/**
 * 启动决策：
 * - 需要登录 → 登录窗本身就是启动面
 * - 不需要登录 / 已有会话 → 启动页等待主窗口首屏完成
 */
export function startApplication(): void {
  if (APP_FEATURE_LOGIN && !hasStoredSession()) {
    createLoginWindow()
    return
  }
  startWithSplash()
}

/**
 * 主窗口渲染进程崩溃后重建。
 * 必须先建新窗再销毁旧窗：中间一旦出现「零窗口」，window-all-closed 会直接把应用退掉。
 */
export function rebuildMainWindow(): void {
  const previous = getMainWindow()
  if (previous && !previous.isDestroyed()) {
    setMainWindow(null)
    openMainWindow({ showWhenReady: false })
    previous.destroy()
  } else {
    openMainWindow({ showWhenReady: false })
  }
  dismissSplash()
}

/** 主窗口渲染层完成挂载：启动页等待的最后一个条件。 */
export function markMainWindowUiReady(contentsId: number): void {
  const main = getMainWindow()
  if (!main || main.isDestroyed() || main.webContents.id !== contentsId) return
  mainUiReady = true
  scheduleSplashClose()
}

/** 登录窗口完成认证：先把主窗口准备好（隐藏），再关登录窗并显示主窗。 */
export function completeLoginFrom(contentsId: number): void {
  const login = getLoginWindow()
  if (!login || login.isDestroyed() || login.webContents.id !== contentsId) {
    throw new Error('[app] 只有登录窗口可以完成登录')
  }

  openMainWindow({ showWhenReady: false })
  logger.info('登录完成，等待主窗口就绪后切换', { contentsId })
  revealMainAfter(login)
}

/** 主窗口退出登录：先等在后台创建登录窗，再销毁主窗口并显示登录窗。 */
export function returnToLogin(source: BrowserWindow): void {
  const login = createLoginWindow({ showWhenReady: false })
  const reveal = (): void => {
    if (!source.isDestroyed()) source.destroy()
    if (!login.isDestroyed()) {
      login.show()
      login.focus()
    }
  }
  if (login.isVisible()) reveal()
  else login.once('ready-to-show', reveal)
}
