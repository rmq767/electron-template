/**
 * IPC channel 字面量的唯一真源。
 * 命名口径：`域:动作`，动词用现在时。新增通道先在这里登记，再去 schema.ts 补契约。
 */
export const IPC = {
  App: {
    GetInfo: 'app:get-info'
  },
  Window: {
    Open: 'window:open',
    Close: 'window:close',
    GetPayload: 'window:get-payload',
    PushProps: 'window:push-props',
    Focus: 'window:focus'
  },
  Store: {
    Get: 'store:get',
    Set: 'store:set'
  },
  Dialog: {
    OpenFile: 'dialog:open-file',
    SaveFile: 'dialog:save-file'
  },
  Log: {
    Write: 'log:write'
  },
  /** 主进程 → 渲染进程的推送只允许走 Evt 段。 */
  Evt: {
    WindowProps: 'evt:window-props'
  }
} as const
