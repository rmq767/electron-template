import { ipcRenderer } from 'electron'
import type { InvokeChannel, RequestPayload, RequestResult } from '@shared/ipc/schema'

/** 无入参的通道展开成空参数列表，调用侧不会被迫传 undefined。 */
type Args<C extends InvokeChannel> = [RequestPayload<C>] extends [undefined] ? [] : [RequestPayload<C>]

export function invoke<C extends InvokeChannel>(
  channel: C,
  ...args: Args<C>
): Promise<RequestResult<C>> {
  return ipcRenderer.invoke(channel, ...(args as unknown[])) as Promise<RequestResult<C>>
}
