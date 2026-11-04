<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import MyDialog from '@renderer/components/base/MyDialog.vue'
import UserForm from './components/UserForm.vue'
import { useDialog } from '@renderer/composables/useDialog'
import { confirmAction } from '@renderer/composables/confirmAction'

defineOptions({ name: 'SystemUser' })

/** 纯前端 mock 数据：模板不带后端，接真实接口时替换 load() 即可。 */
const seed: UserDTO[] = [
  { id: 1, name: '张伟', account: 'zhangwei', role: 'admin', remark: '系统管理员' },
  { id: 2, name: '李娜', account: 'lina', role: 'editor' },
  { id: 3, name: '王强', account: 'wangqiang', role: 'viewer' }
]

const list = ref<UserDTO[]>([])
const formRef = ref<InstanceType<typeof UserForm> | null>(null)

const dialog = useDialog<UserDTO>({ onRefresh: () => void load() })

function load(): void {
  list.value = [...seed]
}

function onCreate(): void {
  dialog.open(undefined)
}

function onEdit(row: UserDTO): void {
  dialog.open(row)
}

async function onConfirm(): Promise<void> {
  const value = await formRef.value?.submit()
  if (!value) return
  if (value.id) {
    const index = list.value.findIndex((item) => item.id === value.id)
    if (index >= 0) list.value[index] = value
  } else {
    list.value.push({ ...value, id: Math.max(0, ...list.value.map((i) => i.id ?? 0)) + 1 })
  }
  ElMessage.success('已保存')
  dialog.close(true)
}

function onCancel(): void {
  formRef.value?.cancel()
  dialog.close()
}

async function onDelete(row: UserDTO): Promise<void> {
  const ok = await confirmAction(`确定删除「${row.name}」吗？`, {
    danger: true,
    confirmText: '删除'
  })
  if (!ok) return
  list.value = list.value.filter((item) => item.id !== row.id)
  ElMessage.success('已删除')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page__toolbar">
      <el-button type="primary" @click="onCreate">新增用户</el-button>
      <span class="muted">共 {{ list.length }} 条</span>
    </div>

    <el-table :data="list" border stripe>
      <el-table-column type="index" label="#" width="56" />
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="account" label="账号" min-width="140" />
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{
            row.role === 'admin' ? '管理员' : row.role === 'editor' ? '编辑' : '访客'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="onEdit(row)">编辑</el-button>
          <el-button size="small" text type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <MyDialog
      v-model="dialog.visible.value"
      :title="dialog.payload.value ? '编辑用户' : '新增用户'"
      :loading="dialog.loading.value"
      @confirm="onConfirm"
      @cancel="onCancel"
    >
      <UserForm
        ref="formRef"
        :mode="dialog.payload.value ? 'edit' : 'create'"
        :model="dialog.payload.value"
      />
    </MyDialog>
  </div>
</template>

<style scoped>
.page__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
