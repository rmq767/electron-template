<script setup lang="ts">
import { APP_NAME } from '@shared/constants/app'
import IpcConsole from '@renderer/views/dev/IpcConsole.vue'
</script>

<template>
  <header class="app-header">
    <strong>{{ APP_NAME }}</strong>
    <span class="muted">主界面框架将在 Step 4 接入</span>
  </header>
  <IpcConsole />
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.muted {
  color: #6b7280;
  font-size: 12px;
}
</style>
