import type { VxeColumn } from '@renderer/types/common'

export const columns: VxeColumn[] = [
  { field: 'name', title: '姓名', minWidth: 120 },
  { field: 'account', title: '账号', minWidth: 150, slot: true },
  { field: 'role', title: '角色', width: 110, slot: true },
  { field: 'remark', title: '备注', minWidth: 220, slot: true },
  { field: 'action', title: '操作', width: 140, fixed: 'right', slot: true }
]
