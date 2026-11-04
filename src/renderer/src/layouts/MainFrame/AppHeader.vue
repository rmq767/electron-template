<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Expand, Fold, Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@renderer/stores/app'

const app = useAppStore()
const route = useRoute()

const envLabel = computed(() => (import.meta.env.DEV ? 'DEV' : undefined))
const title = computed(() => route.meta.title ?? '')
</script>

<template>
  <header class="app-header">
    <el-button text :icon="app.sidebarCollapsed ? Expand : Fold" @click="app.toggleSidebar()" />
    <h1 class="app-header__title">{{ title }}</h1>
    <div class="app-header__spacer" />
    <el-tag v-if="envLabel" type="warning" size="small" effect="plain">{{ envLabel }}</el-tag>
    <el-button
      text
      :icon="app.theme === 'dark' ? Sunny : Moon"
      :title="app.theme === 'dark' ? '切到亮色' : '切到暗色'"
      @click="app.toggleTheme()"
    />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--app-header-height);
  padding: 0 12px 0 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.app-header__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.app-header__spacer {
  flex: 1;
}
</style>
