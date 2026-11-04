<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTabsStore } from '@renderer/stores/tabs'

const router = useRouter()
const tabs = useTabsStore()

function onTabChange(path: string | number): void {
  const target = String(path)
  if (target !== router.currentRoute.value.path) void router.push(target)
}

function onClose(path: string | number): void {
  const target = String(path)
  const next = tabs.remove(target)
  if (next) void router.push(next)
}

function refreshCurrent(): void {
  void router.replace({ path: router.currentRoute.value.fullPath })
}
</script>

<template>
  <div class="tab-bar">
    <el-tabs
      :model-value="tabs.activePath"
      type="card"
      closable
      @update:model-value="onTabChange"
      @tab-remove="onClose"
    >
      <el-tab-pane v-for="tab in tabs.tabs" :key="tab.path" :name="tab.path" :label="tab.title" />
    </el-tabs>
    <div class="tab-bar__actions">
      <el-button size="small" text @click="refreshCurrent">刷新</el-button>
      <el-button size="small" text @click="tabs.reset()">重置标签</el-button>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--app-tabs-height);
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--app-content-bg);
}
.tab-bar :deep(.el-tabs__header) {
  margin: 0;
}
.tab-bar :deep(.el-tabs__item) {
  height: 26px;
  line-height: 26px;
  font-size: 12px;
}
.tab-bar__actions {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
