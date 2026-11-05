<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import type { FilterItem, SearchFieldValue, SearchForm } from '@renderer/types/common'

defineOptions({ name: 'my-search' })

const props = withDefaults(
  defineProps<{
    filters: FilterItem[]
    formData: SearchForm
    noBorder?: boolean
  }>(),
  { noBorder: false }
)

const emit = defineEmits<{
  search: []
  reset: [resetForm: () => void]
}>()

const formRef = ref<FormInstance>()

/** computed 代理：formData 由父组件持有，这里只改它的属性，不替换引用。 */
const formModel = computed(() => props.formData)

function asText(value: SearchFieldValue): string {
  if (value === undefined) return ''
  return Array.isArray(value) ? value.join(',') : String(value)
}

function setField(prop: string, value: unknown): void {
  formModel.value[prop] = value as SearchFieldValue
}

function onReset(): void {
  emit('reset', () => formRef.value?.resetFields())
}
</script>

<template>
  <div class="app-search" :class="{ 'app-search--plain': noBorder }">
    <el-form ref="formRef" class="app-search__form" :model="formModel" inline @submit.prevent>
      <el-form-item v-for="item in filters" :key="item.prop" :label="item.label" :prop="item.prop">
        <el-input
          v-if="item.type === 'input'"
          :model-value="asText(formModel[item.prop])"
          :placeholder="item.placeholder || `请输入${item.label}`"
          clearable
          @update:model-value="setField(item.prop, $event)"
        />
        <el-select
          v-else-if="item.type === 'select'"
          :model-value="formModel[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          clearable
          @update:model-value="setField(item.prop, $event)"
        >
          <el-option
            v-for="option in item.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
            :disabled="option.disabled"
          />
        </el-select>
        <el-date-picker
          v-else-if="item.type === 'date-picker'"
          :model-value="formModel[item.prop]"
          :type="item.pickerType ?? 'date'"
          :value-format="item.valueFormat ?? 'YYYY-MM-DD'"
          :placeholder="item.placeholder || `请选择${item.label}`"
          @update:model-value="setField(item.prop, $event)"
        />
        <el-date-picker
          v-else-if="item.type === 'date-range'"
          :model-value="formModel[item.prop]"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @update:model-value="setField(item.prop, $event)"
        />
        <slot v-else-if="item.type === 'slot'" :name="item.slot || item.prop" />
      </el-form-item>

      <el-form-item class="app-search__submit">
        <el-button type="primary" :icon="Search" @click="emit('search')">搜索</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div v-if="$slots.default" class="app-search__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-search {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px 18px;
  padding: 14px 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
}

.app-search--plain {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.app-search__form {
  min-width: 0;
  flex: 1 1 460px;
}

.app-search__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding-top: 1px;
}
</style>
