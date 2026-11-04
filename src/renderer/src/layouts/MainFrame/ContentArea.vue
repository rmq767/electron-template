<script setup lang="ts">
import { computed } from 'vue'
import { useTabsStore } from '@renderer/stores/tabs'

const tabs = useTabsStore()
const cached = computed(() => tabs.cachedNames)
</script>

<template>
  <main class="content-area">
    <RouterView v-slot="{ Component, route }">
      <keep-alive :include="cached">
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </RouterView>
  </main>
</template>

<style scoped>
.content-area {
  flex: 1;
  padding: 12px;
  overflow: auto;
  background: var(--app-content-bg);
}
</style>
