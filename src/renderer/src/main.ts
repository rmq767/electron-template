import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 未捕获的组件错误统一汇入主进程日志；不引第三方上报（企业内网 + 隐私）
app.config.errorHandler = (err, _instance, info) => {
  window.api.log.error('渲染进程未捕获错误', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    info
  })
}

app.mount('#app')
