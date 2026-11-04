<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_NAME } from '@shared/constants/app'
import { useAppStore } from '@renderer/stores/app'
import { useAuthStore } from '@renderer/stores/auth'
import { env } from '@renderer/env'
import BrandMark from '@renderer/components/chrome/brand-mark.vue'
import WindowControls from '@renderer/components/chrome/window-controls.vue'

const app = useAppStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta.title ?? '')
const displayName = computed(() => auth.session?.displayName ?? '已登录')
const initial = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')

async function onCommand(command: string | number | object): Promise<void> {
  if (command !== 'logout') return
  await auth.logout()
  try {
    if (window.api?.app?.showLogin) await window.api.app.showLogin()
    else await router.replace('/login')
  } catch {
    await router.replace('/login')
  }
}
</script>

<template>
  <header class="app-titlebar drag-region">
    <div class="app-titlebar__brand" :class="{ 'is-collapsed': app.sidebarCollapsed }">
      <brand-mark :size="20" />
      <span v-if="!app.sidebarCollapsed" class="app-titlebar__name">{{ APP_NAME }}</span>
      <span v-if="env.isDev && !app.sidebarCollapsed" class="app-titlebar__env">DEV</span>
    </div>

    <div class="app-titlebar__context">
      <span class="app-titlebar__crumb">工作区</span>
      <span class="app-titlebar__slash">/</span>
      <span class="app-titlebar__current">{{ title }}</span>
    </div>

    <div class="app-titlebar__spacer" />

    <div class="app-titlebar__tools no-drag">
      <button
        type="button"
        class="titlebar-action"
        :title="app.theme === 'dark' ? '切到亮色' : '切到暗色'"
        :aria-label="app.theme === 'dark' ? '切到亮色' : '切到暗色'"
        @click="app.toggleTheme()"
      >
        <svg v-if="app.theme === 'dark'" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <path
            d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9"
          />
        </svg>
        <svg v-else viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13.2 9.7A5.6 5.6 0 0 1 6.3 2.8 5.6 5.6 0 1 0 13.2 9.7Z" />
        </svg>
      </button>

      <el-dropdown
        v-if="auth.isAuthenticated && env.featureLogin"
        trigger="click"
        @command="onCommand"
      >
        <button type="button" class="app-titlebar__user" title="账户">
          <span class="app-titlebar__avatar">{{ initial }}</span>
          <span class="app-titlebar__username">{{ displayName }}</span>
          <svg class="app-titlebar__chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4.5 6.5 3.5 3 3.5-3" />
          </svg>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <div v-else-if="auth.isAuthenticated" class="app-titlebar__user is-static">
        <span class="app-titlebar__avatar">{{ initial }}</span>
        <span class="app-titlebar__username">{{ displayName }}</span>
      </div>
    </div>

    <window-controls minimize maximize />
  </header>
</template>

<style scoped>
.app-titlebar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: var(--app-titlebar-height);
  background: var(--app-titlebar);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--app-sidebar-ink);
}

.app-titlebar__brand {
  display: flex;
  align-items: center;
  gap: 9px;
  width: var(--app-sidenav-width);
  height: 100%;
  padding: 0 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: width 0.18s ease;
}

.app-titlebar__brand.is-collapsed {
  width: var(--app-sidenav-collapsed-width);
  justify-content: center;
  padding: 0;
}

.app-titlebar__name {
  overflow: hidden;
  color: var(--app-sidebar-ink-strong);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-titlebar__env {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.09);
  color: #d7dee9;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.app-titlebar__context {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-left: 16px;
  font-size: 12px;
  white-space: nowrap;
}

.app-titlebar__crumb {
  color: var(--app-sidebar-ink);
}

.app-titlebar__slash {
  color: rgba(255, 255, 255, 0.18);
}

.app-titlebar__current {
  color: var(--app-sidebar-ink-strong);
  font-weight: 500;
}

.app-titlebar__spacer {
  flex: 1;
}

.app-titlebar__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 8px;
}

.titlebar-action {
  display: flex;
  width: 30px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-sidebar-ink);
  cursor: default;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.titlebar-action svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.25;
}

.titlebar-action:hover {
  background: var(--app-sidebar-hover);
  color: var(--app-sidebar-ink-strong);
}

.app-titlebar__user {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-sidebar-ink-strong);
  cursor: default;
  transition: background-color 0.12s ease;
}

.app-titlebar__user:hover {
  background: var(--app-sidebar-hover);
}

.app-titlebar__user.is-static {
  padding-right: 10px;
}

.app-titlebar__avatar {
  display: inline-flex;
  width: 21px;
  height: 21px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(94, 211, 196, 0.16);
  color: #8ee6da;
  font-size: 10px;
  font-weight: 700;
}

.app-titlebar__username {
  max-width: 120px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-titlebar__chevron {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--app-sidebar-ink);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.3;
}
</style>
