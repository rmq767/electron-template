<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'not-found' })

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <h1>页面不存在</h1>
    <p>路由未登记，或被窗口上下文守卫拦下。</p>
    <el-button type="primary" @click="router.replace('/home')">回概览</el-button>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.not-found__code {
  color: var(--app-border-strong);
  font-family: var(--app-font-mono);
  font-size: 72px;
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 1;
}

.not-found h1 {
  margin: 18px 0 0;
  color: var(--app-ink);
  font-size: 19px;
  font-weight: 650;
}

.not-found p {
  margin: 7px 0 20px;
  color: var(--app-muted);
  font-size: 12.5px;
}
</style>
