import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { SettingsKey, SettingsValue } from '@shared/ipc/schema'
import type { AuthSession } from '@shared/types/auth'

/**
 * 极简 JSON 设置存储，落在 userData/settings.json。
 * 用途是小体积的用户偏好与会话凭据；大对象请走文件对话框导出，不要塞进这里。
 */

type Store = Record<string, SettingsValue>

const SETTINGS_KEYS: readonly SettingsKey[] = ['ui.theme', 'ui.sidebarCollapsed', 'auth.session']

function isSettingsKey(key: string): key is SettingsKey {
  return (SETTINGS_KEYS as readonly string[]).includes(key)
}

/**
 * IPC 只有编译期契约；这里是主进程侧的运行时校验入口。
 * 非法 key（例如 __proto__）与形状不符的值一律拒绝，不写进 settings.json。
 */
function assertSettingsValue(key: SettingsKey, value: unknown): asserts value is SettingsValue {
  if (key === 'ui.theme') {
    if (value !== 'light' && value !== 'dark') throw new Error('[store] ui.theme 必须是 light/dark')
    return
  }
  if (key === 'ui.sidebarCollapsed') {
    if (typeof value !== 'boolean') throw new Error('[store] ui.sidebarCollapsed 必须是 boolean')
    return
  }
  if (value === null) return
  if (!value || typeof value !== 'object') throw new Error('[store] auth.session 形状不合法')
  const session = value as Partial<AuthSession>
  const rolesOk =
    Array.isArray(session.roles) && session.roles.every((role) => typeof role === 'string')
  if (
    typeof session.token !== 'string' ||
    typeof session.userName !== 'string' ||
    typeof session.displayName !== 'string' ||
    !rolesOk
  ) {
    throw new Error('[store] auth.session 形状不合法')
  }
}

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
  if (!isSettingsKey(key)) throw new Error(`[store] 未知设置键：${String(key)}`)
  return load()[key]
}

export function setSetting(key: SettingsKey, value: unknown): void {
  if (!isSettingsKey(key)) throw new Error(`[store] 未知设置键：${String(key)}`)
  assertSettingsValue(key, value)
  const store = load()
  store[key] = value
  const path = file()
  const payload = JSON.stringify(store, null, 2)
  mkdirSync(dirname(path), { recursive: true })
  // 先写临时文件再原子替换，避免写一半崩溃把整份设置弄坏
  const temp = `${path}.tmp`
  writeFileSync(temp, payload, 'utf-8')
  renameSync(temp, path)
  cache = store
}
