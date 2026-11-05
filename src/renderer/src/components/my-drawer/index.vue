<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'my-drawer' })

/** 与 my-dialog 同 API 形态的抽屉版，切换容器不改调用侧。 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    size?: number | string
    direction?: 'ltr' | 'rtl' | 'ttb' | 'btt'
  }>(),
  {
    title: '',
    size: 560,
    direction: 'rtl'
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
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :direction="direction"
    append-to-body
    v-bind="$attrs"
    @close="emit('close')"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-drawer>
</template>
