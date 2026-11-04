/**
 * 渲染层的环境变量类型与 CSS 副作用导入声明。
 * 单独成文件：与 vite/client 的 `/// <reference>` 分开，避免同名全局声明互相影响。
 */

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly RENDERER_VITE_API_BASE_URL?: string
  readonly RENDERER_VITE_FEATURE_LOGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const css: string
  export default css
}
