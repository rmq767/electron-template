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

  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  async function hydrate(): Promise<void> {
    const [savedTheme, savedCollapsed] = await Promise.all([
      window.api.store.get('ui.theme'),
      window.api.store.get('ui.sidebarCollapsed')
    ])
    if (savedTheme) theme.value = savedTheme
    sidebarCollapsed.value = savedCollapsed ?? false
    applyTheme()
  }

  watch(theme, (value) => {
    applyTheme()
    void window.api.store.set('ui.theme', value)
  })

  watch(sidebarCollapsed, (value) => {
    void window.api.store.set('ui.sidebarCollapsed', value)
  })

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { theme, sidebarCollapsed, hydrate, toggleTheme, toggleSidebar }
})
