<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@renderer/stores/auth'
import { APP_NAME } from '@shared/constants/app'

defineOptions({ name: 'Login' })

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ userName: 'admin', password: '123456' })

const rules: FormRules<typeof form> = {
  userName: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function submit(): Promise<void> {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await auth.login({ ...form })
    ElMessage.success('已登录')
    // 回到来时想去的页面；没有 redirect 就进概览
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    await router.replace(redirect)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="login__card" shadow="never">
      <h2 class="login__title">{{ APP_NAME }}</h2>
      <p class="login__sub">模板内置 mock 账号：admin / 123456</p>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item label="账号" prop="userName">
          <el-input v-model="form.userName" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password @keyup.enter="submit" />
        </el-form-item>
        <el-button type="primary" class="login__submit" :loading="loading" @click="submit">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--app-content-bg);
}
.login__card {
  width: 360px;
}
.login__title {
  margin: 0 0 4px;
  font-size: 18px;
}
.login__sub {
  margin: 0 0 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.login__submit {
  width: 100%;
}
</style>
