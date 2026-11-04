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

<style scoped>
.brand-mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #3aa899 0%, #0f766e 58%, #0a4f4a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    0 2px 8px rgba(15, 118, 110, 0.3);
  color: #fff;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}
</style>
