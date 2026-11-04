<script setup lang="ts">
import { APP_NAME } from '@shared/constants/app'
import BrandMark from './brand-mark.vue'
import WindowControls from './window-controls.vue'

withDefaults(defineProps<{ title?: string; minimize?: boolean }>(), {
  title: APP_NAME,
  minimize: true
})
</script>

<template>
  <header class="window-brand-bar drag-region">
    <brand-mark :size="17" />
    <span class="window-brand-bar__title">{{ title }}</span>
    <div class="window-brand-bar__spacer" />
    <window-controls :minimize="minimize" />
  </header>
</template>

<style scoped>
.window-brand-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: var(--app-titlebar-height);
  padding-left: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--app-titlebar);
}

.window-brand-bar__title {
  overflow: hidden;
  color: var(--app-sidebar-ink-strong);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-brand-bar__spacer {
  flex: 1;
}
</style>
