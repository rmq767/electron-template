<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'my-dialog' })

/** 只做外观与默认契约：内容、底部按钮由调用方通过插槽决定。 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: number | string
  }>(),
  {
    title: '',
    width: 640
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <!-- append-to-body：页面 .view 的入场动画保留 transform，会限制 fixed 弹层 -->
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    append-to-body
    draggable
    :close-on-click-modal="false"
    :destroy-on-close="true"
    v-bind="$attrs"
    @close="emit('close')"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>
