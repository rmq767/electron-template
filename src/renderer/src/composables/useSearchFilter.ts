import { ref, type Ref } from 'vue'
import type { FilterItem, SearchForm } from '@renderer/types/common'

/** 按筛选配置生成表单初值：date-range 初始为数组，其余为空。 */
export function useSearchFilter(filters: FilterItem[]): {
  formData: Ref<SearchForm>
  filters: FilterItem[]
} {
  const formData = ref<SearchForm>(
    Object.fromEntries(
      filters.map((item) => [item.prop, item.type === 'date-range' ? [] : undefined])
    )
  )

  return { formData, filters }
}

/**
 * 表单值转接口参数：date-range 拆成 ${prop}_start / ${prop}_end，
 * 支持 startName / endName 覆盖默认名称；其余字段原样保留。
 */
export function toApiParams(formData: SearchForm, filters: FilterItem[]): SearchForm {
  const hasDateRange = filters.some((item) => item.type === 'date-range')
  if (!hasDateRange) return { ...formData }

  const params: SearchForm = {}
  for (const item of filters) {
    const value = formData[item.prop]
    if (item.type === 'date-range' && Array.isArray(value)) {
      params[item.startName ?? `${item.prop}_start`] = value[0]
      params[item.endName ?? `${item.prop}_end`] = value[1]
    } else {
      params[item.prop] = value
    }
  }
  return params
}
