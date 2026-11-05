/**
 * 主窗口落地页：路由表、固定标签、登录回跳、404 与主进程加载路径共用。
 * 改这里一处即可，避免在多个进程里各写一份字符串。
 */
export const LANDING_PATH = '/system/user'
export const LANDING_ROUTE_NAME = 'system-user'
export const LANDING_TITLE = '用户管理'
