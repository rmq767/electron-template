import type { AppInfo, OpenFileOptions, SaveFileOptions } from '@shared/ipc/types'
import type { SettingsKey, SettingsValueOf } from '@shared/ipc/schema'
import type {
  OpenOutcome,
  OpenWindowOptions,
  WindowKind,
  WindowPayload,
  WindowPropsMap,
  WindowResultMap,
  WindowSelf
} from '@shared/ipc/window-spec'

/**
 * 暴露给渲染进程的宿主能力，按业务形状组织（而不是按 channel 组织）。
 * 这里只允许类型，不得 import electron —— 否则渲染进程项目会连带编译 Node 侧代码。
 */
export interface Api {
  app: {
    getInfo(): Promise<AppInfo>
  }
  /**
   * 读写 userData/settings.json。
   * 键与取值类型由 SettingsKey / SettingsValueOf 约束，写错键名编译期即失败。
   */
  store: {
    get<K extends SettingsKey>(key: K): Promise<SettingsValueOf<K> | undefined>
    set<K extends SettingsKey>(key: K, value: SettingsValueOf<K>): Promise<void>
  }
  dialog: {
    /** 用户取消返回 null。 */
    openFile(options?: OpenFileOptions): Promise<string[] | null>
    /** 用户取消返回 null。 */
    saveFile(options?: SaveFileOptions): Promise<string | null>
  }
  /** 发出即返回；落盘失败只在本地 console 提示，不反向打断业务。 */
  log: {
    info(message: string, meta?: unknown): void
    warn(message: string, meta?: unknown): void
    error(message: string, meta?: unknown): void
  }
  /**
   * 独立窗口。用法与 dialog 一致：带参数开、拿返回值。
   * self 非 null 说明当前页面正运行在独立窗口里。
   */
  window: {
    readonly self: WindowSelf | null
    open<K extends WindowKind>(
      kind: K,
      props?: WindowPropsMap[K],
      options?: OpenWindowOptions
    ): Promise<OpenOutcome<WindowResultMap[K]>>
    close(result?: unknown): Promise<void>
    getPayload<K extends WindowKind>(): Promise<WindowPayload<K>>
    /** 返回解绑函数，组件卸载必须调用，否则监听器跨窗口残留。 */
    pushProps<K extends WindowKind>(callback: (props: WindowPropsMap[K]) => void): () => void
    focus(windowId: string): Promise<void>
  }
}
