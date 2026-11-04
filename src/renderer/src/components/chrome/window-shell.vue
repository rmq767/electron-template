<script setup lang="ts">
import WindowControls from './window-controls.vue'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    minimize?: boolean
    maximize?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    minimize: false,
    maximize: false
  }
)
</script>

<template>
  <div class="window-shell">
    <header class="window-shell__bar drag-region">
      <span class="window-shell__title">{{ title }}</span>
      <span v-if="subtitle" class="window-shell__subtitle">{{ subtitle }}</span>
      <div class="window-shell__spacer" />
      <window-controls :minimize="minimize" :maximize="maximize" />
    </header>
    <main class="window-shell__body">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="window-shell__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped lang="scss">
.window-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--app-canvas);
  color: var(--app-ink);
}

.window-shell__bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: var(--app-titlebar-height);
  padding-left: 16px;
  background: var(--app-titlebar);
  border-bottom: 1px solid var(--app-chrome-divider);
  color: var(--app-sidebar-ink);
}

.window-shell__title {
  color: var(--app-sidebar-ink-strong);
  font-size: 12.5px;
  font-weight: 600;
}

.window-shell__subtitle {
  color: var(--app-sidebar-ink);
  font-size: 11.5px;
}

.window-shell__spacer {
  flex: 1;
}

.window-shell__body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.window-shell__footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface);
}
</style>
