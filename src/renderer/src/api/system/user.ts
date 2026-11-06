import type { UserDTO, UserRow } from '@shared/types/user'
import {
  HttpStatus,
  type ApiResponse,
  type PageQuery,
  type PageResponse,
  type SearchFieldValue
} from '@renderer/types/common'

/**
 * 用户模块接口。当前是纯前端 mock：数据、过滤、分页都落在本文件，页面拿到的仍是同一套包络。
 * 接真实后端时逐函数换成 request()，页面、类型与竞态防护都不用动，mockDelay 一并删掉：
 *   request<PageResponse<UserRow>>({ url, method: 'get', params, signal })
 *   request<ApiResponse<UserRow>>({ url, method: value.id ? 'put' : 'post', data: value })
 *   request<ApiResponse>({ url, method: 'delete', data: ids })
 */

/** 列表查询参数：筛选字段直接来自搜索表单，未填的字段请求层会跳过。 */
export interface UserListParams extends PageQuery {
  name?: SearchFieldValue
  account?: SearchFieldValue
  role?: SearchFieldValue
}

/** mock 也留出可观测的加载态，好让 loading 与翻页竞态能被实测到。 */
const MOCK_LATENCY = 220

let users: UserRow[] = [
  { id: 1, name: '张伟', account: 'zhangwei', role: 'admin', remark: '系统管理员' },
  { id: 2, name: '李娜', account: 'lina', role: 'editor', remark: '内容运营' },
  { id: 3, name: '王强', account: 'wangqiang', role: 'viewer', remark: '只读账号' },
  { id: 4, name: '陈默', account: 'chenmo', role: 'editor', remark: '数据分析' },
  { id: 5, name: '刘洋', account: 'liuyang', role: 'viewer' },
  { id: 6, name: '赵敏', account: 'zhaomin', role: 'admin', remark: '权限管理员' },
  { id: 7, name: '孙晨', account: 'sunchen', role: 'editor' },
  { id: 8, name: '周婷', account: 'zhouting', role: 'viewer', remark: '外部协作' },
  { id: 9, name: '吴楠', account: 'wunan', role: 'editor', remark: '审核编辑' },
  { id: 10, name: '郑浩', account: 'zhenghao', role: 'viewer' },
  { id: 11, name: '冯雪', account: 'fengxue', role: 'editor', remark: '内容审核' },
  { id: 12, name: '许峰', account: 'xufeng', role: 'admin', remark: '运维管理员' }
]

let nextId = Math.max(...users.map((user) => user.id)) + 1

/** 与 fetch 一样尊重取消，页面不必区分数据来自 mock 还是后端。 */
function mockDelay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    function cancel(): void {
      clearTimeout(timer)
      reject(new DOMException('请求已取消', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel)
      resolve()
    }, MOCK_LATENCY)
    if (signal) {
      signal.addEventListener('abort', cancel, { once: true })
      if (signal.aborted) cancel()
    }
  })
}

function keyword(value: SearchFieldValue): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function ok<T>(data: T): ApiResponse<T> {
  return { code: HttpStatus.SUCCESS, msg: '操作成功', data }
}

function pageOk<T>(rows: T[], total: number): PageResponse<T> {
  return { code: HttpStatus.SUCCESS, msg: '操作成功', rows, total }
}

export async function getUserListApi(
  params: UserListParams,
  signal?: AbortSignal
): Promise<PageResponse<UserRow>> {
  await mockDelay(signal)

  const name = keyword(params.name)
  const account = keyword(params.account)
  const role = typeof params.role === 'string' ? params.role : ''

  const filtered = users.filter((user) => {
    const matchName = !name || user.name.toLowerCase().includes(name)
    const matchAccount = !account || user.account.toLowerCase().includes(account)
    const matchRole = !role || user.role === role
    return matchName && matchAccount && matchRole
  })

  const start = (params.pageNum - 1) * params.pageSize
  return pageOk(filtered.slice(start, start + params.pageSize), filtered.length)
}

/** 新增与编辑共用一个入口：有 id 视为更新。 */
export async function saveUserApi(value: UserDTO): Promise<ApiResponse<UserRow>> {
  await mockDelay()

  const index = users.findIndex((user) => user.id === value.id)
  if (index >= 0) {
    const row: UserRow = { ...value, id: users[index].id }
    users[index] = row
    return ok(row)
  }

  const row: UserRow = { ...value, id: nextId++ }
  users = [row, ...users]
  return ok(row)
}

/** 单个 id 与 id 数组共用一个入口，批量删除时不必再加接口。 */
export async function deleteUserApi(ids: number | number[]): Promise<ApiResponse> {
  await mockDelay()

  const targets = new Set(Array.isArray(ids) ? ids : [ids])
  users = users.filter((user) => !targets.has(user.id))
  return ok(null)
}
