import { dialog } from 'electron'
import type { OpenDialogOptions, SaveDialogOptions } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { windowFromContentsId } from '@main/window/chrome'
import { handle } from './handle'

/**
 * 特权对话框必须由主进程发起：它们是系统级 UI，不属于渲染进程的 DOM。
 * 返回 null 表示用户取消——这是可预期结果，不抛异常。
 * 用异步版本，避免同步对话框阻塞主进程事件循环。
 */
export function registerDialogHandlers(): void {
  handle(
    IPC.Dialog.OpenFile,
    async (options, ctx) => {
      const config: OpenDialogOptions = {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters,
        properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile']
      }
      const parent = windowFromContentsId(ctx.senderId)
      const picked = parent
        ? await dialog.showOpenDialog(parent, config)
        : await dialog.showOpenDialog(config)
      return picked.canceled ? null : picked.filePaths
    },
    { interactive: true }
  )

  handle(
    IPC.Dialog.SaveFile,
    async (options, ctx) => {
      const config: SaveDialogOptions = {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters
      }
      const parent = windowFromContentsId(ctx.senderId)
      const saved = parent
        ? await dialog.showSaveDialog(parent, config)
        : await dialog.showSaveDialog(config)
      return saved.canceled || !saved.filePath ? null : saved.filePath
    },
    { interactive: true }
  )
}
