<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'

withDefaults(defineProps<{ minimize?: boolean; maximize?: boolean }>(), {
  minimize: true,
  maximize: false
})

const maximized = ref(false)
let unbind: (() => void) | null = null
let disposed = false

onMounted(async () => {
  if (!window.api?.window) return
  try {
    const state = await window.api.window.getState()
    maximized.value = state.maximized
  } catch {
    /* 浏览器预览没有宿主，静默即可 */
  }
  // getState 期间组件可能已经卸载，此时不能再挂监听
  if (disposed) return
  unbind = window.api.window.onState((state) => {
    maximized.value = state.maximized
  })
})

onScopeDispose(() => {
  disposed = true
  unbind?.()
})

function onMinimize(): void {
  void window.api?.window?.minimize?.().catch(() => {})
}

function toggleMaximize(): void {
  void window.api?.window
    ?.toggleMaximize?.()
    .then((next) => {
      maximized.value = next
    })
    .catch(() => {})
}

function closeSelf(): void {
  void window.api?.window?.closeSelf?.().catch(() => {})
}
</script>

<template>
  <div class="window-controls">
    <button
      v-if="minimize"
      type="button"
      class="window-control"
      title="最小化"
      aria-label="最小化"
      @click="onMinimize"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 8.5h9" />
      </svg>
    </button>
    <button
      v-if="maximize"
      type="button"
      class="window-control"
      :title="maximized ? '还原' : '最大化'"
      :aria-label="maximized ? '还原' : '最大化'"
      @click="toggleMaximize"
    >
      <svg v-if="maximized" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5.5 5.5V3.5h7v7h-2" />
        <rect x="3.5" y="5.5" width="7" height="7" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true">
        <rect x="3.5" y="3.5" width="9" height="9" rx="1" />
      </svg>
    </button>
    <button
      type="button"
      class="window-control window-control--close"
      title="关闭"
      aria-label="关闭"
      @click="closeSelf"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 4 8 8M12 4l-8 8" />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="scss">
.window-controls {
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-control {
  display: flex;
  width: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-sidebar-ink);
  cursor: default;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.window-control svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.2;
}

.window-control:hover {
  background: var(--app-chrome-hover);
  color: var(--app-chrome-hover-ink);
}

.window-control--close:hover {
  background: var(--app-danger-solid);
  color: var(--app-brand-ink);
}
</style>
