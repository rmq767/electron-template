<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'my-dialog' })

/**
 * 全局弹窗组件：外观样式只在 styles/element-theme.scss 里有一份。
 * width 只接受具体值，不做 size 枚举档位。
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: number | string
    loading?: boolean
    showFooter?: boolean
    closeOnClickModal?: boolean
    destroyOnClose?: boolean
  }>(),
  {
    title: '',
    width: 640,
    loading: false,
    showFooter: true,
    closeOnClickModal: false,
    destroyOnClose: true
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
  <!-- append-to-body：页面 .view 的入场动画保留 transform，会限制 fixed 弹层；必须挂到 body 才是整窗遮蔽 -->
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    append-to-body
    draggable
    @closed="emit('closed')"
  >
    <slot />
    <template v-if="showFooter" #footer>
      <slot name="footer">
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('confirm')">确定</el-button>
      </slot>
    </template>
  </el-dialog>
</template>
