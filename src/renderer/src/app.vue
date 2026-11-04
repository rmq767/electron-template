<script setup lang="ts">
import { RouterView } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <!-- 语言包、层级起点、消息条数都在这一处统一，不在各页重复配 -->
  <el-config-provider :locale="zhCn" :z-index="3000" :message="{ max: 3 }">
    <RouterView />
  </el-config-provider>
</template>
