import type { SettingsKey, SettingsValueOf } from '@shared/ipc/schema'
import { IPC } from '@shared/ipc/channels'
import { invoke } from '../ipc'

export const storeApi = {
  get: <K extends SettingsKey>(key: K): Promise<SettingsValueOf<K> | undefined> =>
    invoke(IPC.Store.Get, { key }) as Promise<SettingsValueOf<K> | undefined>,

  set: <K extends SettingsKey>(key: K, value: SettingsValueOf<K>): Promise<void> =>
    invoke(IPC.Store.Set, { key, value })
}
