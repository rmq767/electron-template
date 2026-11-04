<script setup lang="ts">
import { computed } from 'vue'

/** 与 MyDialog 同 API 形态的抽屉版，便于按场景切换而不改调用侧。 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    size?: number | string
    loading?: boolean
    showFooter?: boolean
    closeOnClickModal?: boolean
    direction?: 'ltr' | 'rtl' | 'ttb' | 'btt'
  }>(),
  {
    title: '',
    size: 560,
    loading: false,
    showFooter: true,
    closeOnClickModal: false,
    direction: 'rtl'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  closed: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function onCancel(): void {
  emit('cancel')
  visible.value = false
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :direction="direction"
    :close-on-click-modal="closeOnClickModal"
    @closed="emit('closed')"
  >
    <slot />
    <template v-if="showFooter" #footer>
      <slot name="footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('confirm')">确定</el-button>
      </slot>
    </template>
  </el-drawer>
</template>
