<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AppInfo } from '@shared/ipc/types'
import { useAppStore } from '@renderer/stores/app'

defineOptions({ name: 'SystemSettings' })

const app = useAppStore()
const info = ref<AppInfo | null>(null)
const exporting = ref(false)
const diagnosticsPath = ref('')

onMounted(async () => {
  info.value = await window.api.app.getInfo()
})

async function exportDiagnostics(): Promise<void> {
  exporting.value = true
  try {
    diagnosticsPath.value = await window.api.app.exportDiagnostics()
    ElMessage.success('诊断包已生成')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '生成失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="page">
    <el-form label-width="120px" label-position="left">
      <el-form-item label="主题">
        <el-radio-group v-model="app.theme">
          <el-radio-button value="light">亮色</el-radio-button>
          <el-radio-button value="dark">暗色</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="侧栏默认收起">
        <el-switch v-model="app.sidebarCollapsed" />
      </el-form-item>
      <el-form-item>
        <span class="muted">以上两项经 IPC 写入 userData/settings.json，重启后仍在</span>
      </el-form-item>
      <el-form-item label="诊断">
        <el-button :loading="exporting" @click="exportDiagnostics">导出诊断包</el-button>
        <span v-if="diagnosticsPath" class="muted">{{ diagnosticsPath }}</span>
      </el-form-item>
    </el-form>

    <el-descriptions v-if="info" title="运行环境" :column="2" border>
      <el-descriptions-item label="应用">{{ info.name }}</el-descriptions-item>
      <el-descriptions-item label="版本">{{ info.version }}</el-descriptions-item>
      <el-descriptions-item label="Electron">{{ info.versions.electron }}</el-descriptions-item>
      <el-descriptions-item label="Node">{{ info.versions.node }}</el-descriptions-item>
      <el-descriptions-item label="Chromium">{{ info.versions.chrome }}</el-descriptions-item>
      <el-descriptions-item label="平台"
        >{{ info.platform }} / {{ info.arch }}</el-descriptions-item
      >
      <el-descriptions-item label="数据目录" :span="2">{{
        info.userDataPath
      }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<style scoped>
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
