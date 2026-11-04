import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

interface TabItem {
  path: string
  name: string
  title: string
}

/** 概览页固定在第一个，不可关闭。 */
const HOME: TabItem = { path: '/home', name: 'home', title: '概览' }

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([{ ...HOME }])
  const activePath = ref(HOME.path)

  /** keep-alive 的 include 依据组件名，这里与路由 name 一一对应。 */
  const cachedNames = computed(() => tabs.value.map((tab) => tab.name))

  function isFixed(path: string): boolean {
    return path === HOME.path
  }

  function add(route: RouteLocationNormalized): void {
    const { path, name, meta } = route
    // 固定页也要点亮激活态，否则从其他页点回概览时标签高亮会留在旧标签
    activePath.value = path
    if (!name || !meta.title || path === '/home') return
    const exists = tabs.value.some((tab) => tab.path === path)
    if (!exists) tabs.value.push({ path, name: String(name), title: meta.title })
  }

  /** 返回关闭后应跳转的路径；关闭的是非激活页时返回 null 表示不用跳。 */
  function remove(path: string): string | null {
    if (isFixed(path)) return null
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) return null
    tabs.value.splice(index, 1)
    if (activePath.value !== path) return null
    const next = tabs.value[index - 1] ?? tabs.value[index] ?? HOME
    activePath.value = next.path
    return next.path
  }

  function reset(): void {
    tabs.value = [{ ...HOME }]
    activePath.value = HOME.path
  }

  return { tabs, activePath, cachedNames, add, remove, reset, isFixed }
})
