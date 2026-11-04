import { IPC } from '@shared/ipc/channels'
import { getSetting, setSetting } from '@main/store/settings'
import { handle } from './handle'

export function registerStoreHandlers(): void {
  handle(IPC.Store.Get, ({ key }) => getSetting(key))
  handle(IPC.Store.Set, ({ key, value }) => {
    setSetting(key, value)
  })
}
