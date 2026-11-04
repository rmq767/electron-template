import type { AppInfo, LogEntry, OpenFileOptions, SaveFileOptions } from './types'
import { IPC } from './channels'

/**
 * IPC 的接口定义文件。
 * `req` 为 undefined 表示该通道不需要入参。
 */
export interface RequestSchema {
  [IPC.App.GetInfo]: { req: undefined; res: AppInfo }
  [IPC.Store.Get]: { req: { key: SettingsKey }; res: SettingsValue | undefined }
  [IPC.Store.Set]: { req: { key: SettingsKey; value: unknown }; res: void }
  [IPC.Dialog.OpenFile]: { req: OpenFileOptions | undefined; res: string[] | null }
  [IPC.Dialog.SaveFile]: { req: SaveFileOptions | undefined; res: string | null }
  [IPC.Log.Write]: { req: LogEntry; res: void }
}

/** 需要返回值的调用通道；channel 写错会直接落到这个联合之外而报错。 */
export type InvokeChannel = keyof RequestSchema

/** 某通道的入参类型。 */
export type RequestPayload<C extends InvokeChannel> = RequestSchema[C]['req']

/** 某通道的返回值类型。 */
export type RequestResult<C extends InvokeChannel> = RequestSchema[C]['res']

/**
 * 持久化设置的键与取值。落在 userData/settings.json，由主进程读写，
 * 渲染进程只能通过 window.api.store 访问。
 */
export type SettingsKey = 'ui.theme' | 'ui.sidebarCollapsed' | 'ui.tabPaths'

export type SettingsValueOf<K extends SettingsKey> = K extends 'ui.theme'
  ? 'light' | 'dark'
  : K extends 'ui.sidebarCollapsed'
    ? boolean
    : string[]

export type SettingsValue = SettingsValueOf<SettingsKey>
