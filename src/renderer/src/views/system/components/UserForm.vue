<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { UserDTO } from '@shared/types/user'

/**
 * 表单主体。刻意不 import 任何弹层、也不知道自己被装在哪里：
 * 只声明入参 props 和出参 emit，外层容器（MyDialog / MyDrawer / 独立窗口）负责装配。
 * 这是「同一个表单从 dialog 平滑升级成 window」的前提。
 * 类型放 @shared/types/user，因为 <script setup> 不允许 export，且主进程侧也要用。
 */
const props = withDefaults(
  defineProps<{ model?: UserDTO | null; mode?: 'create' | 'edit' }>(),
  { model: null, mode: 'create' }
)

const emit = defineEmits<{
  done: [value: UserDTO]
  cancel: []
}>()

const formRef = ref<FormInstance>()

const form = reactive<UserDTO>({
  name: '',
  account: '',
  role: 'viewer',
  remark: ''
})

const rules: FormRules<UserDTO> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_.-]{3,20}$/, message: '3-20 位字母、数字或 _ . -', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const title = computed(() => (props.mode === 'edit' ? '编辑用户' : '新增用户'))

watch(
  () => props.model,
  (value) => {
    Object.assign(form, { name: '', account: '', role: 'viewer', remark: '' }, value ?? {})
  },
  { immediate: true }
)

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

async function submit(): Promise<UserDTO | null> {
  const ok = await validate()
  if (!ok) return null
  const value = { ...form }
  emit('done', value)
  return value
}

function cancel(): void {
  emit('cancel')
}

// 容器通过 ref 调 submit/cancel，表单自己决定何时算完成
defineExpose({ submit, cancel, validate, title })
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="92px"
    class="popup-form"
  >
    <!-- 两列栅格：奇数个字段时落单项放最后一行，也不独占整行 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" class="full">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="访客" value="viewer" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="状态">
          <el-tag size="small" type="info">{{ mode === 'edit' ? '编辑中' : '新建' }}</el-tag>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark" class="el-form-item--full">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped>
.full {
  width: 100%;
}
</style>
