import { BrowserWindow, dialog } from 'electron'
import type { OpenDialogSyncOptions, SaveDialogSyncOptions } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { handle } from './handle'

/**
 * 特权对话框必须由主进程发起：它们是系统级 UI，不属于渲染进程的 DOM。
 * 返回 null 表示用户取消——这是可预期结果，不抛异常。
 */
export function registerDialogHandlers(): void {
  handle(
    IPC.Dialog.OpenFile,
    (options, ctx) => {
      const config: OpenDialogSyncOptions = {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters,
        properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile']
      }
      const parent = BrowserWindow.fromId(ctx.senderId)
      const picked = parent
        ? dialog.showOpenDialogSync(parent, config)
        : dialog.showOpenDialogSync(config)
      return picked ?? null
    },
    { interactive: true }
  )

  handle(
    IPC.Dialog.SaveFile,
    (options, ctx) => {
      const config: SaveDialogSyncOptions = {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters
      }
      const parent = BrowserWindow.fromId(ctx.senderId)
      const target = parent
        ? dialog.showSaveDialogSync(parent, config)
        : dialog.showSaveDialogSync(config)
      return target ?? null
    },
    { interactive: true }
  )
}
