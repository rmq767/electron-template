import { ipcRenderer } from 'electron'
import type {
  EventChannel,
  EventPayload,
  InvokeChannel,
  RequestPayload,
  RequestResult
} from '@shared/ipc/schema'

/** 无入参的通道展开成空参数列表，调用侧不会被迫传 undefined。 */
type Args<C extends InvokeChannel> = [RequestPayload<C>] extends [undefined]
  ? []
  : [RequestPayload<C>]

export function invoke<C extends InvokeChannel>(
  channel: C,
  ...args: Args<C>
): Promise<RequestResult<C>> {
  return ipcRenderer.invoke(channel, ...(args as unknown[])) as Promise<RequestResult<C>>
}

/**
 * 订阅主进程推送。返回值是解绑函数——多窗口场景最常见的泄漏点，
 * 所以这里强制调用方拿到并在使用完（组件卸载）时执行它。
 */
export function on<E extends EventChannel>(
  channel: E,
  callback: (payload: EventPayload<E>) => void
): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: EventPayload<E>): void => {
    callback(payload)
  }
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}
