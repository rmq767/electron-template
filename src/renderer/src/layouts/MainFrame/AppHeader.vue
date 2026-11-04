<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold, Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@renderer/stores/app'
import { useAuthStore } from '@renderer/stores/auth'
import { env } from '@renderer/env'

const app = useAppStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const envLabel = computed(() => (env.isDev ? 'DEV' : undefined))
const title = computed(() => route.meta.title ?? '')

async function onCommand(command: string | number | object): Promise<void> {
  if (command !== 'logout') return
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <header class="app-header">
    <el-button text :icon="app.sidebarCollapsed ? Expand : Fold" @click="app.toggleSidebar()" />
    <h1 class="app-header__title">{{ title }}</h1>
    <div class="app-header__spacer" />
    <el-tag v-if="envLabel" type="warning" size="small" effect="plain">{{ envLabel }}</el-tag>
    <el-button
      text
      :icon="app.theme === 'dark' ? Sunny : Moon"
      :title="app.theme === 'dark' ? '切到亮色' : '切到暗色'"
      @click="app.toggleTheme()"
    />
    <el-dropdown v-if="auth.isAuthenticated" trigger="click" @command="onCommand">
      <span class="app-header__user">
        {{ auth.session?.displayName ?? '已登录' }}
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--app-header-height);
  padding: 0 12px 0 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.app-header__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.app-header__spacer {
  flex: 1;
}
.app-header__user {
  font-size: 13px;
  cursor: pointer;
  color: var(--el-text-color-regular);
}
</style>
