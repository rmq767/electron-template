/**
 * 跨进程的数据类型（DTO）。
 * 这里的东西会走结构化克隆：禁止放函数、class 实例、Vue ref、Pinia store 本体。
 * 也不得依赖 @types/node 或 electron 的类型，否则渲染进程项目无法编译。
 */

/** Electron `process.platform` 的取值，此处内联以免依赖 @types/node。 */
export type AppPlatform = 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32'

export interface AppInfo {
  name: string
  version: string
  /** 构建环境：dev 由 electron-vite 注入，prod 为 false。 */
  isDev: boolean
  platform: AppPlatform
  arch: string
  userDataPath: string
  versions: {
    electron: string
    node: string
    chrome: string
  }
}

export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  /** 渲染进程产生的日志，落盘时带上来源标记。 */
  scope: 'renderer' | 'main'
  message: string
  /** 附加上下文；只允许可 JSON 化的值。 */
  meta?: unknown
}

export interface FileDialogFilter {
  name: string
  extensions: string[]
}

export interface OpenFileOptions {
  title?: string
  defaultPath?: string
  filters?: FileDialogFilter[]
  multiple?: boolean
}

export interface SaveFileOptions {
  title?: string
  defaultPath?: string
  filters?: FileDialogFilter[]
}
