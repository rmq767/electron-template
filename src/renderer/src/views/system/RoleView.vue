<script setup lang="ts">
import { ref } from 'vue'
import MyDrawer from '@renderer/components/base/MyDrawer.vue'

defineOptions({ name: 'SystemRole' })

interface RoleDTO {
  id: number
  name: string
  code: string
  users: number
}

const roles = ref<RoleDTO[]>([
  { id: 1, name: '管理员', code: 'admin', users: 3 },
  { id: 2, name: '编辑', code: 'editor', users: 12 },
  { id: 3, name: '访客', code: 'viewer', users: 87 }
])

const detail = ref<RoleDTO | null>(null)
const visible = ref(false)

function onInspect(row: RoleDTO): void {
  detail.value = row
  visible.value = true
}
</script>

<template>
  <div class="page">
    <el-alert
      title="详情用 MyDrawer：内容较长、需要侧向参照时优先抽屉而不是弹窗"
      type="info"
      :closable="false"
      show-icon
      class="page__hint"
    />

    <el-table :data="roles" border stripe>
      <el-table-column prop="name" label="角色" min-width="120" />
      <el-table-column prop="code" label="编码" min-width="120" />
      <el-table-column prop="users" label="人数" width="100" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="onInspect(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <MyDrawer v-model="visible" title="角色详情" :show-footer="false" :size="480">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="角色">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="编码">{{ detail.code }}</el-descriptions-item>
        <el-descriptions-item label="人数">{{ detail.users }}</el-descriptions-item>
      </el-descriptions>
    </MyDrawer>
  </div>
</template>

<style scoped>
.page__hint {
  margin-bottom: 12px;
}
</style>
