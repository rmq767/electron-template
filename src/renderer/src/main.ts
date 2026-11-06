import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { messageDefaults } from 'element-plus'
import 'element-plus/dist/index.css'
// 暗黑模式变量：切换只改 html 上的 dark class；必须先于项目主题覆盖加载
import 'element-plus/theme-chalk/dark/css-vars.css'
// vxe 先加载基础组件样式，再加载表格样式；项目主题覆盖必须排在它们之后
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'

import '@renderer/styles/index.scss'
import '@renderer/styles/element-theme.scss'

import App from './app.vue'
import router from './router'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import { configureHttp } from './api/http'
import MySearch from './components/my-search/index.vue'
import MyTable from './components/my-table/index.vue'
import MyPagination from './components/my-pagination/index.vue'
import MyDialog from './components/my-dialog/index.vue'
import MyDrawer from './components/my-drawer/index.vue'
import WindowGate from './components/window-gate/index.vue'

// 自定义标题栏高 40px：消息条从标题栏下方开始，别压住窗口控件。
// Element 的 messageDefaults 类型把默认值收窄成字面量 16，这里按可变配置对象写回。
const messageConfig = messageDefaults as { offset: number }
messageConfig.offset = 52

const app = createApp(App)
const pinia = createPinia()

// 全量引入：桌面应用不在意首屏 CSS 体积，换来的是零构建期插件依赖与可控产物
app.use(ElementPlus)
app.use(pinia)

// 全局组件：页面里直接写 <my-search> / <my-table> / <my-pagination> / <my-dialog> / <my-drawer>
app.component('my-search', MySearch)
app.component('my-table', MyTable)
app.component('my-pagination', MyPagination)
app.component('my-dialog', MyDialog)
app.component('my-drawer', MyDrawer)
app.component('window-gate', WindowGate)
// 注意：router 不能在这里安装——安装即触发首次导航，此时 store 还没 restore，
// 守卫会把已登录用户误判为未登录。放在 bootstrap 的水合完成之后。

// 未捕获的组件错误统一汇入主进程日志；不引第三方上报（企业内网 + 隐私）
// 浏览器预览没有 preload，日志宿主也要做存在性保护，否则 errorHandler 自己会再抛一次
app.config.errorHandler = (err, _instance, info) => {
  window.api?.log?.error?.('渲染进程未捕获错误', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    info
  })
}

/**
 * 先恢复偏好与会话，再挂载：否则首次导航的守卫会在 store 还没水合时判定未登录，
 * 把已登录用户错误地弹回登录页。
 */
async function bootstrap(): Promise<void> {
  const appStore = useAppStore(pinia)
  const authStore = useAuthStore(pinia)

  // 401 可能由多个并发请求同时触发：2s 内只处理一次，避免重复写盘与重复切窗；
  // 用时间窗而不是永久标记，浏览器预览里重新登录后后续 401 仍能生效
  let unauthorizedAt = 0
  configureHttp({
    getToken: () => authStore.session?.token ?? null,
    onUnauthorized: () => {
      const now = Date.now()
      if (now - unauthorizedAt < 2000) return
      unauthorizedAt = now
      // 先等会话真正落盘再切窗：主进程销毁渲染进程后，在途的 store:set 会丢
      void (async () => {
        try {
          await authStore.clear()
        } catch {
          /* 清会话失败也要继续切回登录，不能把用户留在过期页面 */
        }
        const self = window.api?.window?.self ?? null
        if (self === null && window.api?.app?.showLogin) {
          await window.api.app
            .showLogin()
            .catch(() => router.replace('/login').catch(() => undefined))
          return
        }
        await router.replace('/login').catch(() => undefined)
      })()
    }
  })

  try {
    await Promise.all([appStore.hydrate(), authStore.restore()])
  } catch (err) {
    // 本地状态恢复失败不应该变成白屏：继续挂载，页面按默认值运行
    window.api?.log?.error?.('恢复本地状态失败', {
      message: err instanceof Error ? err.message : String(err)
    })
  }
  app.use(router)
  app.mount('#app')
  try {
    await router.isReady()
  } catch (err) {
    window.api?.log?.error?.('首屏导航失败', {
      message: err instanceof Error ? err.message : String(err)
    })
  }
  // 主窗口据此通知主进程：启动页可以退场了；其他窗口的通知会被主进程忽略
  void window.api?.app?.uiReady?.().catch(() => {})
}

void bootstrap()
