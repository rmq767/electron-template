import { ElMessageBox } from 'element-plus'

export interface ConfirmOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  /** danger 用于删除等不可逆操作，按钮走红色。 */
  danger?: boolean
}

/**
 * 是/否交互统一走这里，返回 Promise<boolean>，避免每页重写一套确认框文案。
 * 取消与关闭都算 false，不抛异常。
 */
export async function confirmAction(
  message: string,
  options: ConfirmOptions = {}
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, options.title ?? '操作确认', {
      type: options.danger ? 'warning' : 'info',
      confirmButtonText: options.confirmText ?? '确定',
      cancelButtonText: options.cancelText ?? '取消',
      ...(options.danger ? { confirmButtonClass: 'el-button--danger' } : {})
    })
    return true
  } catch {
    return false
  }
}
