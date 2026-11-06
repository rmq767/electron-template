/** 跨进程可见的业务 DTO。只允许纯对象，不得带函数或 class 实例。 */

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface UserDTO {
  id?: number
  name: string
  account: string
  role: UserRole
  remark?: string
}

/** 列表行：已落库的记录必然带主键，区别于新增时尚无 id 的 UserDTO。 */
export interface UserRow extends UserDTO {
  id: number
}
