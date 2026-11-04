<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import type { OpenOutcome } from '@shared/ipc/window-spec'

defineOptions({ name: 'demo-window' })

/** 独立窗口 demo：传参进、结果出，与 dialog 的用法一致。 */
const log = ref<string[]>([])
const lastOutcome = ref('')

const sample: UserDTO = {
  id: 11,
  name: '周晴',
  account: 'zhouqing',
  role: 'viewer',
  remark: '这份数据经主进程 registry 传给窗口，不走 URL'
}

const stats = reactive({ opened: 0, ok: 0, cancelled: 0, crashed: 0, other: 0 })

function push(line: string): void {
  log.value.unshift(`${new Date().toLocaleTimeString()}  ${line}`)
}

async function openUserForm(tag: string): Promise<void> {
  stats.opened += 1
  push(`发起 open('user-form') ${tag}`)
  const outcome = await window.api.window.open('user-form', sample, { title: `用户表单 ${tag}` })
  report(`用户表单 ${tag}`, outcome)
}

async function openExportTask(): Promise<void> {
  stats.opened += 1
  push("发起 open('export-task')，单例：再点一次只会聚焦并推新参数")
  const outcome = await window.api.window.open('export-task', { ids: [1, 2, 3, 4, 5] })
  report('导出任务', outcome)
}

function report(name: string, outcome: OpenOutcome<unknown>): void {
  if (outcome.ok) {
    stats.ok += 1
    lastOutcome.value = `${name} 完成：${JSON.stringify(outcome.data)}`
  } else {
    if (outcome.reason === 'cancelled') stats.cancelled += 1
    else if (outcome.reason === 'crashed') stats.crashed += 1
    else stats.other += 1
    lastOutcome.value = `${name} 未提交：${outcome.reason}${outcome.message ? ` (${outcome.message})` : ''}`
  }
  push(lastOutcome.value)
  ElMessage.info(lastOutcome.value)
}

/** 故意在窗口渲染进程里制造崩溃，用来验证「崩溃也会让 await 返回」而不是永久悬挂 */
function crashHint(): void {
  push('要验证崩溃路径：从任务管理器结束该窗口的渲染进程，调用方会拿到 reason: crashed')
}

const triggers = [
  ['1', '需要并排同时操作两块内容', '弹窗遮罩会锁定原页面，叠层无法真正并排'],
  ['2', '需要独立任务栏条目 / 副屏 / 单独置顶', '弹窗只是同一渲染进程里的 DOM'],
  ['3', '同一表单要并行多开', '弹窗单例状态互踩，窗口天生隔离'],
  ['4', '长任务跨越路由切换仍要存活', '切路由组件卸载，弹窗随之消失'],
  ['5', '需要崩溃/性能隔离', '弹窗崩了整个应用白屏，窗口只崩它自己'],
  ['6', '需要新的渲染上下文（独立内存/存储）', '同一 JS 上下文无法隔离']
]

const anti = [
  [
    'A',
    '强模态短交互（确认、小表单、选择器）',
    'Windows 上模态子窗口不跟随父窗口，多窗焦点成本远高于一个遮罩'
  ],
  ['B', '内容不足一屏、结果只在当前页消费', '收益低于代价'],
  ['C', '需要与页面实时联动共享状态', '跨进程同步要额外广播，成本立刻上升'],
  ['D', '需要入场动画或精确贴合页面元素', '独立窗口无法与页面 DOM 视觉耦合']
]
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">Playground</p>
        <h1>独立窗口示例</h1>
        <p>
          缺省规则：默认用 dialog。只有命中下面 6 条触发条件之一才升级为独立窗口，即使它看起来更酷。
        </p>
      </div>
      <div class="view-head__actions">
        <el-button @click="openExportTask">导出任务（单例）</el-button>
        <el-button @click="openUserForm('B')">并行再开一个</el-button>
        <el-button type="primary" @click="openUserForm('A')">打开用户表单窗口</el-button>
      </div>
    </header>

    <div class="stat-grid">
      <div class="stat">
        <span class="stat__label">发起次数</span>
        <strong class="stat__value">{{ stats.opened }}</strong>
      </div>
      <div class="stat">
        <span class="stat__label">完成回传</span>
        <strong class="stat__value stat__value--ok">{{ stats.ok }}</strong>
      </div>
      <div class="stat">
        <span class="stat__label">取消</span>
        <strong class="stat__value">{{ stats.cancelled }}</strong>
      </div>
      <div class="stat">
        <span class="stat__label">崩溃</span>
        <strong class="stat__value stat__value--danger">{{ stats.crashed }}</strong>
      </div>
    </div>

    <div class="window-grid">
      <section class="panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">决策表</h2>
            <p class="panel__desc">同屏叠层用 dialog，脱离同屏用 window</p>
          </div>
        </header>
        <div class="panel__body panel__body--flush">
          <div class="rule-group">
            <p class="rule-group__title">升级为 window（任一命中）</p>
            <div v-for="item in triggers" :key="item[0]" class="rule-row">
              <span class="rule-row__index">{{ item[0] }}</span>
              <div class="rule-row__body">
                <strong>{{ item[1] }}</strong>
                <span>{{ item[2] }}</span>
              </div>
            </div>
          </div>

          <div class="rule-group rule-group--anti">
            <p class="rule-group__title">必须留在 dialog（任一命中）</p>
            <div v-for="item in anti" :key="item[0]" class="rule-row">
              <span class="rule-row__index is-anti">{{ item[0] }}</span>
              <div class="rule-row__body">
                <strong>{{ item[1] }}</strong>
                <span>{{ item[2] }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel log-panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">调用日志</h2>
            <p class="panel__desc">每次 open 的返回值都会记录在这里</p>
          </div>
          <el-button size="small" text @click="crashHint">崩溃路径怎么验</el-button>
        </header>
        <div class="panel__body panel__body--flush">
          <p v-if="lastOutcome" class="last-outcome">{{ lastOutcome }}</p>
          <ul class="log">
            <li v-for="(line, index) in log" :key="index" class="log__line">{{ line }}</li>
            <li v-if="!log.length" class="log__empty">还没有调用记录</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.stat__label {
  color: var(--app-muted);
  font-size: 11px;
  font-weight: 500;
}

.stat__value {
  color: var(--app-ink);
  font-family: var(--app-font-mono);
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
}

.stat__value--ok {
  color: var(--app-success);
}

.stat__value--danger {
  color: var(--app-danger);
}

.window-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 18px;
  align-items: start;
}

.rule-group {
  padding: 14px 0 2px;
}

.rule-group + .rule-group {
  border-top: 1px solid var(--app-border);
}

.rule-group__title {
  margin: 0 0 4px;
  padding: 0 20px 6px;
  color: var(--app-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.rule-group--anti .rule-group__title {
  color: var(--app-muted);
}

.rule-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 9px 20px;
}

.rule-row__index {
  display: flex;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  border-radius: 6px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-family: var(--app-font-mono);
  font-size: 10px;
  font-weight: 600;
}

.rule-row__index.is-anti {
  background: var(--app-surface-muted);
  color: var(--app-muted);
}

.rule-row__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.rule-row__body strong {
  color: var(--app-ink);
  font-size: 12px;
  font-weight: 550;
}

.rule-row__body span {
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.log-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 240px);
}

.last-outcome {
  margin: 0;
  padding: 11px 20px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 11.5px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.log {
  margin: 0;
  padding: 8px 0;
  overflow: auto;
  list-style: none;
}

.log__line {
  padding: 5px 20px;
  color: var(--app-ink-soft);
  font-family: var(--app-font-mono);
  font-size: 11px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.log__empty {
  padding: 18px 20px;
  color: var(--app-muted);
  font-size: 12px;
  list-style: none;
}

@media (max-width: 1100px) {
  .window-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
