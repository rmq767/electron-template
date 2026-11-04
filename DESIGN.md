# DESIGN

模板的架构、契约，以及**被有意砍掉的东西和理由**。
怎么用请看 [README.md](README.md)；弹窗选型请看 [docs/window-vs-dialog.md](docs/window-vs-dialog.md)。

---

## 分层

```
src/shared     三端共用的纯类型 + 常量 + 无副作用函数
src/main       主进程：窗口生命周期、系统集成、特权对话框、日志与存储
src/preload    唯一桥接层：contextBridge 暴露最小面，不含业务判断
src/renderer   渲染进程：普通 Vue 应用，禁 Node，只认 window.api
```

边界靠三重机制而非口头约定：

1. **别名分面**：`main`/`preload` 的 `resolve.alias` 里没有 `@` 与 `@renderer`，渲染层的别名里没有 `@main`/`@preload` → 越界 import 在构建期 `TS2307`。
2. **eslint `no-restricted-imports`**：拦住别名管不到的情况（`shared` 引 electron、渲染层引 `electron` 包）。
3. **`satisfies Api`**：preload 的实现与 `Api` 接口在编译期对齐，少一个方法直接报错。

判断口径：**只有需要 Node 能力的逻辑才进主进程**。

---

## 窗口体系

```
main/window/presets.ts     窗口目录：每种 kind 的外观、modal、singleton、skipTaskbar
main/window/registry.ts    Map<windowId, entry>，entry 内含 contentsId 与 pending[]
main/window/manager.ts     唯一能 new BrowserWindow 的地方：open/close/getPayload/pushProps/focus/closeAllWindows
main/window/lifecycle.ts   异常路径与实测埋点
main/window/main-window.ts 主窗口自身
```

新增一种窗口 = 一条 preset + 一条 `/w/:kind` 路由 + 一条 props/result 契约。不建继承树。

**传参：身份与数据分通道**

| 通道                            | 承载                            | 理由                                    |
| ------------------------------- | ------------------------------- | --------------------------------------- |
| hash query                      | `kind` + `windowId`             | 可调试、HMR 后仍在                      |
| `additionalArguments`           | `--window-id` / `--window-kind` | 挂载前同步可得，且只有两个短字符串      |
| registry + `invoke(GetPayload)` | 业务 DTO                        | 类型完整、可二次推送、不泄漏进 URL/argv |

把业务数据塞进 URL 或 argv 是这套设计里最容易犯的早期错误，所以显式禁止。
`WindowGate` 负责"参数还没回来时显示骨架"，顺带解决了窗口先出、内容后到的观感问题。

**回传：Promise 化 + 无条件兜底**

`openWindow()` 返回的 Promise 由 registry 的 `pending[]` 持有。
`win.on('closed')` 里**无条件 settle**（用户点 X、ESC、父窗口关闭、崩溃都走这里），
崩溃经 `render-process-gone` 返回 `{ok:false, reason:'crashed'}`。
漏掉兜底 = 调用方 `await` 永久悬挂，这是多窗口体系最高发的缺陷，
因此模板把它写成 manager 里唯一一处关闭路径，并在 demo 页提供四种关闭方式供验证。

`singleton` 命中已存在窗口时：聚焦 + `pushProps(新参数)`，调用方的 Promise 挂到同一个 entry 的 `pending[]` 上，窗口关闭时一起兑现。

**Pinia 不跨窗口共享**（每窗口独立渲染进程 = 独立 store 实例）。
窗口被定义为"带参数进、带结果出"的短生命周期弹层，不建全局状态同步层。

---

## IPC

`channels.ts`（唯一真源）→ `schema.ts`（`RequestSchema` / `EventSchema` 契约）→
`main/ipc/handle.ts`（来源校验 + 慢调用告警 + 异常落日志）→
`preload/ipc.ts`（typed `invoke` / `on`，`on` 返回解绑函数）→
`preload/api/*.ts`（业务形状的 `Api`）→ `index.d.ts`（`declare global`）。

口径：

- 需要结果一律 `invoke`；**`send` 全项目不用**。
- 可预期的业务结果用返回值（取消返回 `null` / `{ok:false}`），真异常一律 throw。
- 交互型通道（系统对话框）标 `interactive: true`，否则"用户思考了 3 秒"会被记成慢调用告警，噪声会教人忽略告警。
- 事件订阅必须解绑，`onScopeDispose` 统一处理。

没有代码生成步骤，也没有 ts-rest 类第三方。

---

## 弹层

`MyDialog` / `MyDrawer` 同 API 形态，`MyConfirm` 是函数式确认（返回 Promise<boolean>）。
`width`/`size` 只接受具体值，不做 size 枚举档位——要改就直接传值。

样式只有一份：Element Plus 基础样式 + `styles/element-theme.css`（唯一覆盖点）。
组件内禁止再写 `:deep(.el-dialog__header)` 这类局部覆盖，
这样"弹窗头部圆角/内边距/最大高度"一改就全项目生效。

**契约**：业务表单主体不 import 弹层、不感知容器，只声明 props + emit。
这是"从 dialog 升级到 window 不重写业务"的前提，也是 `UserForm` 能同时被三处复用的原因。
没有为此抽 `PopupHost` 之类的统一浮层抽象。

页面内声明是默认；全局单例（`GlobalHost`）**尚未实现**——模板里目前没有真正需要
"跨路由存活且不进独立窗口"的浮层，先建就是空壳。等出现该需求时再落，见"范围收缩"。

---

## 状态与数据

| 内容       | 位置                          | 理由                                                                           |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------ |
| 偏好、会话 | `userData/settings.json`      | 独立窗口各有 Web Storage，只有主进程那份唯一；也不把 token 明文放 localStorage |
| 日志       | `userData/logs/`              | 按天分片、写满 10MB 切 `.1/.2`、保留 14 天；自建 ~90 行，不引 electron-log     |
| 诊断       | `userData/diagnostics/*.json` | 含环境与日志尾部，不引 zip；菜单与 IPC 共用一份实现                            |
| 业务数据   | `api/http.ts`（原生 fetch）   | 不引 axios：只需要基址、token、超时、401 联动，少一个依赖                      |

`configureHttp({ getToken, onUnauthorized })` 在 `main.ts` 注入，避免 http ↔ store 循环依赖。
未配置 `RENDERER_VITE_API_BASE_URL` 时 `request()` 抛可读错误，**不虚构后端接口**。

`bootstrap()` 先 `hydrate()` + `restore()` 再 `mount()`：
否则首次导航时守卫会在 store 未水合时判定未登录，把已登录用户错误弹回登录页。

---

## 启动流程

不做独立 splash 窗口（理由见 window-vs-dialog 的边界案例 3）。
主窗口 `show: false` + `ready-to-show` + `backgroundColor`；需要等待的重活走应用内路由 + 骨架屏。

登录页保留，`RENDERER_VITE_FEATURE_LOGIN=false` 可关（关掉只是守卫短路，保留比删除便宜）。
token 存 userData；401 → `clear()` → 守卫弹回 `/login?redirect=`。

---

## 安全基线

`contextIsolation: true`、`nodeIntegration: false`、`sandbox: false`
（官方 electron-vite 模板即为 false：沙箱化的 preload 无法加载打包后的模块）。
`setWindowOpenHandler` 一律 deny（应用内不弹浏览器窗口，新窗口走 manager），
`will-navigate` 拦截跳出文档，外链仅 `http(s)` 交系统浏览器，
生产 `index.html` 带 CSP，preload 在 `!process.contextIsolated` 时**拒绝挂载**而不是退化成直接挂 window 全局。

不做云端错误上报（隐私 + 内网出口限制）。

---

## 范围收缩（有意不做，不是遗漏）

| 不做                              | 理由                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| 跨窗口状态同步层                  | 窗口是"参数进/结果出"的弹层；没有真实需求就先建就是提前抽象                                        |
| `PopupHost` 统一浮层抽象          | 约定 props/emit 已足够支撑 dialog→window 迁移，成本几乎为零                                        |
| 全局 `GlobalHost` 浮层            | 模板里暂时没有"跨路由存活且不进独立窗口"的浮层需求                                                 |
| 自动更新                          | 依赖真实分发基建，模板里无法验收；写个跑不通的更新器是负收益。README 给了接入清单                  |
| 代码签名配置                      | 无证书时任何签名配置都会让构建失败                                                                 |
| 测试基座                          | 此刻没有可测的业务不变量，而 Electron E2E 基建成本远超模板收益；闸门是 typecheck+lint+真实点击验证 |
| i18n                              | 单一语言场景下是纯负担                                                                             |
| 插件化 / 微内核                   | 后台类应用不需要                                                                                   |
| 托盘常驻 / 开机自启               | 后台管理应用不需要常驻；开着只增加生命周期复杂度                                                   |
| `my-table` / `my-search` 等重组件 | 会带来 vxe-table 与私有 `@platform/*` git 依赖，模板必须能被任何人 clone 即编译                    |

---

## 实测记录（本模板的结论都从这里来）

| 事项                                   | 结果                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript 7.0.2 + vue-tsc 3.3.14      | **不兼容**：`typecheck:web` 崩在 `ERR_PACKAGE_PATH_NOT_EXPORTED`（vue-tsc 解析 TS7 已移除的子路径）。已按授权回退 TS 6.0.3；router 5.4 / pinia 4.1 保留，至今无故障                                                                                                                                |
| 脚手架自带的 `baseUrl`                 | TS6 下是硬错误 TS5101，已移除，`paths` 改相对路径                                                                                                                                                                                                                                                  |
| `electron-vite dev` 是否监听主进程     | **默认不监听**，`-w` 才监听；实测两轮 `rebuilt successfully` → `restarting electron app`                                                                                                                                                                                                           |
| `@swc/core`（electron-vite 6 的 peer） | 实际未安装，dev/build 全通 → 该 peer 是条件路径，无需 hoist 兜底                                                                                                                                                                                                                                   |
| `externalizeDepsPlugin`                | v6 官方模板的 `main:{}` / `preload:{}` 为空配置即可，不再需要显式插件                                                                                                                                                                                                                              |
| `BrowserWindow` 的 `title`             | 会被页面 `<title>` 覆盖（读 Win32 `MainWindowTitle` 确认）→ 标题与环境标记由渲染进程守卫负责                                                                                                                                                                                                       |
| 多实例共用 `userData`                  | Chromium 报 `Unable to move the cache: 拒绝访问 (0x5)` → 单实例锁在 dev 下刻意跳过                                                                                                                                                                                                                 |
| Element Plus 引入方式                  | 全量引入。unplugin 按需的收益依赖"不写 import"，而组件里写显式 import 更稳，于是只剩 rolldown 兼容风险与两个生成文件 → 负收益                                                                                                                                                                      |
| `ImportMetaEnv` 增强                   | 与 `/// <reference types="vite/client" />` 同文件会让 CSS 副作用导入和 `import.meta.env` 一起失效；已拆到 `types/ambient.d.ts`                                                                                                                                                                     |
| pnpm 10 构建脚本                       | 默认屏蔽 `electron-winstaller`，已登记进 `pnpm.onlyBuiltDependencies`                                                                                                                                                                                                                              |
| 越界引用                               | 双向探针均报 `TS2307`；6 个故意写错的 IPC 探针全部编译期报错                                                                                                                                                                                                                                       |
| IPC 运行时                             | CDP 在渲染层实测 `window.api` 暴露 4 个命名空间；`ui.theme` 写入后读回并落盘；日志按天落盘且 main/renderer 汇入同一文件                                                                                                                                                                            |
| 窗口往返                               | `open('user-form', props)` → 子窗口 `getPayload()` 拿到 DTO → `close(result)` → 调用方 `await` 得 `{ok:true,data}`；子窗口 URL 为 `#/w/user-form?windowId=…`，标题正确                                                                                                                             |
| 鉴权                                   | CDP 真实点击登录按钮 → 落地 `#/home`、头部显示"系统管理员"、侧栏 6 项                                                                                                                                                                                                                              |
| 窗口首屏延迟 / 内存                    | 174–213ms / 约 150MB working set（高估，见 window-vs-dialog）                                                                                                                                                                                                                                      |
| **中文路径是不是打包障碍**             | **不是**。同代码在 `D:\Projects\后台模板\electron-template` 与纯 ASCII 的 `D:\t\et` 推进到完全相同阶段、卡在同一处（`Timeout awaiting 'request' for 600000ms`，下载 winCodeSign/nsis 工具链）。原计划里"出包必须去 ASCII 路径"的假设**被证伪**，README 排障表已按实测改写                          |
| **electron-builder 出安装包**          | **未通过**，阻塞在网络下载工具链 + 输出目录被外部句柄锁住（无 electron 进程时 `default_app.asar` 仍 busy、跨盘 `mv` Permission denied）。属于本机环境问题，不是模板配置问题：`electron.vite.config.ts` 的 `base:'./'` 与 hash 路由已就位，`electron-builder.yml` 的 nsis/portable 配置未经真机验证 |
