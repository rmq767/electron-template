<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { UserDTO, UserRow } from '@shared/types/user'
import { FormType, HttpStatus, type FilterItem } from '@renderer/types/common'
import { useSearchFilter } from '@renderer/composables/useSearchFilter'
import { useListPage } from '@renderer/composables/useListPage'
import { useActivatedRefresh } from '@renderer/composables/useActivatedRefresh'
import { useAbortableRequest } from '@renderer/composables/useAbortableRequest'
import { confirmAction } from '@renderer/composables/confirmAction'
import {
  deleteUserApi,
  getUserListApi,
  saveUserApi,
  type UserListParams
} from '@renderer/api/system/user'
import FormDialog from './components/form-dialog.vue'
import { columns } from './index'

defineOptions({ name: 'system-user' })

const roleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '编辑' },
  { value: 'viewer', label: '访客' }
]

const filters: FilterItem[] = [
  { type: 'input', label: '姓名', prop: 'name' },
  { type: 'input', label: '账号', prop: 'account' },
  { type: 'select', label: '角色', prop: 'role', options: roleOptions }
]

const { formData } = useSearchFilter(filters)

const pagination = reactive({ pageNum: 1, pageSize: 10 })
/** 单一数据源：筛选条件 + 分页；有 date-range 时改用 toApiParams 拆分。 */
const queryParams = computed<UserListParams>(() => ({ ...formData.value, ...pagination }))

const rows = ref<UserRow[]>([])
const total = ref(0)
const loading = ref(false)
const rowConfig = { keyField: 'id' } as const
const formDialogRef = ref<InstanceType<typeof FormDialog> | null>(null)

const { runWithLoading } = useAbortableRequest()

/** 统一错误出口：既落主进程日志，也给用户可见反馈。取消不会走到这里。 */
function reportError(err: unknown, fallback: string): void {
  const message = err instanceof Error ? err.message : fallback
  window.api?.log?.error('用户模块操作失败', { message })
  ElMessage.error(message || fallback)
}

/** 数据加载函数保持单一名字，调用点不区分来源；取消与 loading 由 runWithLoading 接管。 */
async function getList(): Promise<void> {
  try {
    const res = await runWithLoading(loading, (signal) => getUserListApi(queryParams.value, signal))
    if (!res) return
    if (res.code !== HttpStatus.SUCCESS) {
      ElMessage.error(res.msg || '加载用户列表失败')
      return
    }
    rows.value = res.rows
    total.value = res.total
  } catch (err) {
    reportError(err, '加载用户列表失败')
  }
}

const { onSearch, onReset, onPagination } = useListPage({ getList, pagination })

function handleAdd(): void {
  formDialogRef.value?.open(FormType.ADD)
}

function handleEdit(row: UserRow): void {
  formDialogRef.value?.open(FormType.EDIT, row)
}

async function handleSaved(value: UserDTO): Promise<void> {
  try {
    const res = await saveUserApi(value)
    if (res.code !== HttpStatus.SUCCESS) {
      ElMessage.error(res.msg || '保存失败')
      return
    }
    // 新增落到列表顶部，回到第一页才不会看不见
    if (!value.id) pagination.pageNum = 1
    await getList()
    ElMessage.success('已保存')
    // 保存成功后再关弹窗；失败时保留输入
    formDialogRef.value?.close()
  } catch (err) {
    reportError(err, '保存用户失败')
  }
}

async function handleDelete(row: UserRow): Promise<void> {
  const ok = await confirmAction(`确定删除「${row.name}」吗？`, {
    danger: true,
    confirmText: '删除'
  })
  if (!ok) return
  try {
    const res = await deleteUserApi(row.id)
    if (res.code !== HttpStatus.SUCCESS) {
      ElMessage.error(res.msg || '删除失败')
      return
    }
    ElMessage.success('已删除')
    // 远程分页不会自己回退页码，删掉本页最后一条时往前退一页
    if (rows.value.length <= 1 && pagination.pageNum > 1) pagination.pageNum -= 1
    await getList()
  } catch (err) {
    reportError(err, '删除用户失败')
  }
}

function roleLabel(role: UserDTO['role']): string {
  return role === 'admin' ? '管理员' : role === 'editor' ? '编辑' : '访客'
}

function roleTagType(role: UserDTO['role']): 'warning' | 'success' | 'info' {
  return role === 'admin' ? 'warning' : role === 'editor' ? 'success' : 'info'
}

onMounted(getList)
useActivatedRefresh(getList)
</script>

<template>
  <div class="view">
    <my-search :filters="filters" :form-data="formData" @search="onSearch" @reset="onReset">
      <el-button :icon="Plus" type="primary" @click="handleAdd">新增用户</el-button>
    </my-search>

    <section class="panel panel--table">
      <my-table
        :columns="columns"
        :data="rows"
        :loading="loading"
        :seq="true"
        :row-config="rowConfig"
      >
        <template #account="{ row }">
          <span class="mono account">{{ row.account }}</span>
        </template>
        <template #role="{ row }">
          <el-tag size="small" effect="plain" :type="roleTagType(row.role)">
            {{ roleLabel(row.role) }}
          </el-tag>
        </template>
        <template #remark="{ row }">
          <span :class="{ muted: !row.remark }">{{ row.remark || '未填写' }}</span>
        </template>
        <template #action="{ row }">
          <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </my-table>

      <my-pagination
        v-model:page="pagination.pageNum"
        v-model:size="pagination.pageSize"
        :total="total"
        @pagination="onPagination"
      />
    </section>

    <form-dialog ref="formDialogRef" @success="handleSaved" />
  </div>
</template>

<style scoped lang="scss">
.panel--table {
  overflow: hidden;
}

.account {
  color: var(--app-ink-soft);
}
</style>
