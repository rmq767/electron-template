import { IPC } from '@shared/ipc/channels'
import type {
  OpenOutcome,
  OpenWindowOptions,
  WindowChromeState,
  WindowKind,
  WindowPayload,
  WindowPropsMap,
  WindowResultMap,
  WindowSelf,
  WindowSurface
} from '@shared/ipc/window-spec'
import { invoke, on } from '../ipc'

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length)
}

/** 身份从 argv 同步可读，不需要先跑一次 IPC。 */
const self: WindowSelf | null = (() => {
  const windowId = readArg('window-id')
  const kind = readArg('window-kind') as WindowSurface | undefined
  return windowId && kind ? { windowId, kind } : null
})()

export const windowApi = {
  self,

  open: <K extends WindowKind>(
    kind: K,
    props?: WindowPropsMap[K],
    options?: OpenWindowOptions
  ): Promise<OpenOutcome<WindowResultMap[K]>> =>
    invoke(IPC.Window.Open, { kind, props, options }) as Promise<OpenOutcome<WindowResultMap[K]>>,

  /** 不带 result 就是「取消」，带 result 就是「完成」。 */
  close: (result?: unknown): Promise<void> => invoke(IPC.Window.Close, { result }),

  getPayload: <K extends WindowKind>(): Promise<WindowPayload<K>> =>
    invoke(IPC.Window.GetPayload) as Promise<WindowPayload<K>>,

  pushProps: <K extends WindowKind>(callback: (props: WindowPropsMap[K]) => void): (() => void) =>
    on(IPC.Evt.WindowProps, (payload) => callback(payload.props as WindowPropsMap[K])),

  focus: (windowId: string): Promise<void> => invoke(IPC.Window.Focus, { windowId }),

  minimize: (): Promise<void> => invoke(IPC.Window.Minimize),

  toggleMaximize: (): Promise<boolean> => invoke(IPC.Window.ToggleMaximize),

  getState: (): Promise<WindowChromeState> => invoke(IPC.Window.GetState),

  closeSelf: (): Promise<void> => invoke(IPC.Window.CloseSelf),

  onState: (callback: (state: WindowChromeState) => void): (() => void) =>
    on(IPC.Evt.WindowState, callback)
}
