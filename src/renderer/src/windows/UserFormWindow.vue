<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'
import WindowGate from '@renderer/components/base/WindowGate.vue'
import UserForm from '@renderer/views/system/components/UserForm.vue'
import { useWindowPayload } from '@renderer/composables/useWindowPayload'

defineOptions({ name: 'WUserForm' })

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
  <div class="window-page">
    <WindowGate :ready="state.ready.value" :error="state.error.value">
      <UserForm ref="formRef" :mode="state.props.value?.id ? 'edit' : 'create'" :model="state.props.value" />
      <div class="window-page__footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存并回传</el-button>
      </div>
    </WindowGate>
  </div>
</template>

<style scoped>
.window-page {
  padding: 16px;
}
.window-page__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
