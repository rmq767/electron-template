/**
 * 三端共用的应用身份。值来自 .env，由 electron.vite.config.ts 在构建期注入，
 * 业务代码只从这里读，不要在页面或主进程里再写死名称/图标。
 */
export const APP_NAME = __APP_NAME__
export const APP_TAGLINE = __APP_TAGLINE__
export const APP_ID = __APP_ID__
export const APP_ICON = __APP_ICON__
export const APP_FEATURE_LOGIN = __APP_FEATURE_LOGIN__
/** 无需登录时启动页的最短展示时间，避免主窗加载太快导致一闪而过。 */
export const APP_SPLASH_MIN_MS = __APP_SPLASH_MIN_MS__

/** 品牌字母标：登录页、标题栏、侧栏共用，改名字就自动跟着变。 */
export const APP_INITIAL = APP_NAME.trim().charAt(0).toUpperCase() || 'A'
