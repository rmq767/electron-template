import { join } from 'path'
import { pathToFileURL } from 'url'
import { is } from '@electron-toolkit/utils'

/**
 * 单入口 + hash 分路由：登录窗、主界面与独立窗口共用同一份 index.html 与 chunk，
 * dev / HMR / 生产 file:// 只有一条路径。
 */
export function rendererEntry(hashPath: string): string {
  const hash = `#${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}`
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) return `${devUrl.replace(/\/$/, '')}/${hash}`
  return `${pathToFileURL(join(__dirname, '../renderer/index.html')).href}${hash}`
}
