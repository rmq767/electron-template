import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSession, LoginPayload } from '@shared/types/auth'

/**
 * 会话。token 存 userData/settings.json（主进程读写），不用 localStorage：
 * 独立窗口各有自己的 Web Storage，只有主进程那份是唯一的。
 *
 * 校验走本地 mock：模板不虚构后端接口，接真实鉴权时替换 login() 里的 mockVerify。
 */

/** mock 账号，仅用于把流程跑通。 */
const MOCK_ACCOUNTS: Record<string, { password: string; session: Omit<AuthSession, 'token'> }> = {
  admin: {
    password: '123456',
    session: { userName: 'admin', displayName: '系统管理员', roles: ['admin'] }
  }
}

function mockVerify(payload: LoginPayload): AuthSession | null {
  const account = MOCK_ACCOUNTS[payload.userName]
  if (!account || account.password !== payload.password) return null
  return { ...account.session, token: `mock-token-${Date.now()}` }
}

export const useAuthStore = defineStore('auth', () => {
  const session = shallowRef<AuthSession | null>(null)
  const isAuthenticated = computed(() => session.value !== null)
  // 浏览器预览没有 preload：会话只保存在内存，刷新即失效
  const store = window.api?.store

  async function restore(): Promise<void> {
    session.value = (await store?.get('auth.session')) ?? null
  }

  async function login(payload: LoginPayload): Promise<AuthSession> {
    const next = mockVerify(payload)
    if (!next) throw new Error('账号或密码不正确（mock 账号：admin / 123456）')
    session.value = next
    await store?.set('auth.session', next)
    return next
  }

  async function logout(): Promise<void> {
    session.value = null
    await store?.set('auth.session', null)
  }

  /** 401 或 token 过期：清掉本地会话，剩下的交给守卫回登录页。 */
  const clear = logout

  return { session, isAuthenticated, restore, login, logout, clear }
})
