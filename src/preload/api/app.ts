import { IPC } from '@shared/ipc/channels'
import { invoke } from '../ipc'

export const appApi = {
  getInfo: () => invoke(IPC.App.GetInfo)
}
