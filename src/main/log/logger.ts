import { app } from 'electron'
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { join } from 'path'
import type { LogEntry } from '@shared/ipc/types'

const MAX_BYTES = 10 * 1024 * 1024
const KEEP_DAYS = 14

let stream: ReturnType<typeof createWriteStream> | null = null
let streamDate = ''
let writtenBytes = 0

function today(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function logDir(): string {
  const dir = join(app.getPath('userData'), 'logs')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/** 按天分片；单个文件写满 MAX_BYTES 后切到 .1/.2/… */
function openStream(): ReturnType<typeof createWriteStream> {
  const date = today()
  if (stream && date === streamDate && writtenBytes < MAX_BYTES) return stream

  stream?.end()
  stream = null

  const base = join(logDir(), `app-${date}.log`)
  let target = base
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? base : `${base}.${i}`
    if (!existsSync(candidate) || statSync(candidate).size < MAX_BYTES) {
      target = candidate
      break
    }
  }

  streamDate = date
  writtenBytes = existsSync(target) ? statSync(target).size : 0
  stream = createWriteStream(target, { flags: 'a' })
  return stream
}

/** 删除修改时间早于 KEEP_DAYS 的日志文件。 */
export function pruneLogs(): void {
  const dir = logDir()
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000
  for (const name of readdirSync(dir)) {
    if (!name.startsWith('app-') || !name.includes('.log')) continue
    const full = join(dir, name)
    try {
      if (statSync(full).mtimeMs < cutoff) rmSync(full)
    } catch {
      // 文件被占用时跳过，不影响本次写入
    }
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '[unserializable]'
  }
}

function format(entry: LogEntry): string {
  const meta = entry.meta === undefined ? '' : ` ${safeJson(entry.meta)}`
  return `[${new Date().toISOString()}] [${entry.level.toUpperCase()}] [${entry.scope}] ${entry.message}${meta}`
}

function write(entry: LogEntry): void {
  const line = format(entry)
  if (entry.level === 'error') console.error(line)
  else console.log(line)

  try {
    openStream().write(`${line}\n`)
    writtenBytes += Buffer.byteLength(line) + 1
  } catch (err) {
    console.error('[logger] 落盘失败', err)
  }
}

export const logger = {
  info: (message: string, meta?: unknown): void =>
    write({ level: 'info', scope: 'main', message, meta }),
  warn: (message: string, meta?: unknown): void =>
    write({ level: 'warn', scope: 'main', message, meta }),
  error: (message: string, meta?: unknown): void =>
    write({ level: 'error', scope: 'main', message, meta }),
  /** 渲染进程经 IPC.Log.Write 汇入，落进同一份文件。 */
  fromRenderer: (entry: LogEntry): void => write({ ...entry, scope: 'renderer' }),
  dir: logDir,
  prune: pruneLogs
} as const
