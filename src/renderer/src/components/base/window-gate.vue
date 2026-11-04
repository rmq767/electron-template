<script setup lang="ts">
defineOptions({ name: 'window-gate' })

withDefaults(defineProps<{ ready: boolean; error?: string; rows?: number }>(), {
  error: '',
  rows: 6
})
</script>

<template>
  <div class="window-gate">
    <el-skeleton v-if="!ready && !error" :rows="rows" animated class="window-gate__skeleton" />
    <el-alert v-else-if="error" :title="error" type="error" :closable="false" show-icon />
    <slot v-else />
  </div>
</template>

<style scoped>
.window-gate__skeleton {
  padding: 16px;
}
</style>
