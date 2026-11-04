<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'
import { HomeFilled, Setting, User, UserFilled } from '@element-plus/icons-vue'
import { APP_NAME } from '@shared/constants/app'
import { useAppStore } from '@renderer/stores/app'
import { menuRoutes } from '@renderer/router/routes'

const app = useAppStore()
const route = useRoute()

const icons: Record<string, Component> = {
  Home: HomeFilled,
  SystemUser: User,
  SystemRole: UserFilled,
  SystemSettings: Setting
}

const items = computed(() =>
  (menuRoutes ?? [])
    .filter((child) => child.name && child.name !== 'DevIpc')
    .map((child) => ({
      index: `/${String(child.path)}`.replace(/\/{2,}/g, '/'),
      title: child.meta?.title ?? String(child.path),
      icon: icons[String(child.name)]
    }))
)
</script>

<template>
  <aside class="sidenav" :class="{ 'sidenav--collapsed': app.sidebarCollapsed }">
    <div class="sidenav__brand">
      <span v-if="!app.sidebarCollapsed">{{ APP_NAME }}</span>
      <span v-else>ET</span>
    </div>
    <el-menu
      :default-active="route.path"
      :collapse="app.sidebarCollapsed"
      :collapse-transition="false"
      router
      class="sidenav__menu"
    >
      <el-menu-item v-for="item in items" :key="item.index" :index="item.index">
        <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<style scoped>
.sidenav {
  display: flex;
  flex-direction: column;
  width: var(--app-sidenav-width);
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: width 0.2s;
}
.sidenav--collapsed {
  width: var(--app-sidenav-collapsed-width);
}
.sidenav__brand {
  display: flex;
  align-items: center;
  height: var(--app-header-height);
  padding: 0 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}
.sidenav__menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}
</style>
