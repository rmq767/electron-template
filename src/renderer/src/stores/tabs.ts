import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { LANDING_PATH, LANDING_ROUTE_NAME, LANDING_TITLE } from '@shared/constants/navigation'

interface TabItem {
  path: string
  name: string
  title: string
}

/** 落地页固定在第一个，不可关闭。 */
const LANDING: TabItem = { path: LANDING_PATH, name: LANDING_ROUTE_NAME, title: LANDING_TITLE }

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([{ ...LANDING }])
  const activePath = ref(LANDING.path)

  /** keep-alive 的 include 依据组件名，这里与路由 name 一一对应。 */
  const cachedNames = computed(() => tabs.value.map((tab) => tab.name))

  function isFixed(path: string): boolean {
    return path === LANDING.path
  }

  function add(route: RouteLocationNormalized): void {
    const { path, name, meta } = route
    // 固定页也要点亮激活态，否则从其他页点回落地页时标签高亮会留在旧标签
    activePath.value = path
    if (!name || !meta.title || path === LANDING.path) return
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
    const next = tabs.value[index - 1] ?? tabs.value[index] ?? LANDING
    activePath.value = next.path
    return next.path
  }

  function reset(): void {
    tabs.value = [{ ...LANDING }]
    activePath.value = LANDING.path
  }

  return { tabs, activePath, cachedNames, add, remove, reset, isFixed }
})
