/**
 * IPC channel 字面量的唯一真源。
 * 命名口径：`域:动作`，动词用现在时。新增通道先在这里登记，再去 schema.ts 补契约。
 */
export const IPC = {
  App: {
    GetInfo: 'app:get-info',
    ExportDiagnostics: 'app:export-diagnostics',
    /** 登录窗口完成认证：关闭登录窗，展示主窗口。 */
    CompleteLogin: 'app:complete-login',
    /** 主窗口退出登录：切回登录窗口。 */
    ShowLogin: 'app:show-login',
    /** 主窗口渲染层完成首屏挂载，启动页可以退场。 */
    UiReady: 'app:ui-ready'
  },
  Window: {
    Open: 'window:open',
    Close: 'window:close',
    GetPayload: 'window:get-payload',
    PushProps: 'window:push-props',
    Focus: 'window:focus',
    Minimize: 'window:minimize',
    ToggleMaximize: 'window:toggle-maximize',
    GetState: 'window:get-state',
    CloseSelf: 'window:close-self'
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
    WindowProps: 'evt:window-props',
    WindowState: 'evt:window-state'
  }
} as const
