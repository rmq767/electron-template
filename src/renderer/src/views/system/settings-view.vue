<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AppInfo } from '@shared/ipc/types'
import { useAppStore } from '@renderer/stores/app'

defineOptions({ name: 'system-settings' })

const app = useAppStore()
const info = ref<AppInfo | null>(null)
const exporting = ref(false)
const diagnosticsPath = ref('')

onMounted(async () => {
  try {
    info.value = (await window.api?.app?.getInfo()) ?? null
  } catch {
    /* 浏览器预览没有宿主信息 */
  }
})

async function exportDiagnostics(): Promise<void> {
  exporting.value = true
  try {
    diagnosticsPath.value = await window.api.app.exportDiagnostics()
    ElMessage.success('诊断包已生成')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '生成失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">System</p>
        <h1>系统设置</h1>
        <p>偏好经 IPC 写入 userData/settings.json，重启后仍在；这里不引 localStorage。</p>
      </div>
    </header>

    <div class="settings-grid">
      <div class="settings-main">
        <section class="panel">
          <header class="panel__head">
            <div>
              <h2 class="panel__title">外观</h2>
              <p class="panel__desc">主题与侧栏状态会立刻生效并持久化</p>
            </div>
          </header>
          <div class="panel__body panel__body--flush">
            <div class="setting-row">
              <div class="setting-row__text">
                <span class="setting-row__label">主题</span>
                <span class="setting-row__note">亮色 / 暗色，作用于主窗口、登录窗与独立窗口</span>
              </div>
              <el-radio-group v-model="app.theme">
                <el-radio-button value="light">亮色</el-radio-button>
                <el-radio-button value="dark">暗色</el-radio-button>
              </el-radio-group>
            </div>

            <div class="setting-row">
              <div class="setting-row__text">
                <span class="setting-row__label">侧栏默认收起</span>
                <span class="setting-row__note">收起后只保留图标，给内容区更多宽度</span>
              </div>
              <el-switch v-model="app.sidebarCollapsed" />
            </div>
          </div>
        </section>

        <section class="panel">
          <header class="panel__head">
            <div>
              <h2 class="panel__title">诊断</h2>
              <p class="panel__desc">导出环境信息与日志尾部，不引 zip、不上传云端</p>
            </div>
          </header>
          <div class="panel__body panel__body--flush">
            <div class="setting-row">
              <div class="setting-row__text">
                <span class="setting-row__label">诊断包</span>
                <span class="setting-row__note">生成后把文件连同 app-*.log 一起发给支持人员</span>
              </div>
              <el-button :loading="exporting" @click="exportDiagnostics">导出诊断包</el-button>
            </div>
            <div v-if="diagnosticsPath" class="diagnostics-path">
              <span class="diagnostics-path__label">上次生成</span>
              <span class="mono selectable" :title="diagnosticsPath">{{ diagnosticsPath }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="panel settings-runtime">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">运行环境</h2>
            <p class="panel__desc">当前进程与数据目录</p>
          </div>
          <span class="status-dot" />
        </header>
        <div class="panel__body panel__body--flush">
          <div class="env-row">
            <span>应用</span>
            <strong>{{ info?.name ?? '—' }}</strong>
          </div>
          <div class="env-row">
            <span>版本</span>
            <strong class="mono">{{ info ? `v${info.version}` : '—' }}</strong>
          </div>
          <div class="env-row">
            <span>Electron</span>
            <strong class="mono">{{ info?.versions.electron ?? '—' }}</strong>
          </div>
          <div class="env-row">
            <span>Node</span>
            <strong class="mono">{{ info?.versions.node ?? '—' }}</strong>
          </div>
          <div class="env-row">
            <span>Chromium</span>
            <strong class="mono">{{ info?.versions.chrome ?? '—' }}</strong>
          </div>
          <div class="env-row">
            <span>平台</span>
            <strong class="mono">{{ info ? `${info.platform} / ${info.arch}` : '—' }}</strong>
          </div>
          <div class="env-row env-row--stack">
            <span>数据目录</span>
            <strong class="mono selectable">{{ info?.userDataPath ?? '—' }}</strong>
          </div>
          <p v-if="!info" class="env-hint">当前为浏览器预览，宿主信息不可用</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr);
  gap: 18px;
  align-items: start;
}

.settings-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
}

.setting-row:last-of-type {
  border-bottom: 0;
}

.setting-row__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.setting-row__label {
  color: var(--app-ink);
  font-size: 12.5px;
  font-weight: 550;
}

.setting-row__note {
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.diagnostics-path {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface-muted);
}

.diagnostics-path__label {
  flex-shrink: 0;
  color: var(--app-muted);
  font-size: 11.5px;
}

.diagnostics-path .mono {
  overflow: hidden;
  color: var(--app-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.env-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 9px 20px;
  border-bottom: 1px solid var(--app-border);
  font-size: 12px;
}

.env-row:last-of-type {
  border-bottom: 0;
}

.env-row > span {
  color: var(--app-muted);
}

.env-row > strong {
  overflow: hidden;
  color: var(--app-ink-soft);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.env-row--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding-top: 12px;
  padding-bottom: 14px;
}

.env-row--stack > strong {
  width: 100%;
  color: var(--app-ink-soft);
  font-size: 11.5px;
  line-height: 1.55;
  text-align: left;
  overflow-wrap: anywhere;
  white-space: normal;
}

.env-hint {
  margin: 0;
  padding: 12px 20px;
  color: var(--app-muted);
  font-size: 11px;
}

@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
