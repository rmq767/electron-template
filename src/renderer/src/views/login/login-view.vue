<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { APP_NAME, APP_TAGLINE } from '@shared/constants/app'
import { env } from '@renderer/env'
import { useAuthStore } from '@renderer/stores/auth'
import BrandMark from '@renderer/components/chrome/brand-mark.vue'
import WindowBrandBar from '@renderer/components/chrome/window-brand-bar.vue'

defineOptions({ name: 'login' })

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const loading = ref(false)
const entering = ref(false)
const form = reactive({ userName: 'admin', password: '123456' })

async function finishLogin(): Promise<void> {
  entering.value = true
  // 留半秒让「正在进入」可见，桌面登录窗随后由主进程关闭
  await new Promise((resolve) => setTimeout(resolve, 450))
  try {
    if (window.api?.app?.completeLogin) {
      await window.api.app.completeLogin()
    } else {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
      await router.replace(redirect)
    }
  } catch (err) {
    entering.value = false
    ElMessage.error(err instanceof Error ? err.message : '进入桌面失败')
  }
}

async function submit(): Promise<void> {
  if (loading.value || entering.value) return
  if (!form.userName.trim()) {
    ElMessage.warning('请输入账号')
    return
  }
  if (!form.password) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    await auth.login({ userName: form.userName.trim(), password: form.password })
    await finishLogin()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-window">
    <window-brand-bar />

    <main class="login-window__body">
      <div class="login-content">
        <section class="login-hero">
          <brand-mark :size="64" class="login-hero__mark" />
          <h1>{{ APP_NAME }}</h1>
          <p v-if="APP_TAGLINE">{{ APP_TAGLINE }}</p>
        </section>

        <form class="login-form" @submit.prevent="submit">
          <label class="login-field">
            <span class="login-field__label">账号</span>
            <el-input
              v-model="form.userName"
              size="large"
              autocomplete="username"
              placeholder="请输入账号"
            />
          </label>

          <label class="login-field">
            <span class="login-field__label">密码</span>
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </label>

          <el-button
            type="primary"
            size="large"
            class="login-submit"
            native-type="submit"
            :loading="loading || entering"
          >
            {{ entering ? '正在进入…' : '登录' }}
          </el-button>

          <p class="login-hint">
            模板账号 <code>admin</code><span class="login-hint__slash">/</span><code>123456</code>
          </p>
        </form>
      </div>

      <footer class="login-footer">
        <span class="status-dot" />
        <span>{{ env.isDev ? '开发环境' : '安全连接' }}</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.login-window__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 34px 18px;
}

.login-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 332px;
  margin: 0 auto;
  padding-bottom: 10px;
}

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 34px;
  text-align: center;
  animation: app-fade-up 0.32s ease-out both;
}

.login-hero__mark {
  margin-bottom: 18px;
  filter: drop-shadow(0 12px 24px rgba(15, 118, 110, 0.24));
}

.login-hero h1 {
  margin: 0;
  color: var(--app-ink);
  font-size: 23px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.login-hero p {
  margin: 7px 0 0;
  color: var(--app-muted);
  font-size: 12.5px;
  letter-spacing: 0.01em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  animation: app-fade-up 0.32s 0.05s ease-out both;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.login-field__label {
  padding-left: 1px;
  color: var(--app-ink-soft);
  font-size: 12px;
  font-weight: 500;
}

.login-submit {
  width: 100%;
  margin-top: 6px;
  letter-spacing: 0.02em;
}

.login-hint {
  margin: 2px 0 0;
  color: var(--app-muted);
  font-size: 11.5px;
  text-align: center;
}

.login-hint code {
  padding: 1px 5px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: color-mix(in srgb, var(--app-surface) 64%, transparent);
  color: var(--app-ink-soft);
  font-family: var(--app-font-mono);
  font-size: 10.5px;
}

.login-hint__slash {
  padding: 0 5px;
  color: var(--app-border-strong);
}

.login-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding-top: 14px;
  color: var(--app-muted);
  font-size: 10.5px;
  letter-spacing: 0.02em;
}
</style>
