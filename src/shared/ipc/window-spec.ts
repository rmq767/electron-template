import type { UserDTO } from '../types/user'

/**
 * 独立窗口的类型契约。新增一种窗口只需三步：
 * 1) 这里加一条 kind 与 props/result；
 * 2) main/window/presets.ts 加一条外观；
 * 3) renderer/src/windows 加一个页面并在路由挂 /w/:kind。
 * 业务逻辑不用重写——表单主体本就不感知容器。
 */
export type WindowKind = 'user-form' | 'export-task'

/** 独立窗口面：登录窗与启动页不在 manager 的注册表里，但同样需要身份判断。 */
export type WindowSurface = WindowKind | 'login' | 'splash'

export interface ExportTaskProps {
  /** 需要导出的行标识；只传 DTO，不要传表格实例 */
  ids: number[]
}

export interface ExportTaskResult {
  savedPath: string
  rows: number
}

export interface WindowPropsMap {
  'user-form': UserDTO | undefined
  'export-task': ExportTaskProps
}

export type WindowResultMap = {
  'user-form': UserDTO
  'export-task': ExportTaskResult
}

export interface WindowSelf {
  windowId: string
  kind: WindowSurface
}

/** 自定义标题栏要跟随窗口最大化状态切换图标。 */
export interface WindowChromeState {
  maximized: boolean
}

export interface WindowPayload<K extends WindowKind = WindowKind> {
  windowId: string
  kind: K
  props: WindowPropsMap[K]
}

/** 关闭原因：调用方拿到 ok:false 时用它区分「用户取消」与「真出错」。 */
export type WindowCloseReason = 'cancelled' | 'closed-by-parent' | 'crashed'

export type OpenOutcome<T = unknown> =
  { ok: true; data: T } | { ok: false; reason: WindowCloseReason; message?: string }

export interface OpenWindowOptions {
  /** 覆盖 preset 里的标题 */
  title?: string
  /** 覆盖 preset 里的宽高 */
  width?: number
  height?: number
}
