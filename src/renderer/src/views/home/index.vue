<script setup lang="ts">
import { useRouter } from 'vue-router'

defineOptions({ name: 'Home' })

const router = useRouter()

const stack = [
  ['Electron 45', '主进程 / preload / 渲染进程三层边界'],
  ['electron-vite 6', '一次配置产出三端，dev 带 -w 自动重启'],
  ['Vue 3.5 + Router 5 + Pinia 4', 'hash 路由，生产包走 file://'],
  ['Element Plus 2.14', '全量引入 + 单一主题覆盖文件'],
  ['TypeScript 6', '跨进程契约在编译期兜错']
]
</script>

<template>
  <div class="page home">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never" header="技术栈与既有约定">
          <el-table :data="stack" size="small" :border="false">
            <el-table-column prop="0" label="依赖" width="200" />
            <el-table-column prop="1" label="约定" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never" header="先读这一页">
          <p class="desc">
            模板的核心是一份可操作的判断标准：<b>默认用 dialog</b
            >，只有命中「需要并排操作、独立任务栏条目、
            同一表单并行多开、长任务跨路由存活、崩溃隔离、独立渲染上下文」这 6
            条之一才升级为独立窗口。
          </p>
          <el-space wrap>
            <el-button type="primary" @click="router.push('/demo/dialog')">弹层示例</el-button>
            <el-button @click="router.push('/demo/window')">独立窗口示例</el-button>
            <el-button text @click="router.push('/dev/ipc')">IPC 调试台</el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.desc {
  margin: 0 0 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
</style>
