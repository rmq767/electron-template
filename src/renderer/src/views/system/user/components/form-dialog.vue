<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserDTO } from '@shared/types/user'
import { FormType } from '@renderer/types/common'
import UserForm from './user-form.vue'

defineOptions({ name: 'user-form-dialog' })

const visible = ref(false)
const mode = ref<FormType>(FormType.ADD)
const model = ref<UserDTO | null>(null)
const formRef = ref<InstanceType<typeof UserForm> | null>(null)

const emit = defineEmits<{
  success: [value: UserDTO]
}>()

const title = computed(() => (mode.value === FormType.EDIT ? '编辑用户' : '新增用户'))

function open(type: FormType, row?: UserDTO): void {
  mode.value = type
  model.value = type === FormType.EDIT ? (row ?? null) : null
  visible.value = true
}

function close(): void {
  visible.value = false
}

async function submit(): Promise<void> {
  const value = await formRef.value?.submit()
  if (!value) return
  emit('success', value)
  close()
}

defineExpose({ open, close })
</script>

<template>
  <my-dialog v-model="visible" :title="title" :width="640" @close="model = null">
    <user-form ref="formRef" :mode="mode" :model="model" />
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </my-dialog>
</template>
