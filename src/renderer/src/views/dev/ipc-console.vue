<script setup lang="ts">
import { ref } from 'vue'
import type { AppInfo } from '@shared/ipc/types'

defineOptions({ name: 'dev-ipc' })

/**
 * IPC 基座的验收台：每个按钮对应一条通道，跑通即说明
 * channel 常量 → schema 契约 → preload 封装 → 渲染层调用 整条链路是通的。
 * 该页面只在开发期保留（router 里 meta.hidden 且非窗口上下文）。
 */

const info = ref<AppInfo | null>(null)
const roundTripMs = ref<number | null>(null)
const picked = ref<string[] | null>(null)
const saved = ref<string | null>(null)
const theme = ref<'light' | 'dark'>('light')
const error = ref('')

async function loadInfo(): Promise<void> {
  error.value = ''
  const startedAt = performance.now()
  try {
    info.value = await window.api.app.getInfo()
    roundTripMs.value = Math.round(performance.now() - startedAt)
  } catch (err) {
    error.value = String(err)
  }
}

async function toggleTheme(): Promise<void> {
  const next = theme.value === 'light' ? 'dark' : 'light'
  await window.api.store.set('ui.theme', next)
  theme.value = next
  error.value = ''
}

async function readTheme(): Promise<void> {
  // 读回来验证真的落到了 userData/settings.json，而不是只在内存里
  theme.value = (await window.api.store.get('ui.theme')) ?? 'light'
}

async function pickFile(): Promise<void> {
  picked.value = await window.api.dialog.openFile({
    title: '选择文件',
    filters: [{ name: '文本', extensions: ['txt', 'md', 'json'] }]
  })
}

async function saveFile(): Promise<void> {
  saved.value = await window.api.dialog.saveFile({
    title: '另存为',
    defaultPath: 'export.txt',
    filters: [{ name: '文本', extensions: ['txt'] }]
  })
}

function writeLog(): void {
  // 跨 IPC 只传纯对象：不要带 ref、代理或函数
  window.api.log.info('来自渲染进程的日志', { at: new Date().toISOString() })
  window.api.log.warn('一条告警')
  window.api.log.error('一条错误', { code: 'E_DEMO' })
  error.value = ''
}

void loadInfo()
void readTheme()
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">Developer</p>
        <h1>IPC 基座</h1>
        <p>逐条通道验收：channel 常量 → schema 契约 → preload 封装 → 渲染层调用。</p>
      </div>
      <div class="view-head__actions">
        <el-button @click="writeLog">写三条日志</el-button>
        <el-button type="primary" @click="loadInfo">读取应用信息</el-button>
      </div>
    </header>

    <section class="panel">
      <header class="panel__head">
        <div>
          <h2 class="panel__title">通道验收</h2>
          <p class="panel__desc">每个按钮只走一条 IPC，结果就地显示</p>
        </div>
        <span v-if="roundTripMs !== null" class="muted">往返 {{ roundTripMs }}ms</span>
      </header>

      <div class="panel__body panel__body--flush">
        <div class="channel-row">
          <div class="channel-row__info">
            <span class="channel-row__name">app:get-info</span>
            <span class="channel-row__note">读取应用信息与进程版本</span>
          </div>
          <div class="channel-row__action">
            <span v-if="info" class="channel-row__result mono"
              >{{ info.name }} v{{ info.version }}</span
            >
            <el-button size="small" @click="loadInfo">调用</el-button>
          </div>
        </div>

        <div class="channel-row">
          <div class="channel-row__info">
            <span class="channel-row__name">store:get / store:set</span>
            <span class="channel-row__note">写入 userData/settings.json 后读回</span>
          </div>
          <div class="channel-row__action">
            <span class="channel-row__result">当前：{{ theme }}</span>
            <el-button size="small" @click="toggleTheme">切换</el-button>
            <el-button size="small" @click="readTheme">读回</el-button>
          </div>
        </div>

        <div class="channel-row">
          <div class="channel-row__info">
            <span class="channel-row__name">dialog:open-file</span>
            <span class="channel-row__note">系统文件对话框，取消返回 null</span>
          </div>
          <div class="channel-row__action">
            <span class="channel-row__result mono">{{
              picked ? picked.join(' , ') : '未选择 / 已取消'
            }}</span>
            <el-button size="small" @click="pickFile">选择文件</el-button>
          </div>
        </div>

        <div class="channel-row">
          <div class="channel-row__info">
            <span class="channel-row__name">dialog:save-file</span>
            <span class="channel-row__note">系统另存为对话框</span>
          </div>
          <div class="channel-row__action">
            <span class="channel-row__result mono">{{ saved ?? '未保存 / 已取消' }}</span>
            <el-button size="small" @click="saveFile">另存为</el-button>
          </div>
        </div>

        <div class="channel-row">
          <div class="channel-row__info">
            <span class="channel-row__name">log:write</span>
            <span class="channel-row__note">渲染层日志汇入主进程同一份日志文件</span>
          </div>
          <div class="channel-row__action">
            <span v-if="info" class="channel-row__result mono">{{ info.userDataPath }}/logs</span>
            <el-button size="small" @click="writeLog">写日志</el-button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="info" class="panel">
      <header class="panel__head">
        <h2 class="panel__title">应用信息快照</h2>
        <span class="muted mono">app:get-info</span>
      </header>
      <pre class="ipc-output mono selectable">{{ info }}</pre>
    </section>

    <el-alert v-if="error" type="error" :closable="false" show-icon :title="error" />
  </div>
</template>

<style scoped lang="scss">
.channel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--app-border);
}

.channel-row:last-child {
  border-bottom: 0;
}

.channel-row__info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.channel-row__name {
  color: var(--app-ink);
  font-family: var(--app-font-mono);
  font-size: 12px;
  font-weight: 600;
}

.channel-row__note {
  color: var(--app-muted);
  font-size: 11.5px;
}

.channel-row__action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.channel-row__result {
  max-width: 340px;
  overflow: hidden;
  color: var(--app-ink-soft);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ipc-output {
  margin: 0;
  padding: 18px 20px;
  overflow: auto;
  color: var(--app-ink-soft);
  font-size: 11px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
