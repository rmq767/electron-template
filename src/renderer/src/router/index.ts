import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'
import { setupGuards } from './guards'

/**
 * 必须用 hash 历史：生产包经 file:// 加载，history 模式的路径无法解析。
 * 独立窗口也共用这一个入口，靠 /w/:kind 分路由（Step 6）。
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

setupGuards(router)

export default router
