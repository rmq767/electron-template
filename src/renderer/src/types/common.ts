import type { VxeColumnProps } from 'vxe-table'

/** 表单容器模式：统一用 as const，不在项目里使用 enum。 */
export const FormType = {
  ADD: 'add',
  EDIT: 'edit'
} as const

export type FormType = (typeof FormType)[keyof typeof FormType]

export interface OptionItem {
  value: string | number
  label: string
  disabled?: boolean
}

/** 搜索表单的值域：input 为 string，select 为 string/number，date-range 为 string[]。 */
export type SearchFieldValue = string | number | string[] | undefined
export type SearchForm = Record<string, SearchFieldValue>

/** MySearch 的筛选配置。 */
export interface FilterItem {
  type: 'input' | 'select' | 'date-picker' | 'date-range' | 'slot'
  label: string
  prop: string
  placeholder?: string
  /** type === 'select' */
  options?: OptionItem[]
  /** type === 'date-picker' */
  pickerType?: 'year' | 'month' | 'date'
  valueFormat?: string
  /** type === 'date-range' 拆分后的参数名，默认 `${prop}_start` / `${prop}_end` */
  startName?: string
  endName?: string
  /** type === 'slot'，默认取 prop 作为插槽名 */
  slot?: string
}

/** MyTable 的列配置：vxe 原生列属性 + 插槽/显隐开关。 */
export interface VxeColumn extends VxeColumnProps {
  slot?: boolean
  visible?: boolean
}

/** 后端响应码。页面判 code 用常量，不写死数字。 */
export const HttpStatus = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus]

/** 普通接口包络；data 缺省为 null，删除/操作类接口可直接标注 ApiResponse。 */
export interface ApiResponse<T = null> {
  code: number
  msg: string
  data: T
}

/** 列表接口包络：分页数据在 rows，总数在 total。 */
export interface PageResponse<T> {
  code: number
  msg: string
  rows: T[]
  total: number
}

/** 列表查询参数基类型：分页字段必填，排序字段按需带上。 */
export interface PageQuery {
  pageNum: number
  pageSize: number
  orderByColumn?: string
  isAsc?: string
}
