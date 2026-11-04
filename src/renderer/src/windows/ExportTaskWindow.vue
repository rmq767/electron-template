<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { ElMessage } from 'element-plus'
import WindowGate from '@renderer/components/base/WindowGate.vue'
import { useWindowPayload } from '@renderer/composables/useWindowPayload'
import type { ExportTaskProps, ExportTaskResult } from '@shared/ipc/window-spec'

defineOptions({ name: 'WExportTask' })

/**
 * 长任务窗口的意义在于「跨越主界面路由切换仍然存活」：
 * 你可以开着它切到别的标签页，进度不会消失。dialog 做不到这一点。
 */
const state = useWindowPayload('export-task')
const progress = ref(0)
const running = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const total = computed(() => (state.props.value as ExportTaskProps | null)?.ids.length ?? 0)

function stop(): void {
  if (timer) clearInterval(timer)
  timer = null
  running.value = false
}

function start(): void {
  if (running.value) return
  running.value = true
  progress.value = 0
  timer = setInterval(() => {
    progress.value += 10
    if (progress.value >= 100) {
      stop()
      progress.value = 100
    }
  }, 300)
}

async function save(): Promise<void> {
  stop()
  const path = await window.api.dialog.saveFile({
    title: '导出到',
    defaultPath: 'export.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (!path) {
    ElMessage.info('已取消导出')
    return
  }
  const result: ExportTaskResult = { savedPath: path, rows: total.value }
  void window.api.window.close(result)
}

// 单例窗口被再次打开时，主进程会推新的 ids 过来
onScopeDispose(stop)
</script>

<template>
  <div class="window-page">
    <WindowGate :ready="state.ready.value" :error="state.error.value" :rows="3">
      <p class="row">待导出行数：<b>{{ total }}</b></p>
      <el-progress :percentage="progress" :status="progress >= 100 ? 'success' : undefined" />
      <div class="row window-page__footer">
        <el-button v-if="!running" type="primary" @click="start">开始导出</el-button>
        <el-button v-else @click="stop">中断</el-button>
        <el-button type="success" :disabled="progress < 100" @click="save">选择保存位置</el-button>
      </div>
      <p class="hint">试着开着这个窗口去切主界面的标签页——进度还在，这就是 window 的价值。</p>
    </WindowGate>
  </div>
</template>

<style scoped>
.window-page {
  padding: 16px;
}
.row {
  margin: 0 0 12px;
}
.window-page__footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.hint {
  margin-top: 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
