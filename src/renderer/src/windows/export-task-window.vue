<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { ElMessage } from 'element-plus'
import WindowGate from '@renderer/components/window-gate/index.vue'
import WindowShell from '@renderer/components/chrome/window-shell.vue'
import { useWindowPayload } from '@renderer/composables/useWindowPayload'
import type { ExportTaskProps, ExportTaskResult } from '@shared/ipc/window-spec'

defineOptions({ name: 'w-export-task' })

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
  <window-shell title="导出任务" subtitle="单例窗口 · 跨路由存活">
    <window-gate :ready="state.ready.value" :error="state.error.value" :rows="3">
      <div class="summary">
        <div class="summary__item">
          <span class="summary__label">待导出行数</span>
          <strong class="summary__value">{{ total }}</strong>
        </div>
        <div class="summary__item">
          <span class="summary__label">当前进度</span>
          <strong class="summary__value">{{ progress }}%</strong>
        </div>
      </div>

      <el-progress
        class="progress"
        :percentage="progress"
        :status="progress >= 100 ? 'success' : undefined"
        :show-text="false"
      />

      <p class="hint">开着这个窗口去切主界面的标签页——进度还在，这就是 window 的价值。</p>
    </window-gate>

    <template #footer>
      <el-button v-if="!running" type="primary" @click="start">开始导出</el-button>
      <el-button v-else @click="stop">中断</el-button>
      <el-button type="success" :disabled="progress < 100" @click="save">选择保存位置</el-button>
    </template>
  </window-shell>
</template>

<style scoped lang="scss">
.summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
}

.summary__label {
  color: var(--app-muted);
  font-size: 11px;
}

.summary__value {
  color: var(--app-ink);
  font-family: var(--app-font-mono);
  font-size: 21px;
  font-weight: 600;
  line-height: 1;
}

.progress {
  margin-bottom: 16px;
}

.hint {
  margin: 0;
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.65;
}
</style>
