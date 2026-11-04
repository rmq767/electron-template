import { IPC } from '@shared/ipc/channels'
import { invoke } from '../ipc'

export const appApi = {
  getInfo: () => invoke(IPC.App.GetInfo),
  /** 生成诊断包并返回文件路径，由用户自行取用（不做云端上报）。 */
  exportDiagnostics: () => invoke(IPC.App.ExportDiagnostics),
  completeLogin: () => invoke(IPC.App.CompleteLogin),
  showLogin: () => invoke(IPC.App.ShowLogin),
  uiReady: () => invoke(IPC.App.UiReady)
}
