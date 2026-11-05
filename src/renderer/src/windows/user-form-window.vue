<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'
import WindowGate from '@renderer/components/window-gate/index.vue'
import WindowShell from '@renderer/components/chrome/window-shell.vue'
import UserForm from '@renderer/views/system/user/components/user-form.vue'
import { FormType } from '@renderer/types/common'
import { useWindowPayload } from '@renderer/composables/useWindowPayload'

defineOptions({ name: 'w-user-form' })

/**
 * 与 UserView 里的 dialog 用的是同一个 UserForm —— 升级成独立窗口没有重写任何表单逻辑。
 */
const state = useWindowPayload('user-form')
const formRef = ref<InstanceType<typeof UserForm> | null>(null)
const saving = ref(false)

async function submit(): Promise<void> {
  saving.value = true
  const value = await formRef.value?.submit()
  if (!value) {
    saving.value = false
    return
  }
  // 带 result 关闭 = 调用方拿到 { ok: true, data }
  void window.api.window.close(value)
}

function cancel(): void {
  // 不带 result 关闭 = 调用方拿到 { ok: false, reason: 'cancelled' }
  void window.api.window.close()
}

// Electron 没有内建 ESC-to-close，窗口页自己接
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') cancel()
}
window.addEventListener('keydown', onKeydown)
onScopeDispose(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <window-shell title="用户表单" subtitle="编辑后保存并回传">
    <window-gate :ready="state.ready.value" :error="state.error.value">
      <div class="form-wrap">
        <p class="form-tip">
          <span class="form-tip__dot" />
          参数经主进程 registry 传入，保存后以结果回传；点 X 关闭等价取消。
        </p>
        <user-form
          ref="formRef"
          :mode="state.props.value?.id ? FormType.EDIT : FormType.ADD"
          :model="state.props.value"
        />
      </div>
    </window-gate>

    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!state.ready.value" @click="submit">
        保存并回传
      </el-button>
    </template>
  </window-shell>
</template>

<style scoped lang="scss">
.form-wrap {
  max-width: 720px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  padding: 9px 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface-muted);
  color: var(--app-muted);
  font-size: 11.5px;
}

.form-tip__dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}
</style>
