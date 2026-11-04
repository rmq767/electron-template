import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Api } from './api/types'
import { appApi } from './api/app'
import { dialogApi } from './api/dialog'
import { logApi } from './api/log'
import { storeApi } from './api/store'
import { windowApi } from './api/window'

// satisfies 让实现与 Api 在编译期对齐：少一个方法或返回类型不符都会直接报错，
// 同时保留字面量推断，不像 `: Api` 那样把具体类型抹平。
const api = {
  app: appApi,
  store: storeApi,
  dialog: dialogApi,
  log: logApi,
  window: windowApi
} satisfies Api

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // 隔离一旦关掉，contextBridge 就不生效；此处绝不退化成直接挂 window.xxx，
  // 那等于把 Node 能力裸暴露给页面。窗口预设里 contextIsolation 恒为 true。
  console.error('[preload] contextIsolation 未开启，拒绝挂载宿主能力')
}
