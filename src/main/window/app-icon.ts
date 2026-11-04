import { join } from 'path'
import { app, nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import { APP_ICON } from '@shared/constants/app'

let cached: NativeImage | null | undefined

/**
 * 运行时图标文件名来自 .env（APP_ICON），开发与打包都从 resources/ 读：
 * 开发取项目根目录，打包后由 electron-builder 的 extraResources 原样拷到 resources/。
 */
export function resolveAppIcon(): NativeImage | undefined {
  if (cached !== undefined) return cached ?? undefined
  const base = app.isPackaged
    ? join(process.resourcesPath, 'resources')
    : join(app.getAppPath(), 'resources')
  const image = nativeImage.createFromPath(join(base, APP_ICON))
  cached = image.isEmpty() ? null : image
  return cached ?? undefined
}
