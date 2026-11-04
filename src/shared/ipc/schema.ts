import type { AppInfo, LogEntry, OpenFileOptions, SaveFileOptions } from './types'
import type {
  OpenOutcome,
  OpenWindowOptions,
  WindowKind,
  WindowPayload,
  WindowResultMap
} from './window-spec'
import { IPC } from './channels'

/**
 * IPC 的接口定义文件。
 * `req` 为 undefined 表示该通道不需要入参。
 */
export interface RequestSchema {
  [IPC.App.GetInfo]: { req: undefined; res: AppInfo }
  [IPC.Window.Open]: { req: OpenWindowInput; res: OpenOutcome<unknown> }
  [IPC.Window.Close]: { req: { result?: unknown }; res: void }
  [IPC.Window.GetPayload]: { req: undefined; res: WindowPayload }
  [IPC.Window.PushProps]: { req: { windowId: string; props: unknown }; res: void }
  [IPC.Window.Focus]: { req: { windowId: string }; res: void }
  [IPC.Store.Get]: { req: { key: SettingsKey }; res: SettingsValue | undefined }
  [IPC.Store.Set]: { req: { key: SettingsKey; value: unknown }; res: void }
  [IPC.Dialog.OpenFile]: { req: OpenFileOptions | undefined; res: string[] | null }
  [IPC.Dialog.SaveFile]: { req: SaveFileOptions | undefined; res: string | null }
  [IPC.Log.Write]: { req: LogEntry; res: void }
}

/** 打开窗口的入参。props 的可接受形状由 Api.window.open 的泛型收敛。 */
export interface OpenWindowInput {
  kind: WindowKind
  props?: unknown
  options?: OpenWindowOptions
}

/** 需要返回值的调用通道；channel 写错会落到这个联合之外而报错。 */
export type InvokeChannel = keyof RequestSchema

/** 某通道的入参类型。 */
export type RequestPayload<C extends InvokeChannel> = RequestSchema[C]['req']

/** 某通道的返回值类型。 */
export type RequestResult<C extends InvokeChannel> = RequestSchema[C]['res']

/** 主进程主动推送的事件契约。 */
export interface EventSchema {
  [IPC.Evt.WindowProps]: { windowId: string; props: unknown }
}

export type EventChannel = keyof EventSchema
export type EventPayload<E extends EventChannel> = EventSchema[E]

/**
 * 持久化设置的键与取值。落在 userData/settings.json，由主进程读写，
 * 渲染进程只能通过 window.api.store 访问。
 */
export type SettingsKey = 'ui.theme' | 'ui.sidebarCollapsed'

export type SettingsValueOf<K extends SettingsKey> = K extends 'ui.theme'
  ? 'light' | 'dark'
  : boolean

export type SettingsValue = SettingsValueOf<SettingsKey>

/** 供 preload 侧把未知结果收敛回业务类型时使用。 */
export type ResultOfKind<K extends WindowKind> = OpenOutcome<WindowResultMap[K]>
