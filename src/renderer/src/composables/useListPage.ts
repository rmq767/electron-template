export interface PaginationState {
  pageNum: number
  pageSize: number
}

export interface SortState {
  orderByColumn: string
  isAsc: string
}

interface PaginationEvent {
  page: number
  size: number
}

interface SortEvent {
  field: string
  order: string
}

/**
 * 列表页通用事件：搜索/重置时回到第一页，分页与排序变化后重新取数。
 * 数据加载函数保持单一名字（getList），页面调用点不需要区分来源。
 */
export function useListPage(options: {
  getList: () => void
  pagination?: PaginationState
  sort?: SortState
}): {
  onSearch: () => void
  onReset: (resetForm: () => void) => void
  onPagination: (payload: { page: number; size: number }) => void
  sortChange: (payload: { field: string; order: string }) => void
} {
  const { getList, pagination, sort } = options

  function onSearch(): void {
    if (pagination) pagination.pageNum = 1
    getList()
  }

  function onReset(resetForm: () => void): void {
    resetForm()
    if (pagination) pagination.pageNum = 1
    getList()
  }

  function onPagination({ page, size }: PaginationEvent): void {
    if (!pagination) return
    pagination.pageNum = page
    pagination.pageSize = size
    getList()
  }

  function sortChange({ field, order }: SortEvent): void {
    if (!sort) return
    sort.orderByColumn = field
    sort.isAsc = order
    getList()
  }

  return { onSearch, onReset, onPagination, sortChange }
}
