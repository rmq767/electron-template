/**
 * IPC channel 字面量的唯一真源。
 * 命名口径：`域:动作`，动词用现在时。新增通道先在这里登记，再去 schema.ts 补契约。
 */
export const IPC = {
  App: {
    GetInfo: 'app:get-info'
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
  }
} as const
