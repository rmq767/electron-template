<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Close, Refresh, RefreshLeft } from '@element-plus/icons-vue'
import { useTabsStore } from '@renderer/stores/tabs'

const router = useRouter()
const tabs = useTabsStore()

function onTabChange(path: string): void {
  if (path !== router.currentRoute.value.path) void router.push(path)
}

function onClose(path: string): void {
  const next = tabs.remove(path)
  if (next) void router.push(next)
}

function refreshCurrent(): void {
  void router.replace({ path: router.currentRoute.value.fullPath })
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-bar__tabs" role="tablist" aria-label="已打开的页面">
      <div
        v-for="tab in tabs.tabs"
        :key="tab.path"
        class="tab"
        :class="{ 'is-active': tabs.activePath === tab.path }"
        role="tab"
        :aria-selected="tabs.activePath === tab.path"
        tabindex="0"
        @click="onTabChange(tab.path)"
        @keydown.enter="onTabChange(tab.path)"
        @keydown.space.prevent="onTabChange(tab.path)"
      >
        <span class="tab__title">{{ tab.title }}</span>
        <button
          v-if="!tabs.isFixed(tab.path)"
          type="button"
          class="tab__close"
          title="关闭标签"
          aria-label="关闭标签"
          @click.stop="onClose(tab.path)"
        >
          <el-icon><close /></el-icon>
        </button>
      </div>
    </div>

    <div class="tab-bar__actions">
      <button type="button" class="tab-action" title="刷新当前页" @click="refreshCurrent">
        <el-icon><refresh /></el-icon>
      </button>
      <button type="button" class="tab-action" title="重置标签" @click="tabs.reset()">
        <el-icon><refresh-left /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: var(--app-tabbar-height);
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-canvas);
}

.tab-bar__tabs {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-bar__tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  height: 26px;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--app-muted);
  cursor: default;
  font-size: 12px;
  white-space: nowrap;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.tab:hover {
  background: var(--app-surface-hover);
  color: var(--app-ink-soft);
}

.tab.is-active {
  border-color: var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  color: var(--app-ink);
}

.tab__close {
  display: flex;
  width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: currentColor;
  cursor: default;
  font-size: 10px;
  opacity: 0.55;
}

.tab__close:hover {
  background: var(--app-surface-hover);
  opacity: 1;
}

.tab.is-active .tab__close:hover {
  background: var(--app-surface-hover);
}

.tab-bar__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
}

.tab-action {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--app-muted);
  cursor: default;
  font-size: 13px;
}

.tab-action:hover {
  background: var(--app-surface-hover);
  color: var(--app-ink);
}
</style>
