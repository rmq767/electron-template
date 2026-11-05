import type { WindowKind } from '@shared/ipc/window-spec'

/**
 * 窗口目录：每种独立窗口的外观与行为。
 * 模板默认不内置业务窗口，地基保留；新增窗口 = 加一条 preset + 一条 /w/:kind 路由
 * + 一条 props/result 契约。不建 BaseWindow 继承树。
 */
export interface WindowPreset {
  title: string
  width: number
  height: number
  /**
   * 模态需要 parent 与 modal 同时设置；且 Windows 上子窗口不会跟随父窗口移动
   * （官方文档只在 macOS 提供该行为）。所以「强模态短交互」应走 dialog 而不是这里。
   */
  modal: boolean
  resizable: boolean
  /** 子窗口不单独占任务栏条目，语义归主窗口。 */
  skipTaskbar: boolean
}

export const windowPresets: Record<WindowKind, WindowPreset> = {}
