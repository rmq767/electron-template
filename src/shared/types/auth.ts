/** 会话与登录的跨进程类型。token 落在 userData/settings.json，不落 localStorage。 */

export interface AuthSession {
  token: string
  /** 登录账号 */
  userName: string
  displayName: string
  roles: string[]
}

export interface LoginPayload {
  userName: string
  password: string
}
