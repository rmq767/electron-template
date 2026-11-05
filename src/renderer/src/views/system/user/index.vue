<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { UserDTO } from '@shared/types/user'
import { FormType, type FilterItem, type SearchFieldValue } from '@renderer/types/common'
import { useSearchFilter } from '@renderer/composables/useSearchFilter'
import { useListPage } from '@renderer/composables/useListPage'
import { useActivatedRefresh } from '@renderer/composables/useActivatedRefresh'
import { confirmAction } from '@renderer/composables/confirmAction'
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

/** 纯前端 mock 数据：接真实接口时把 getList 换成 API 调用即可。 */
const allUsers = ref<UserDTO[]>([
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
])

const rows = ref<UserDTO[]>([])
const total = ref(0)
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const rowConfig = { keyField: 'id' } as const
const formDialogRef = ref<InstanceType<typeof FormDialog> | null>(null)

function searchText(value: SearchFieldValue): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function getList(): void {
  const name = searchText(formData.value.name)
  const account = searchText(formData.value.account)
  const role = typeof formData.value.role === 'string' ? formData.value.role : ''

  const filtered = allUsers.value.filter((user) => {
    const matchName = !name || user.name.toLowerCase().includes(name)
    const matchAccount = !account || user.account.toLowerCase().includes(account)
    const matchRole = !role || user.role === role
    return matchName && matchAccount && matchRole
  })

  total.value = filtered.length
  const maxPage = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  if (pagination.pageNum > maxPage) pagination.pageNum = maxPage
  const start = (pagination.pageNum - 1) * pagination.pageSize
  rows.value = filtered.slice(start, start + pagination.pageSize)
}

const { onSearch, onReset, onPagination } = useListPage({ getList, pagination })

function handleAdd(): void {
  formDialogRef.value?.open(FormType.ADD)
}

function handleEdit(row: UserDTO): void {
  formDialogRef.value?.open(FormType.EDIT, row)
}

function handleSaved(value: UserDTO): void {
  const index = allUsers.value.findIndex((user) => user.id === value.id)
  if (index >= 0) {
    allUsers.value[index] = value
  } else {
    const nextId = Math.max(0, ...allUsers.value.map((user) => user.id ?? 0)) + 1
    allUsers.value.unshift({ ...value, id: nextId })
    pagination.pageNum = 1
  }
  getList()
  ElMessage.success('已保存')
}

async function handleDelete(row: UserDTO): Promise<void> {
  const ok = await confirmAction(`确定删除「${row.name}」吗？`, {
    danger: true,
    confirmText: '删除'
  })
  if (!ok) return
  allUsers.value = allUsers.value.filter((user) => user.id !== row.id)
  getList()
  ElMessage.success('已删除')
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
      <my-table :columns="columns" :data="rows" :seq="true" :row-config="rowConfig">
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
