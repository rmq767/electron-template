<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import type { OpenOutcome } from '@shared/ipc/window-spec'
import UserForm from '@renderer/views/system/user/components/user-form.vue'
import { FormType } from '@renderer/types/common'
import { confirmAction } from '@renderer/composables/confirmAction'

defineOptions({ name: 'demo-popup' })

const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogForm = ref<InstanceType<typeof UserForm> | null>(null)
const drawerForm = ref<InstanceType<typeof UserForm> | null>(null)

const sample: UserDTO = {
  id: 9,
  name: '陈默',
  account: 'chenmo',
  role: 'editor',
  remark: '同一份 UserForm，在弹窗、抽屉与独立窗口间复用'
}

const windowBusy = ref(false)
const log = ref<string[]>([])
const lastOutcome = ref('')
const stats = reactive({ ok: 0, cancelled: 0, crashed: 0, busy: 0 })

const triggers = [
  ['1', '需要并排同时操作两块内容', '弹窗遮罩会锁定原页面，叠层无法真正并排'],
  ['2', '需要独立任务栏条目 / 副屏 / 单独置顶', '弹窗只是同一渲染进程里的 DOM'],
  ['3', '长任务跨越路由切换仍要存活', '切路由组件卸载，弹窗随之消失'],
  ['4', '需要崩溃 / 性能隔离', '弹窗崩了整个应用白屏，窗口只崩它自己'],
  ['5', '需要新的渲染上下文（独立内存 / 存储）', '同一 JS 上下文无法隔离']
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

function push(line: string): void {
  log.value.unshift(`${new Date().toLocaleTimeString()}  ${line}`)
}

function report(name: string, outcome: OpenOutcome<unknown>): void {
  if (outcome.ok) {
    stats.ok += 1
    lastOutcome.value = `${name} 完成：${JSON.stringify(outcome.data)}`
  } else if (outcome.reason === 'cancelled') {
    stats.cancelled += 1
    lastOutcome.value = `${name} 未提交：cancelled`
  } else if (outcome.reason === 'crashed') {
    stats.crashed += 1
    lastOutcome.value = `${name} 崩溃：crashed`
  } else if (outcome.reason === 'busy') {
    stats.busy += 1
    lastOutcome.value = `${name} 被拒绝：已有独立窗口打开`
  } else {
    lastOutcome.value = `${name} 结束：${outcome.reason}`
  }
  push(lastOutcome.value)
  ElMessage.info(lastOutcome.value)
}

async function openUserForm(): Promise<void> {
  if (windowBusy.value) {
    ElMessage.warning('已有独立窗口打开，先关闭再试')
    return
  }
  if (!window.api?.window?.open) {
    ElMessage.warning('独立窗口只在 Electron 桌面中可用')
    return
  }
  windowBusy.value = true
  push("发起 open('user-form')")
  try {
    const outcome = await window.api.window.open('user-form', sample, { title: '用户表单' })
    report('用户表单', outcome)
  } finally {
    windowBusy.value = false
  }
}

async function openExportTask(): Promise<void> {
  if (windowBusy.value) {
    ElMessage.warning('已有独立窗口打开，先关闭再试')
    return
  }
  if (!window.api?.window?.open) {
    ElMessage.warning('独立窗口只在 Electron 桌面中可用')
    return
  }
  windowBusy.value = true
  push("发起 open('export-task')")
  try {
    const outcome = await window.api.window.open('export-task', { ids: [1, 2, 3, 4, 5] })
    report('导出任务', outcome)
  } finally {
    windowBusy.value = false
  }
}

function clearLog(): void {
  log.value = []
  lastOutcome.value = ''
}

async function onDialogConfirm(): Promise<void> {
  const value = await dialogForm.value?.submit()
  if (!value) return
  ElMessage.success(`弹窗已回传：${value.name}`)
  dialogVisible.value = false
}

async function onDrawerConfirm(): Promise<void> {
  const value = await drawerForm.value?.submit()
  if (!value) return
  ElMessage.success(`抽屉已回传：${value.name}`)
  drawerVisible.value = false
}

async function onDelete(): Promise<void> {
  const ok = await confirmAction('这一步只是演示，不会真的删除。', {
    danger: true,
    confirmText: '继续'
  })
  ElMessage.info(ok ? '你点了继续' : '你点了取消')
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <p class="view-head__eyebrow">Playground</p>
        <h1>弹层与窗口</h1>
        <p>
          默认用
          dialog；只有命中下面的升级条件才用独立窗口。当前同时只允许一个业务窗口，并行多开暂缓。
        </p>
      </div>
      <div class="view-head__actions">
        <el-button :disabled="windowBusy" @click="openExportTask">导出任务窗口</el-button>
        <el-button type="primary" :disabled="windowBusy" @click="openUserForm">
          用户表单窗口
        </el-button>
      </div>
    </header>

    <div class="popup-grid">
      <section class="panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">四种形态</h2>
            <p class="panel__desc">先按交互形态选，再看内容长度与生命周期</p>
          </div>
        </header>
        <div class="panel__body panel__body--flush">
          <div class="layer">
            <span class="layer__index">01</span>
            <div class="layer__body">
              <h3>是 / 否确认</h3>
              <p>
                不可逆操作统一走 confirmAction，返回 Promise&lt;boolean&gt;，取消与关闭都算 false。
              </p>
            </div>
            <el-button size="small" type="danger" plain @click="onDelete">试一下</el-button>
          </div>

          <div class="layer">
            <span class="layer__index">02</span>
            <div class="layer__body">
              <h3>表单弹窗</h3>
              <p>同一个 user-form 装进 my-dialog；表单不 import 弹层，只声明 props + emit。</p>
            </div>
            <el-button size="small" @click="dialogVisible = true">打开弹窗</el-button>
          </div>

          <div class="layer">
            <span class="layer__index">03</span>
            <div class="layer__body">
              <h3>长内容抽屉</h3>
              <p>my-drawer 与 my-dialog 同 API 形态，切换容器不改调用侧。</p>
            </div>
            <el-button size="small" @click="drawerVisible = true">打开抽屉</el-button>
          </div>

          <div class="layer">
            <span class="layer__index">04</span>
            <div class="layer__body">
              <h3>独立窗口</h3>
              <p>参数进、结果出；同一时间只允许一个业务窗口，关掉后才能再开。</p>
            </div>
            <el-button size="small" :disabled="windowBusy" @click="openUserForm">
              打开窗口
            </el-button>
          </div>
        </div>
        <p class="panel__footnote">
          浮层生命周期属于当前页；样式只有一份，统一在 styles/element-theme.scss。
        </p>
      </section>

      <section class="panel result-panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">调用结果</h2>
            <p class="panel__desc">独立窗口的返回值会记录在这里</p>
          </div>
          <el-tag v-if="windowBusy" size="small" effect="plain" type="warning">窗口打开中</el-tag>
          <el-button v-else-if="log.length" size="small" text @click="clearLog">清空</el-button>
        </header>

        <div class="stat-grid">
          <div class="stat">
            <span class="stat__label">完成</span>
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
          <div class="stat">
            <span class="stat__label">拒绝</span>
            <strong class="stat__value">{{ stats.busy }}</strong>
          </div>
        </div>

        <p v-if="lastOutcome" class="last-outcome">{{ lastOutcome }}</p>
        <ul class="log">
          <li v-for="(line, index) in log" :key="index" class="log__line">{{ line }}</li>
          <li v-if="!log.length" class="log__empty">还没有调用记录</li>
        </ul>
      </section>
    </div>

    <section class="panel">
      <header class="panel__head">
        <div>
          <h2 class="panel__title">窗口升级判断</h2>
          <p class="panel__desc">默认 dialog；命中任一条件才升级。当前同时只允许一个业务窗口。</p>
        </div>
      </header>
      <div class="panel__body panel__body--flush rule-grid">
        <div class="rule-group">
          <p class="rule-group__title">升级为 window（5 条）</p>
          <div v-for="item in triggers" :key="item[0]" class="rule-row">
            <span class="rule-row__index">{{ item[0] }}</span>
            <div class="rule-row__body">
              <strong>{{ item[1] }}</strong>
              <span>{{ item[2] }}</span>
            </div>
          </div>
        </div>

        <div class="rule-group rule-group--anti">
          <p class="rule-group__title">必须留在 dialog（4 条）</p>
          <div v-for="item in anti" :key="item[0]" class="rule-row">
            <span class="rule-row__index is-anti">{{ item[0] }}</span>
            <div class="rule-row__body">
              <strong>{{ item[1] }}</strong>
              <span>{{ item[2] }}</span>
            </div>
          </div>
        </div>
      </div>
      <p class="panel__footnote">
        并行多开（同一表单同时编辑多个对象）列入后续需求；当前统一由主进程窗口管理器拒绝第二个业务窗口。
      </p>
    </section>

    <my-dialog v-model="dialogVisible" title="编辑用户（弹窗）" :width="720">
      <user-form ref="dialogForm" :mode="FormType.EDIT" :model="sample" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onDialogConfirm">确定</el-button>
      </template>
    </my-dialog>

    <my-drawer v-model="drawerVisible" title="编辑用户（抽屉）" :size="640">
      <user-form ref="drawerForm" :mode="FormType.EDIT" :model="sample" />
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="onDrawerConfirm">确定</el-button>
      </template>
    </my-drawer>
  </div>
</template>

<style scoped lang="scss">
.popup-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr);
  gap: 18px;
  align-items: start;
}

.panel__footnote {
  margin: 0;
  padding: 11px 20px;
  border-top: 1px solid var(--app-border);
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.layer {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
}

.layer:last-child {
  border-bottom: 0;
}

.layer__index {
  display: flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-family: var(--app-font-mono);
  font-size: 10px;
  font-weight: 600;
}

.layer__body {
  min-width: 0;
  flex: 1;
}

.layer__body h3 {
  margin: 0;
  color: var(--app-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.layer__body p {
  margin: 3px 0 0;
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.result-panel {
  display: flex;
  flex-direction: column;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 16px 0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-muted);
}

.stat__label {
  color: var(--app-muted);
  font-size: 11px;
  font-weight: 500;
}

.stat__value {
  color: var(--app-ink);
  font-family: var(--app-font-mono);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.stat__value--ok {
  color: var(--app-success);
}

.stat__value--danger {
  color: var(--app-danger);
}

.last-outcome {
  margin: 12px 16px 0;
  padding: 9px 11px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 11.5px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.log {
  margin: 0;
  padding: 8px 0 12px;
  overflow: auto;
  list-style: none;
}

.log__line {
  padding: 5px 16px;
  color: var(--app-ink-soft);
  font-family: var(--app-font-mono);
  font-size: 11px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.log__empty {
  padding: 16px;
  color: var(--app-muted);
  font-size: 12px;
  list-style: none;
}

.rule-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.rule-group {
  padding: 12px 0 6px;
}

.rule-group + .rule-group {
  border-left: 1px solid var(--app-border);
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
  padding: 8px 20px;
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

@media (max-width: 1100px) {
  .popup-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .rule-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .rule-group + .rule-group {
    border-top: 1px solid var(--app-border);
    border-left: 0;
  }
}
</style>
