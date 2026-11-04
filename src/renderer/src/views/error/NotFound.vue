<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'NotFound' })

const router = useRouter()
</script>

<template>
  <el-result icon="warning" title="页面不存在" sub-title="路由未登记，或被窗口上下文守卫拦下">
    <template #extra>
      <el-button type="primary" @click="router.replace('/home')">回概览</el-button>
    </template>
  </el-result>
</template>
