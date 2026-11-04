import { registerAppHandlers } from './app.handler'
import { registerDialogHandlers } from './dialog.handler'
import { registerLogHandlers } from './log.handler'
import { registerStoreHandlers } from './store.handler'

/** 在 app.whenReady() 后、建窗口前调用。 */
export function registerIpc(): void {
  registerAppHandlers()
  registerStoreHandlers()
  registerDialogHandlers()
  registerLogHandlers()
}
