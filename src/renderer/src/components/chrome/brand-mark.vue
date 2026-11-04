<script setup lang="ts">
import { APP_INITIAL, APP_NAME } from '@shared/constants/app'

withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>

<template>
  <span
    class="brand-mark"
    role="img"
    :aria-label="APP_NAME"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${Math.round(size * 0.28)}px`,
      fontSize: `${Math.round(size * 0.44)}px`
    }"
  >
    {{ APP_INITIAL }}
  </span>
</template>

<style scoped lang="scss">
.brand-mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: var(--app-brand-gradient);
  box-shadow: var(--app-brand-inset), var(--app-brand-shadow);
  color: var(--app-brand-ink);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}
</style>
