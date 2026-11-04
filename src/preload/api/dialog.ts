import type { OpenFileOptions, SaveFileOptions } from '@shared/ipc/types'
import { IPC } from '@shared/ipc/channels'
import { invoke } from '../ipc'

export const dialogApi = {
  openFile: (options?: OpenFileOptions) => invoke(IPC.Dialog.OpenFile, options),
  saveFile: (options?: SaveFileOptions) => invoke(IPC.Dialog.SaveFile, options)
}
