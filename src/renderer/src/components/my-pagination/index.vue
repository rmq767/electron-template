<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'my-pagination' })

const props = withDefaults(
  defineProps<{
    total: number
    page?: number
    size?: number
    pageSizes?: number[]
    layout?: string
    background?: boolean
  }>(),
  {
    page: 1,
    size: 20,
    pageSizes: () => [10, 20, 30, 50],
    layout: 'total, sizes, prev, pager, next, jumper',
    background: true
  }
)

const emit = defineEmits<{
  'update:page': [value: number]
  'update:size': [value: number]
  pagination: [payload: { page: number; size: number }]
}>()

const currentPage = computed({
  get: () => props.page,
  set: (value) => emit('update:page', value)
})

const currentSize = computed({
  get: () => props.size,
  set: (value) => emit('update:size', value)
})

function onChange(page: number, size: number): void {
  emit('pagination', { page, size })
}
</script>

<template>
  <div class="app-pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="currentSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      @change="onChange"
    />
  </div>
</template>

<style scoped lang="scss">
.app-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--app-border);
}
</style>
