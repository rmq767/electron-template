import { ref, type Ref } from 'vue'
import type { VxeTableInstance } from 'vxe-table'

/**
 * 表格多选（含跨页保留），需配合 MyTable 的 checkbox-config.reserve 使用。
 * MyTable 暴露的 tableRef 就是 vxe-table 实例。
 */
export function useCheckboxSelection<T>(getTable: () => VxeTableInstance | undefined | null): {
  selectedRows: Ref<T[]>
  onCheckboxChange: () => void
  onCheckboxAll: () => void
  clearSelection: () => void
} {
  const selectedRows: Ref<T[]> = ref([])

  function syncSelectedRows(): void {
    const table = getTable()
    if (!table) {
      selectedRows.value = []
      return
    }
    selectedRows.value = [
      ...(table.getCheckboxRecords() as T[]),
      ...(table.getCheckboxReserveRecords(true) as T[])
    ]
  }

  function onCheckboxChange(): void {
    syncSelectedRows()
  }

  function onCheckboxAll(): void {
    syncSelectedRows()
  }

  function clearSelection(): void {
    selectedRows.value = []
    getTable()?.clearCheckboxRow()
    getTable()?.clearCheckboxReserve()
  }

  return { selectedRows, onCheckboxChange, onCheckboxAll, clearSelection }
}
