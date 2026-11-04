<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ChatSquare, CopyDocument, Cpu, Monitor } from '@element-plus/icons-vue'
import type { AppInfo } from '@shared/ipc/types'

defineOptions({ name: 'home' })

const router = useRouter()
const info = ref<AppInfo | null>(null)

const stack = [
  { name: 'Electron 45', note: '主进程 / preload / 渲染进程三层边界' },
  { name: 'electron-vite 6', note: '一次配置产出三端，dev 带 -w 自动重启' },
  { name: 'Vue 3.5 + Router 5 + Pinia 4', note: 'hash 路由，生产包走 file://' },
  { name: 'Element Plus 2.14', note: '全量引入 + 单一主题覆盖文件' },
  { name: 'TypeScript 6', note: '跨进程契约在编译期兜错' }
]

const shortcuts = [
  {
    title: '弹层示例',
    note: '同一表单在 dialog / drawer / window 三种容器里的装配',
    path: '/demo/dialog',
    icon: ChatSquare
  },
  {
    title: '独立窗口示例',
    note: '带参数进、带结果出，覆盖取消与崩溃兜底',
    path: '/demo/window',
    icon: CopyDocument
  },
  {
    title: 'IPC 基座',
    note: '逐条验证 channel → schema → preload → 渲染层',
    path: '/dev/ipc',
    icon: Cpu
  }
]

onMounted(async () => {
  try {
    info.value = (await window.api?.app?.getInfo()) ?? null
  } catch {
    /* 浏览器预览没有宿主信息 */
  }
})
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">Workspace</p>
        <h1>概览</h1>
        <p>
          模板的核心是一份可操作的判断标准：默认用
          dialog，只有命中「并排操作、独立任务栏条目、同一表单并行多开、长任务跨路由存活、崩溃隔离、独立渲染上下文」这
          6 条之一，才升级为独立窗口。
        </p>
      </div>
      <div class="view-head__actions">
        <el-button @click="router.push('/demo/window')">独立窗口示例</el-button>
        <el-button type="primary" @click="router.push('/demo/dialog')">弹层示例</el-button>
      </div>
    </header>

    <div class="home-grid">
      <section class="panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">技术栈与既有约定</h2>
            <p class="panel__desc">版本线固定，升级前先读 DESIGN.md 的实测记录</p>
          </div>
          <span class="muted">5 项</span>
        </header>
        <div class="panel__body panel__body--flush">
          <ul class="stack-list">
            <li v-for="(item, index) in stack" :key="item.name" class="stack-row">
              <span class="stack-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="stack-row__main">
                <span class="stack-row__name">{{ item.name }}</span>
                <span class="stack-row__note">{{ item.note }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div class="home-side">
        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">运行环境</h2>
            <span class="status-dot" />
          </header>
          <div class="panel__body runtime">
            <div class="runtime-row">
              <span>应用版本</span>
              <span class="mono">{{ info ? `v${info.version}` : '—' }}</span>
            </div>
            <div class="runtime-row">
              <span>Electron</span>
              <span class="mono">{{ info?.versions.electron ?? '—' }}</span>
            </div>
            <div class="runtime-row">
              <span>Chromium</span>
              <span class="mono">{{ info?.versions.chrome ?? '—' }}</span>
            </div>
            <div class="runtime-row">
              <span>Node</span>
              <span class="mono">{{ info?.versions.node ?? '—' }}</span>
            </div>
            <div class="runtime-row">
              <span>平台</span>
              <span class="mono">{{ info ? `${info.platform} / ${info.arch}` : '—' }}</span>
            </div>
            <p v-if="!info" class="runtime-hint">当前为浏览器预览，宿主信息不可用</p>
          </div>
        </section>

        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">快捷入口</h2>
            <el-icon class="panel__head-icon"><monitor /></el-icon>
          </header>
          <div class="panel__body panel__body--flush">
            <button
              v-for="item in shortcuts"
              :key="item.path"
              type="button"
              class="shortcut"
              @click="router.push(item.path)"
            >
              <span class="shortcut__icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <span class="shortcut__text">
                <strong>{{ item.title }}</strong>
                <small>{{ item.note }}</small>
              </span>
              <el-icon class="shortcut__arrow"><arrow-right /></el-icon>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  gap: 18px;
  align-items: start;
}

.home-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stack-list {
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.stack-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--app-border);
}

.stack-row:last-child {
  border-bottom: 0;
}

.stack-row__index {
  padding-top: 1px;
  color: var(--app-border-strong);
  font-family: var(--app-font-mono);
  font-size: 11px;
  font-weight: 600;
}

.stack-row__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.stack-row__name {
  color: var(--app-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.stack-row__note {
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.55;
}

.panel__head-icon {
  color: var(--app-muted);
  font-size: 14px;
}

.runtime {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 12px;
  padding-bottom: 12px;
}

.runtime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
  color: var(--app-muted);
  font-size: 12px;
}

.runtime-row .mono {
  overflow: hidden;
  color: var(--app-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-hint {
  margin: 6px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--app-border);
  color: var(--app-muted);
  font-size: 11px;
}

.shortcut {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 11px;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-ink);
  cursor: default;
  text-align: left;
  transition: background-color 0.12s ease;
}

.shortcut:last-child {
  border-bottom: 0;
}

.shortcut:hover {
  background: var(--app-surface-hover);
}

.shortcut__icon {
  display: flex;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted);
  color: var(--app-accent);
  font-size: 15px;
}

.shortcut__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.shortcut__text strong {
  font-size: 12.5px;
  font-weight: 600;
}

.shortcut__text small {
  overflow: hidden;
  color: var(--app-muted);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shortcut__arrow {
  flex-shrink: 0;
  color: var(--app-muted);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .home-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
