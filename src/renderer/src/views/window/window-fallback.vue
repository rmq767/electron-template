<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import WindowShell from '@renderer/components/chrome/window-shell.vue'

defineOptions({ name: 'window-fallback' })

const route = useRoute()
const kind = computed(() => {
  const fromQuery = route.query.kind
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery
  return window.api?.window?.self?.kind ?? ''
})

function closeSelf(): void {
  void window.api?.window?.closeSelf?.().catch(() => {})
}
</script>

<template>
  <window-shell title="窗口未就绪" :subtitle="kind">
    <el-result
      icon="warning"
      title="窗口路由未登记"
      :sub-title="
        kind
          ? `未找到 /w/${kind} 对应的页面，请按 DESIGN.md 的配方补一条路由与页面。`
          : '未找到当前窗口对应的页面，请按 DESIGN.md 的配方补一条路由与页面。'
      "
    >
      <template #extra>
        <el-button type="primary" @click="closeSelf">关闭窗口</el-button>
      </template>
    </el-result>
  </window-shell>
</template>
