/**
 * 三端共用的应用级常量。
 * 这里只放纯值与无副作用函数：不得 import electron / vue / element-plus，
 * 否则主进程与渲染进程会被迫打包同一份运行时依赖。
 */
export const APP_NAME = 'Electron Template'
