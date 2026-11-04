<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import MyDialog from '@renderer/components/base/my-dialog.vue'
import MyDrawer from '@renderer/components/base/my-drawer.vue'
import UserForm from '@renderer/views/system/components/user-form.vue'
import { useDialog } from '@renderer/composables/useDialog'
import { confirmAction } from '@renderer/composables/confirmAction'

defineOptions({ name: 'demo-dialog' })

/**
 * 同一个表单主体，两处容器。
 * 表单不知道自己被装在哪，所以从 dialog 换成 window 时不需要改业务代码。
 */
const dialog = useDialog<UserDTO>()
const drawerVisible = ref(false)
const current = ref<UserDTO | null>(null)
const dialogForm = ref<InstanceType<typeof UserForm> | null>(null)
const drawerForm = ref<InstanceType<typeof UserForm> | null>(null)

const sample: UserDTO = {
  id: 9,
  name: '陈默',
  account: 'chenmo',
  role: 'editor',
  remark: '同一份 UserForm，左边用弹窗、右边用抽屉、下一步用独立窗口'
}

function openDialog(): void {
  dialog.open(sample)
}

function openDrawer(): void {
  current.value = sample
  drawerVisible.value = true
}

async function onDialogConfirm(): Promise<void> {
  const value = await dialogForm.value?.submit()
  if (!value) return
  ElMessage.success(`弹窗已回传：${value.name}`)
  dialog.close()
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
        <h1>弹层示例</h1>
        <p>
          是 / 否用函数式确认，表单与详情用 dialog，内容长、需要侧向参照用 drawer；样式只有
          element-theme.scss 一份。
        </p>
      </div>
      <div class="view-head__actions">
        <el-button @click="$router.push('/demo/window')">换成独立窗口</el-button>
        <el-button type="primary" @click="openDialog">打开表单弹窗</el-button>
      </div>
    </header>

    <div class="demo-grid">
      <section class="panel">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">三种容器的分工</h2>
            <p class="panel__desc">先按交互形态选，再看内容长度</p>
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
              <h3>表单与详情</h3>
              <p>同一个 user-form 装进 my-dialog；表单不 import 弹层，只声明 props + emit。</p>
            </div>
            <el-button size="small" @click="openDialog">打开弹窗</el-button>
          </div>

          <div class="layer">
            <span class="layer__index">03</span>
            <div class="layer__body">
              <h3>长内容侧向参照</h3>
              <p>my-drawer 与 my-dialog 同 API 形态，切换容器不改调用侧。</p>
            </div>
            <el-button size="small" @click="openDrawer">打开抽屉</el-button>
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2 class="panel__title">容器契约</h2>
        </header>
        <div class="panel__body contract">
          <div class="contract__rule">
            <span class="contract__mark" />
            <div>
              <strong>页面内声明是默认</strong>
              <p>浮层生命周期属于当前页，切路由就该消失，不建全局单例。</p>
            </div>
          </div>
          <div class="contract__rule">
            <span class="contract__mark" />
            <div>
              <strong>样式只有一份</strong>
              <p>弹窗头部、圆角、内边距都在 styles/element-theme.scss；组件内不再写 :deep 覆盖。</p>
            </div>
          </div>
          <div class="contract__rule">
            <span class="contract__mark" />
            <div>
              <strong>升级到窗口不重写</strong>
              <p>命中并行多开、长任务存活、崩溃隔离等 6 条之一，才换成独立窗口。</p>
            </div>
          </div>
          <el-button
            class="contract__link"
            text
            type="primary"
            @click="$router.push('/demo/window')"
          >
            去独立窗口示例 →
          </el-button>
        </div>
      </section>
    </div>

    <my-dialog
      v-model="dialog.visible.value"
      title="编辑用户（弹窗）"
      :width="720"
      @confirm="onDialogConfirm"
      @cancel="dialog.close()"
    >
      <user-form ref="dialogForm" mode="edit" :model="dialog.payload.value" />
    </my-dialog>

    <my-drawer
      v-model="drawerVisible"
      title="编辑用户（抽屉）"
      :size="640"
      @confirm="onDrawerConfirm"
    >
      <user-form ref="drawerForm" mode="edit" :model="current" />
    </my-drawer>
  </div>
</template>

<style scoped lang="scss">
.demo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  gap: 18px;
  align-items: start;
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

.contract {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contract__rule {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}

.contract__mark {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.contract__rule strong {
  color: var(--app-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.contract__rule p {
  margin: 3px 0 0;
  color: var(--app-muted);
  font-size: 11.5px;
  line-height: 1.65;
}

.contract__link {
  align-self: flex-start;
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .demo-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
