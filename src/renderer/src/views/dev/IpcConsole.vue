<script setup lang="ts">
import { ref } from 'vue'
import type { AppInfo } from '@shared/ipc/types'

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
  <section class="ipc-console">
    <h2>IPC 基座</h2>

    <div class="row">
      <button @click="loadInfo">读取应用信息</button>
      <span v-if="roundTripMs !== null" class="muted">往返 {{ roundTripMs }}ms</span>
    </div>

    <pre v-if="info" class="panel">{{ info }}</pre>

    <div class="row">
      <button @click="toggleTheme">切换 ui.theme（写入 settings.json）</button>
      <button @click="readTheme">读回 ui.theme</button>
      <span class="muted">当前：{{ theme }}</span>
    </div>

    <div class="row">
      <button @click="pickFile">选择文件</button>
      <span class="muted">{{ picked ? picked.join(' , ') : '未选择 / 已取消' }}</span>
    </div>

    <div class="row">
      <button @click="saveFile">另存为</button>
      <span class="muted">{{ saved ?? '未保存 / 已取消' }}</span>
    </div>

    <div class="row">
      <button @click="writeLog">写三条日志（info/warn/error）</button>
      <span v-if="info" class="muted">落在 {{ info.userDataPath }}{{ '/logs' }}</span>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.ipc-console {
  padding: 16px;
  font-size: 13px;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
button {
  padding: 4px 10px;
  border: 1px solid #d0d3d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
button:hover {
  border-color: #409eff;
  color: #409eff;
}
.panel {
  margin: 0 0 12px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
}
.muted {
  color: #6b7280;
}
.error {
  color: #dc2626;
}
</style>
