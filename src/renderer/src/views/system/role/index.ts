import type { VxeColumn } from '@renderer/types/common'

export const columns: VxeColumn[] = [
  { field: 'name', title: '角色', minWidth: 140, slot: true },
  { field: 'code', title: '编码', minWidth: 150, slot: true },
  { field: 'description', title: '说明', minWidth: 240 },
  { field: 'users', title: '人数', width: 100 },
  { field: 'action', title: '操作', width: 100, fixed: 'right', slot: true }
]
