<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserDTO } from '@shared/types/user'
import MyDialog from '@renderer/components/base/MyDialog.vue'
import MyDrawer from '@renderer/components/base/MyDrawer.vue'
import UserForm from '@renderer/views/system/components/UserForm.vue'
import { useDialog } from '@renderer/composables/useDialog'
import { confirmAction } from '@renderer/composables/confirmAction'

defineOptions({ name: 'DemoDialog' })

/**
 * 同一个表单主体，两处容器。
 * 表单不知道自己被装在哪，所以从 dialog 换成 window 时不需要改业务代码。
 */
const dialog = useDialog<UserDTO>()
const drawerVisible = ref(false)
const current = ref<UserDTO | null>(null)
const dialogForm = ref<InstanceType<typeof UserForm> | null>(null)
const drawerForm = ref<InstanceType<typeof UserForm> | null>(null)

const sample: UserDTO = {
  id: 9,
  name: '陈默',
  account: 'chenmo',
  role: 'editor',
  remark: '同一份 UserForm，左边用弹窗、右边用抽屉、下一步用独立窗口'
}

function openDialog(): void {
  dialog.open(sample)
}

function openDrawer(): void {
  current.value = sample
  drawerVisible.value = true
}

async function onDialogConfirm(): Promise<void> {
  const value = await dialogForm.value?.submit()
  if (!value) return
  ElMessage.success(`弹窗已回传：${value.name}`)
  dialog.close()
}

async function onDrawerConfirm(): Promise<void> {
  const value = await drawerForm.value?.submit()
  if (!value) return
  ElMessage.success(`抽屉已回传：${value.name}`)
  drawerVisible.value = false
}

async function onDelete(): Promise<void> {
  const ok = await confirmAction('这一步只是演示，不会真的删除。', {
    danger: true,
    confirmText: '继续'
  })
  ElMessage.info(ok ? '你点了继续' : '你点了取消')
}
</script>

<template>
  <div class="page">
    <el-space wrap size="middle">
      <el-button type="primary" @click="openDialog">MyDialog 打开表单</el-button>
      <el-button @click="openDrawer">MyDrawer 打开同一表单</el-button>
      <el-button type="danger" plain @click="onDelete">confirmAction 危险确认</el-button>
      <el-button link type="primary" @click="$router.push('/demo/window')">
        换成独立窗口 →
      </el-button>
    </el-space>

    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="这三种弹层的分工"
      description="是/否 → confirmAction（ElMessageBox）；表单与详情 → MyDialog；内容长、需要侧向参照 → MyDrawer。它们的样式都来自 styles/element-theme.css 这一份文件。"
    />

    <MyDialog
      v-model="dialog.visible.value"
      title="编辑用户（弹窗）"
      :width="720"
      @confirm="onDialogConfirm"
      @cancel="dialog.close()"
    >
      <UserForm ref="dialogForm" mode="edit" :model="dialog.payload.value" />
    </MyDialog>

    <MyDrawer
      v-model="drawerVisible"
      title="编辑用户（抽屉）"
      :size="640"
      @confirm="onDrawerConfirm"
    >
      <UserForm ref="drawerForm" mode="edit" :model="current" />
    </MyDrawer>
  </div>
</template>

<style scoped>
.tip {
  margin-top: 16px;
}
</style>
