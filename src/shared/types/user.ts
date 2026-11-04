/** 跨进程可见的业务 DTO。只允许纯对象，不得带函数或 class 实例。 */

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface UserDTO {
  id?: number
  name: string
  account: string
  role: UserRole
  remark?: string
}
