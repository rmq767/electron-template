import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts'
          }
        }
      ]
    }
  },
  {
    // scripts/ 下是给 node 直接跑的纯 JS 工具，不适用 TS 项目的写法约束
    files: ['scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  {
    // 三端边界：共享层与主进程不得引入渲染层运行时，反之亦然
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'electron', message: 'shared 层只放纯类型与常量，不得依赖 electron。' },
            { name: 'vue', message: 'shared 层不得依赖 vue。' },
            { name: 'pinia', message: 'shared 层不得依赖 pinia。' },
            { name: 'element-plus', message: 'shared 层不得依赖 element-plus。' }
          ]
        }
      ]
    }
  },
  {
    files: ['src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@renderer/*', '@/*', 'vue', 'pinia', 'element-plus'],
              message: 'preload 只允许依赖 electron 与 @shared。'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/main/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@renderer/*', '@/*', 'vue', 'pinia', 'element-plus'],
              message: '主进程不得依赖渲染层运行时。'
            }
          ]
        }
      ],
      'no-console': ['error', { allow: ['error'] }]
    }
  },
  {
    // logger 本身就是「控制台 + 落盘」的汇聚点，允许直接写 console
    files: ['src/main/log/logger.ts'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@main/*', '@preload/*', 'electron'],
              message: '渲染层只能通过 window.api 触达宿主能力。'
            }
          ]
        }
      ]
    }
  },
  eslintConfigPrettier
)
