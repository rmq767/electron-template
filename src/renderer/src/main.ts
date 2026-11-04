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

// 主题与侧栏状态要从 userData 恢复，必须在挂载前把 store 建好
useAppStore(pinia).hydrate()

app.mount('#app')
