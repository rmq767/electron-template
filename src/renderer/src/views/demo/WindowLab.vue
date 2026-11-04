<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import type { OpenOutcome } from '@shared/ipc/window-spec'

defineOptions({ name: 'DemoWindow' })

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
  log.value.unshift(`${new Date().toLocaleTimeString()} ${line}`)
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

/** 故意在窗口渲染进程里抛错，用来验证「崩溃也会让 await 返回」而不是永久悬挂 */
function crashHint(): void {
  push('要验证崩溃路径：在已打开的窗口里按 F12 执行 self.crashTest?.()，或直接从任务管理器结束该窗口进程')
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
  ['A', '强模态短交互（确认、小表单、选择器）', 'Windows 上模态子窗口不跟随父窗口，多窗焦点成本远高于一个遮罩'],
  ['B', '内容不足一屏、结果只在当前页消费', '收益低于代价'],
  ['C', '需要与页面实时联动共享状态', '跨进程同步要额外广播，成本立刻上升'],
  ['D', '需要入场动画或精确贴合页面元素', '独立窗口无法与页面 DOM 视觉耦合']
]
</script>

<template>
  <div class="page">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      class="rule"
      title="缺省规则：默认用 dialog"
      description="只有命中下面 6 条触发条件之一才升级为独立窗口；一条都不命中就禁止用，即使它看起来更酷。口诀：同屏叠层用 dialog，脱离同屏用 window。"
    />

    <el-space wrap size="middle">
      <el-button type="primary" @click="openUserForm('A')">打开用户表单窗口</el-button>
      <el-button @click="openUserForm('B')">再开一个（并行多开）</el-button>
      <el-button @click="openExportTask">打开导出任务（单例长任务）</el-button>
      <el-button link type="primary" @click="crashHint">崩溃路径怎么验</el-button>
      <el-button link @click="$router.push('/demo/dialog')">← 回到弹窗版</el-button>
    </el-space>

    <el-descriptions :column="4" border class="stats">
      <el-descriptions-item label="发起次数">{{ stats.opened }}</el-descriptions-item>
      <el-descriptions-item label="完成回传">{{ stats.ok }}</el-descriptions-item>
      <el-descriptions-item label="取消">{{ stats.cancelled }}</el-descriptions-item>
      <el-descriptions-item label="崩溃">{{ stats.crashed }}</el-descriptions-item>
    </el-descriptions>
    <p v-if="lastOutcome" class="outcome">{{ lastOutcome }}</p>

    <el-row :gutter="12" class="tables">
      <el-col :span="12">
        <el-card shadow="never" header="升级为 window 的触发条件（任一命中）">
          <el-table :data="triggers" size="small">
            <el-table-column prop="0" label="#" width="34" />
            <el-table-column prop="1" label="条件" min-width="180" />
            <el-table-column prop="2" label="为什么 dialog 不行" min-width="200" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="必须留在 dialog 的反向条件（任一命中）">
          <el-table :data="anti" size="small">
            <el-table-column prop="0" label="#" width="34" />
            <el-table-column prop="1" label="条件" min-width="180" />
            <el-table-column prop="2" label="原因" min-width="200" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="调用日志" class="log-card">
      <ul class="log">
        <li v-for="(line, index) in log" :key="index">{{ line }}</li>
        <li v-if="!log.length" class="muted">还没有调用记录</li>
      </ul>
    </el-card>
  </div>
</template>

<style scoped>
.rule,
.stats,
.outcome,
.tables,
.log-card {
  margin-top: 12px;
}
.outcome {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-color-primary);
}
.log {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
  max-height: 180px;
  overflow: auto;
}
.muted {
  color: var(--el-text-color-secondary);
  list-style: none;
}
</style>
