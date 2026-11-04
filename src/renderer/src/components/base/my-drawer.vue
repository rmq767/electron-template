<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'my-drawer' })

/** 与 my-dialog 同 API 形态的抽屉版，便于按场景切换而不改调用侧。 */
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
  <!-- append-to-body：页面 .view 的入场动画保留 transform，会限制 fixed 弹层；必须挂到 body 才是整窗遮蔽 -->
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :direction="direction"
    :close-on-click-modal="closeOnClickModal"
    append-to-body
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
