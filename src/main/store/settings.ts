import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { SettingsKey, SettingsValue } from '@shared/ipc/schema'

/**
 * 极简 JSON 设置存储，落在 userData/settings.json。
 * 用途是小体积的用户偏好与会话凭据；大对象请走文件对话框导出，不要塞进这里。
 */

type Store = Record<string, SettingsValue>

let cache: Store | null = null

function file(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function load(): Store {
  if (cache) return cache
  const path = file()
  if (!existsSync(path)) {
    cache = {}
    return cache
  }
  try {
    cache = JSON.parse(readFileSync(path, 'utf-8')) as Store
  } catch {
    // 文件损坏时不能让整个应用起不来：备份后重新开始
    const broken = `${path}.broken-${Date.now()}`
    try {
      writeFileSync(broken, readFileSync(path))
    } catch {
      /* 备份失败也继续 */
    }
    cache = {}
  }
  return cache
}

export function getSetting(key: SettingsKey): SettingsValue | undefined {
  return load()[key]
}

export function setSetting(key: SettingsKey, value: unknown): void {
  const store = load()
  store[key] = value as SettingsValue
  const path = file()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8')
  cache = store
}
