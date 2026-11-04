import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 标签页与窗口标题用的中文名。 */
    title?: string
    /** 不在侧边栏出现（调试页、404 等）。 */
    hidden?: boolean
    /** 侧边栏分组标题，相同值归为一组。 */
    group?: string
    /** 该路由只能在独立窗口上下文里访问。 */
    window?: boolean
  }
}
