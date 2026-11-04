import { app } from 'electron'
import { IPC } from '@shared/ipc/channels'
import type { AppPlatform } from '@shared/ipc/types'
import { handle } from './handle'

export function registerAppHandlers(): void {
  handle(IPC.App.GetInfo, () => ({
    name: app.getName(),
    version: app.getVersion(),
    isDev: !app.isPackaged,
    platform: process.platform as AppPlatform,
    arch: process.arch,
    userDataPath: app.getPath('userData'),
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    }
  }))
}
