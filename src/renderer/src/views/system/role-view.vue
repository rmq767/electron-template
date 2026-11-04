<script setup lang="ts">
import { computed, ref } from 'vue'
import MyDrawer from '@renderer/components/base/my-drawer.vue'

defineOptions({ name: 'system-role' })

interface RoleDTO {
  id: number
  name: string
  code: string
  users: number
  description: string
}

const roles = ref<RoleDTO[]>([
  { id: 1, name: '管理员', code: 'admin', users: 3, description: '全部菜单与系统设置' },
  { id: 2, name: '编辑', code: 'editor', users: 12, description: '业务数据读写，不含系统设置' },
  { id: 3, name: '访客', code: 'viewer', users: 87, description: '只读访问概览与列表' }
])

const detail = ref<RoleDTO | null>(null)
const visible = ref(false)

const totalUsers = computed(() => roles.value.reduce((sum, role) => sum + role.users, 0))

function onInspect(row: RoleDTO): void {
  detail.value = row
  visible.value = true
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">System</p>
        <h1>角色管理</h1>
        <p>详情内容较长、需要侧向参照时用抽屉而不是弹窗；这是 dialog 与 drawer 的分工示例。</p>
      </div>
      <div class="view-head__actions">
        <span class="muted">共 {{ totalUsers }} 个授权关系</span>
      </div>
    </header>

    <section class="panel panel--table">
      <header class="panel__head">
        <div>
          <h2 class="panel__title">角色列表</h2>
          <p class="panel__desc">内置三个角色，点击详情查看抽屉形态</p>
        </div>
        <el-tag size="small" effect="plain" type="info">{{ roles.length }} 个角色</el-tag>
      </header>

      <div class="panel__body panel__body--flush">
        <el-table :data="roles" row-key="id">
          <el-table-column prop="name" label="角色" min-width="140">
            <template #default="{ row }">
              <span class="role-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="编码" min-width="140">
            <template #default="{ row }">
              <span class="mono account">{{ row.code }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="240" />
          <el-table-column prop="users" label="人数" width="100" align="right" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="onInspect(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <my-drawer v-model="visible" title="角色详情" :show-footer="false" :size="460">
      <div v-if="detail" class="role-detail">
        <div class="role-detail__hero">
          <span class="role-detail__badge">{{ detail.name.charAt(0) }}</span>
          <div>
            <h3>{{ detail.name }}</h3>
            <p class="mono">{{ detail.code }}</p>
          </div>
        </div>

        <div class="detail-list">
          <div class="detail-row">
            <span>角色名称</span>
            <strong>{{ detail.name }}</strong>
          </div>
          <div class="detail-row">
            <span>角色编码</span>
            <strong class="mono">{{ detail.code }}</strong>
          </div>
          <div class="detail-row">
            <span>授权人数</span>
            <strong>{{ detail.users }} 人</strong>
          </div>
          <div class="detail-row">
            <span>权限说明</span>
            <strong>{{ detail.description }}</strong>
          </div>
        </div>

        <p class="role-detail__hint">
          抽屉样式只有一份：my-drawer 与 my-dialog 共用 styles/element-theme.scss。
        </p>
      </div>
    </my-drawer>
  </div>
</template>

<style scoped lang="scss">
.panel--table {
  overflow: hidden;
}

.role-name {
  color: var(--app-ink);
  font-weight: 500;
}

.account {
  color: var(--app-ink-soft);
}

.role-detail {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.role-detail__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-muted);
}

.role-detail__badge {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 18px;
  font-weight: 650;
}

.role-detail__hero h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.role-detail__hero p {
  margin: 3px 0 0;
  color: var(--app-muted);
}

.detail-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--app-border);
}

.detail-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border);
  font-size: 12.5px;
}

.detail-row span {
  color: var(--app-muted);
}

.detail-row strong {
  color: var(--app-ink);
  font-weight: 500;
  text-align: right;
}

.role-detail__hint {
  margin: 0;
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.65;
}
</style>
