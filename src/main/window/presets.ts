import type { WindowKind } from '@shared/ipc/window-spec'

/**
 * 窗口目录：每种独立窗口的外观与行为。
 * 新增窗口 = 加一条 preset + 一条 /w/:kind 路由 + 一条 props/result 契约。
 * 不建 BaseWindow 继承树。
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
  /** 同名窗口只允许存在一个：再次打开时聚焦并推送新 props。 */
  singleton: boolean
  /** 子窗口不单独占任务栏条目，语义归主窗口。 */
  skipTaskbar: boolean
}

export const windowPresets: Record<WindowKind, WindowPreset> = {
  'user-form': {
    title: '用户表单',
    width: 720,
    height: 560,
    modal: false,
    resizable: true,
    singleton: false,
    skipTaskbar: true
  },
  'export-task': {
    title: '导出任务',
    width: 560,
    height: 420,
    modal: false,
    resizable: false,
    singleton: true,
    skipTaskbar: true
  }
}
