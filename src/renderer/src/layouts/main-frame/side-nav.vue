<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { Expand, Fold, User } from '@element-plus/icons-vue'
import { useAppStore } from '@renderer/stores/app'
import { menuRoutes } from '@renderer/router/routes'

const app = useAppStore()
const route = useRoute()
const router = useRouter()
const version = ref('')

const icons: Record<string, Component> = {
  'system-user': User
}

const groups = computed(() => {
  const map = new Map<string, { index: string; title: string; icon?: Component }[]>()
  for (const child of menuRoutes ?? []) {
    if (!child.name) continue
    const group = child.meta?.group ?? '导航'
    const item = {
      index: `/${String(child.path)}`.replace(/\/{2,}/g, '/'),
      title: child.meta?.title ?? String(child.path),
      icon: icons[String(child.name)]
    }
    const list = map.get(group) ?? []
    list.push(item)
    map.set(group, list)
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }))
})

function go(path: string): void {
  if (route.path !== path) void router.push(path)
}

onMounted(async () => {
  try {
    const info = await window.api?.app?.getInfo()
    version.value = info?.version ?? ''
  } catch {
    /* 浏览器预览没有宿主信息，隐藏版本号即可 */
  }
})
</script>

<template>
  <aside class="side-nav" :class="{ 'is-collapsed': app.sidebarCollapsed }">
    <div class="side-nav__scroll">
      <section v-for="group in groups" :key="group.label" class="side-nav__group">
        <p class="side-nav__label">{{ group.label }}</p>
        <button
          v-for="item in group.items"
          :key="item.index"
          type="button"
          class="side-nav__item"
          :class="{ 'is-active': route.path === item.index }"
          :title="app.sidebarCollapsed ? item.title : undefined"
          :aria-current="route.path === item.index ? 'page' : undefined"
          @click="go(item.index)"
        >
          <el-icon v-if="item.icon" class="side-nav__icon">
            <component :is="item.icon" />
          </el-icon>
          <span v-if="!app.sidebarCollapsed" class="side-nav__text">{{ item.title }}</span>
        </button>
      </section>
    </div>

    <footer class="side-nav__footer">
      <button
        type="button"
        class="side-nav__collapse"
        :title="app.sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
        :aria-label="app.sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
        @click="app.toggleSidebar()"
      >
        <el-icon>
          <expand v-if="app.sidebarCollapsed" />
          <fold v-else />
        </el-icon>
      </button>
      <span v-if="!app.sidebarCollapsed" class="side-nav__meta">
        <span class="status-dot" />
        <span v-if="version" class="side-nav__version">v{{ version }}</span>
      </span>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.side-nav {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: var(--app-sidenav-width);
  background: var(--app-sidebar);
  border-right: 1px solid var(--app-chrome-divider);
  transition: width 0.18s ease;
  overflow: hidden;
}

.side-nav.is-collapsed {
  width: var(--app-sidenav-collapsed-width);
}

.side-nav__scroll {
  flex: 1;
  padding: 14px 10px;
  overflow-y: auto;
}

.side-nav__scroll::-webkit-scrollbar-thumb {
  background: var(--app-sidebar-scrollbar);
  background-clip: content-box;
}

.side-nav__group + .side-nav__group {
  margin-top: 22px;
}

.side-nav__label {
  margin: 0 10px 6px;
  color: var(--app-sidebar-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.side-nav.is-collapsed .side-nav__label {
  display: none;
}

.side-nav__item {
  position: relative;
  display: flex;
  width: 100%;
  height: 34px;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-sidebar-ink);
  cursor: default;
  font-size: 12.5px;
  text-align: left;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.side-nav__item:hover {
  background: var(--app-sidebar-hover);
  color: var(--app-sidebar-ink-strong);
}

.side-nav__item.is-active {
  background: var(--app-sidebar-active);
  color: var(--app-sidebar-ink-strong);
}

.side-nav__item.is-active::before {
  content: '';
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 0;
  width: 2px;
  border-radius: 2px;
  background: var(--app-accent);
}

.side-nav__icon {
  flex-shrink: 0;
  font-size: 16px;
}

.side-nav__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-nav.is-collapsed .side-nav__item {
  justify-content: center;
  padding: 0;
}

.side-nav.is-collapsed .side-nav__icon {
  font-size: 18px;
}

.side-nav__footer {
  display: flex;
  height: 50px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  border-top: 1px solid var(--app-chrome-divider);
}

.side-nav.is-collapsed .side-nav__footer {
  justify-content: center;
  padding: 0;
}

.side-nav__collapse {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-sidebar-ink);
  cursor: default;
  font-size: 15px;
}

.side-nav__collapse:hover {
  background: var(--app-sidebar-hover);
  color: var(--app-sidebar-ink-strong);
}

.side-nav__meta {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}

.side-nav__version {
  color: var(--app-sidebar-meta);
  font-family: var(--app-font-mono);
  font-size: 10px;
  white-space: nowrap;
}
</style>
