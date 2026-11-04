import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { logger } from './logger'

/**
 * 诊断包：一份 JSON + 当日日志副本，落在 userData/diagnostics。
 * 不引 zip 依赖——桌面端「生成到本地目录、用资源管理器打开」比传压缩包更实用。
 */
function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function tailOfTodayLog(lines = 400): string {
  const dir = logger.dir()
  if (!existsSync(dir)) return ''
  const pad = (n: number): string => String(n).padStart(2, '0')
  const now = new Date()
  const name = `app-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.log`
  const full = join(dir, name)
  if (!existsSync(full)) return ''
  return readFileSync(full, 'utf-8').split(/\r?\n/).slice(-lines).join('\n')
}

export function createDiagnosticsPackage(): string {
  const dir = join(app.getPath('userData'), 'diagnostics')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const file = join(dir, `diagnostic-${stamp()}.json`)

  const payload = {
    generatedAt: new Date().toISOString(),
    app: {
      name: app.getName(),
      version: app.getVersion(),
      packaged: app.isPackaged,
      userData: app.getPath('userData')
    },
    runtime: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
      platform: process.platform,
      arch: process.arch
    },
    windows: app
      .getAppMetrics()
      .filter((item) => item.type === 'Tab')
      .map((item) => ({ pid: item.pid, memoryMb: Math.round(item.memory.workingSetSize / 1024) })),
    logTail: tailOfTodayLog()
  }

  writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8')
  logger.info('诊断包已生成', { file })
  return file
}
