/**
 * 环境变量按进程分面，业务代码只从这里读，不直接碰 import.meta.env。
 * 前缀口径：RENDERER_VITE_* 会打进 bundle（不是秘密），主进程密钥用 MAIN_VITE_*。
 */
export const env = {
  /** 空字符串表示未配置后端，此时接口层直接给出可读报错，不假装能跑。 */
  apiBaseUrl: import.meta.env.RENDERER_VITE_API_BASE_URL ?? '',
  /** 关掉登录页：守卫短路，直接进主界面。 */
  featureLogin: import.meta.env.RENDERER_VITE_FEATURE_LOGIN !== 'false',
  isDev: import.meta.env.DEV
} as const
