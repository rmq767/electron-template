import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const renderer = resolve('src/renderer/src')
const shared = resolve('src/shared')

// 别名按进程分面配置：主进程/preload 拿不到 @ 与 @renderer，渲染进程拿不到 @main 与 @preload。
// 这样越界引用在构建期就会失败，而不只依赖 lint 约定。
const nodeAlias = {
  '@shared': shared,
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload')
}

const webAlias = {
  '@': renderer,
  '@renderer': renderer,
  '@shared': shared
}

export default defineConfig({
  main: {
    resolve: { alias: nodeAlias }
  },
  preload: {
    resolve: { alias: nodeAlias }
  },
  renderer: {
    // 生产包用 file:// 加载，绝对路径 /assets 会取不到资源
    base: './',
    resolve: { alias: webAlias },
    plugins: [vue()]
  }
})
