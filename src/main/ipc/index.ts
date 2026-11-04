import { registerAppHandlers } from './app.handler'
import { registerDialogHandlers } from './dialog.handler'
import { registerLogHandlers } from './log.handler'
import { registerStoreHandlers } from './store.handler'
import { registerWindowHandlers } from './window.handler'

/** 在 app.whenReady() 后、建窗口前调用。 */
export function registerIpc(): void {
  registerAppHandlers()
  registerWindowHandlers()
  registerStoreHandlers()
  registerDialogHandlers()
  registerLogHandlers()
}
