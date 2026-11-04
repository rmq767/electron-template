import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import { loadEnv } from 'vite'
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

export default defineConfig(({ mode }) => {
  // 应用身份只有 .env 一处真源；这里统一注入三端，业务代码从 @shared/constants/app 读。
  const env = loadEnv(mode, process.cwd(), '')
  const splashMin = Number.parseInt(env.APP_SPLASH_MIN_MS ?? '', 10)
  const appDefine = {
    __APP_NAME__: JSON.stringify(env.APP_NAME?.trim() || 'Aster'),
    __APP_TAGLINE__: JSON.stringify(env.APP_TAGLINE?.trim() || ''),
    __APP_ID__: JSON.stringify(env.APP_ID?.trim() || 'com.aster.desktop'),
    __APP_ICON__: JSON.stringify(env.APP_ICON?.trim() || 'icon.png'),
    __APP_FEATURE_LOGIN__: JSON.stringify(env.APP_FEATURE_LOGIN !== 'false'),
    __APP_SPLASH_MIN_MS__: JSON.stringify(Number.isFinite(splashMin) ? Math.max(0, splashMin) : 900)
  }

  return {
    main: {
      resolve: { alias: nodeAlias },
      define: appDefine
    },
    preload: {
      resolve: { alias: nodeAlias },
      define: appDefine
    },
    renderer: {
      // 生产包用 file:// 加载，绝对路径 /assets 会取不到资源
      base: './',
      resolve: { alias: webAlias },
      define: appDefine,
      plugins: [vue()]
    }
  }
})
