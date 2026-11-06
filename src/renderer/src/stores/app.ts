import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

type AppTheme = 'light' | 'dark'

/**
 * 界面偏好。持久化走主进程（userData/settings.json），
 * 不用 localStorage：多窗口各有独立 Web Storage，只有主进程那份是唯一的。
 */
export const useAppStore = defineStore('app', () => {
  const theme = ref<AppTheme>('light')
  const sidebarCollapsed = ref(false)
  // 单独在浏览器里预览渲染层时没有 preload：降级为内存状态，页面仍可挂载
  const store = window.api?.store
  // 记录已落盘的值，避免 hydrate 时被 watch 原样回写一次
  let persistedTheme: AppTheme | null = null
  let persistedCollapsed: boolean | null = null

  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  async function hydrate(): Promise<void> {
    const [savedTheme, savedCollapsed] = await Promise.all([
      store?.get('ui.theme'),
      store?.get('ui.sidebarCollapsed')
    ])
    if (savedTheme) theme.value = savedTheme
    sidebarCollapsed.value = savedCollapsed ?? false
    persistedTheme = theme.value
    persistedCollapsed = sidebarCollapsed.value
    applyTheme()
  }

  watch(theme, (value) => {
    applyTheme()
    if (value === persistedTheme) return
    persistedTheme = value
    void store?.set('ui.theme', value)
  })

  watch(sidebarCollapsed, (value) => {
    if (value === persistedCollapsed) return
    persistedCollapsed = value
    void store?.set('ui.sidebarCollapsed', value)
  })

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { theme, sidebarCollapsed, hydrate, toggleTheme, toggleSidebar }
})
