<script setup lang="ts">
import { ref } from 'vue'
import { columns } from './index'

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
  { id: 3, name: '访客', code: 'viewer', users: 87, description: '只读访问演示与列表' }
])

const rowConfig = { keyField: 'id' } as const
const detail = ref<RoleDTO | null>(null)
const visible = ref(false)

function onInspect(row: RoleDTO): void {
  detail.value = row
  visible.value = true
}
</script>

<template>
  <div class="view">
    <section class="panel panel--table">
      <my-table :columns="columns" :data="roles" :row-config="rowConfig">
        <template #name="{ row }">
          <span class="role-name">{{ row.name }}</span>
        </template>
        <template #code="{ row }">
          <span class="mono account">{{ row.code }}</span>
        </template>
        <template #action="{ row }">
          <el-button size="small" text type="primary" @click="onInspect(row)">详情</el-button>
        </template>
      </my-table>
    </section>

    <my-drawer v-model="visible" title="角色详情" :size="460">
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
