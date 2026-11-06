<script setup lang="ts">
import { computed, ref } from 'vue'
import { VxeColumn, VxeTable } from 'vxe-table'
import type { VxeTableInstance } from 'vxe-table'
import type { VxeColumn as VxeColumnConfig } from '@renderer/types/common'

defineOptions({ name: 'my-table' })

const props = withDefaults(
  defineProps<{
    data: object[]
    columns?: VxeColumnConfig[]
    loading?: boolean
    seq?: boolean
    rowConfig?: Record<string, unknown>
  }>(),
  {
    columns: () => [],
    loading: false,
    seq: false,
    rowConfig: () => ({})
  }
)

const tableRef = ref<VxeTableInstance>()

const mergedRowConfig = computed(() => ({ isHover: true, ...props.rowConfig }))
/** 不引 vxe-tooltip：溢出用原生 title，避免运行期缺组件告警。 */
const tooltipConfig = { mode: 'title' } as const

const visibleColumns = computed(() =>
  (props.columns ?? [])
    .filter((column) => column.visible !== false)
    .map((column) => ({ ...column, align: column.align ?? ('center' as const) }))
)

/** 去掉封装专用字段，其余原样透传给 vxe-column；未声明的列默认开启溢出省略。 */
function getColumnBind(column: VxeColumnConfig): Record<string, unknown> {
  const { slot, visible, showOverflow, ...rest } = column
  void slot
  void visible
  return { ...rest, showOverflow: showOverflow ?? true }
}

defineExpose({ tableRef })
</script>

<template>
  <!-- loading 走 Element 指令：vxe 的加载面板要 vxe-pc-ui 的图标引导，模板没引那套 -->
  <vxe-table
    ref="tableRef"
    v-loading="loading"
    class="app-table"
    :data="data"
    :row-config="mergedRowConfig"
    :tooltip-config="tooltipConfig"
    :show-overflow="true"
    empty-text="暂无数据"
    border
    v-bind="$attrs"
  >
    <vxe-column v-if="seq" type="seq" title="序号" width="60" align="center" />
    <vxe-column
      v-for="(column, index) in visibleColumns"
      :key="column.field ?? `${column.type ?? 'column'}-${index}`"
      v-bind="getColumnBind(column)"
      min-width="100px"
    >
      <template v-if="column.slot" #default="{ row }">
        <slot :name="String(column.field)" :row="row" />
      </template>
    </vxe-column>
  </vxe-table>
</template>

<style scoped lang="scss">
.app-table {
  width: 100%;
}
</style>
