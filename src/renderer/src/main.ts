import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import '@renderer/styles/index.css'
import '@renderer/styles/element-theme.css'
// 暗黑模式变量：切换只改 html 上的 dark class
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import { configureHttp } from './api/http'

const app = createApp(App)
const pinia = createPinia()

// 全量引入：桌面应用不在意首屏 CSS 体积，换来的是零构建期插件依赖与可控产物
app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 未捕获的组件错误统一汇入主进程日志；不引第三方上报（企业内网 + 隐私）
app.config.errorHandler = (err, _instance, info) => {
  window.api.log.error('渲染进程未捕获错误', {
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

  configureHttp({
    getToken: () => authStore.session?.token ?? null,
    onUnauthorized: () => void authStore.clear()
  })

  await Promise.all([appStore.hydrate(), authStore.restore()])
  app.mount('#app')
  await router.isReady()
}

void bootstrap()
