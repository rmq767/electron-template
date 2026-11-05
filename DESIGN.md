# DESIGN

模板的架构、契约、界面系统，以及**被有意砍掉的东西和理由**。
怎么用请看 [README.md](README.md)；弹窗选型请看 [docs/window-vs-dialog.md](docs/window-vs-dialog.md)。

默认品牌 `Aster` 只是示例：名称、副标题、App ID、图标文件名都在 `.env`，改一处三端与安装包同步。

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

## 配置：应用身份只有 .env 一处

```
.env                         APP_NAME / APP_TAGLINE / APP_ID / APP_ICON / APP_FEATURE_LOGIN
electron.vite.config.ts      loadEnv 后 define 注入 main / preload / renderer
src/shared/constants/app.ts  三端唯一读取入口（纯常量，不碰运行时环境）
electron-builder.cjs         同一份 .env → productName / appId / 运行时图标
```

为什么不用 `RENDERER_VITE_*` 前缀：应用身份是**三端共用**的，不是渲染层私有；
而且同一个值还要给 electron-builder 用。用 `define` 注入可以避免在三个进程里各读一次 env，
也避免在页面里再写死一份名称。图标从 `resources/<APP_ICON>` 读：开发取项目根目录，
打包由 `extraResources` 拷到 `resources/`，主进程只认 `process.resourcesPath` 这一条路径。

`app.setName(APP_NAME)` 在 `whenReady` 之前执行，`userData` 路径随之变成 `%APPDATA%/<APP_NAME>`；
这是有意为之——品牌改名时数据目录也跟着隔离，已有数据要自行迁移。

启动行为也放在同一份 `.env`：`APP_FEATURE_LOGIN` 决定是否走登录窗，
`APP_SPLASH_MIN_MS` 控制无需登录时启动页的最短展示时间。

---

## 窗口体系

```
main/window/presets.ts       窗口目录（默认空）：每种 kind 的外观、modal、skipTaskbar
main/window/registry.ts      Map<windowId, entry>，entry 内含 contentsId 与 pending[]
main/window/manager.ts       业务独立窗口的唯一入口：open/close/getPayload/pushProps/focus/closeAllWindows
main/window/lifecycle.ts     异常路径与实测埋点
main/window/main-window.ts   主窗口自身（无边框，标题栏由渲染层绘制）
main/window/login-window.ts  登录独立窗：400×560、无边框，不进 registry
main/window/splash-window.ts 启动页：400×460、无边框、跳过任务栏，不进 registry
main/window/app-flow.ts      启动 / 登录完成 / 退出登录的窗口切换与启动页退场条件
main/window/chrome.ts        自定义标题栏、窗口状态推送、senderId 反查与导航拦截
main/window/entry.ts         单入口 hash 路由，主窗/登录窗/启动页/业务窗口共用
main/window/app-icon.ts      从 .env 的 APP_ICON 解析运行时图标
```

新增一种业务窗口 = 一条 props/result 契约 + 一条 preset + 一条 `/w/:kind` 路由与页面。不建继承树。
**模板默认不内置业务窗口**：`WindowKind` 为空、`presets.ts` 为空对象，
但 manager / registry / lifecycle / `WindowGate` 与 `/w` 机制全部保留；不要因为模板瘦身删掉地基。
登录窗与启动页不进 registry：registry 的语义是「带参数进、带结果出的业务弹层」，
它们是一次性的应用入口切换，不属于这个生命周期模型。

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
因此模板把它写成 manager 里唯一一处关闭路径。示例窗口已随模板瘦身删除；
新增业务窗口后，可按 `docs/window-vs-dialog.md` 的边界案例做关闭/取消验证。

**当前只允许一个业务独立窗口**：`manager.openWindow` 先查 registry 里唯一存活的窗口。
同 kind 再次打开时聚焦 + `pushProps(新参数)`，调用方的 Promise 挂到同一个 entry 的 `pending[]`
上，窗口关闭时一起兑现；不同 kind 直接返回 `{ ok: false, reason: 'busy' }`。
多窗口并行与跨窗口同步都列入范围收缩，等出现真实需求再放开。

**Pinia 不跨窗口共享**（每窗口独立渲染进程 = 独立 store 实例）。
窗口被定义为"带参数进、带结果出"的短生命周期弹层，不建全局状态同步层。

**主窗口崩溃重建**：先建新主窗、再销毁旧窗。反过来会出现"零窗口"的瞬间，
`window-all-closed` 会直接把应用退掉。独立窗口崩溃只 settle `crashed`，不重建。

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
- 窗口控件（`window:minimize` / `toggle-maximize` / `get-state` / `close-self`）只作用于
  `senderId` 对应的那个窗口；最大化状态经 `evt:window-state` 回推，渲染层不靠猜。
- `app:complete-login` 只接受登录窗来源，`app:show-login` 只接受主窗口来源，
  `app:ui-ready` 只接受主窗口来源——窗口切换与启动页退场都是特权动作，
  不做「谁调都行」的通用通道（其他窗口也会跑同一份 bootstrap，非主窗通知直接忽略）。

没有代码生成步骤，也没有 ts-rest 类第三方。

---

## 弹层

`my-dialog` / `my-drawer` 同 API 形态：`v-model` + `title` + `footer` 插槽 + `$attrs` 透传，
只负责外观与默认契约；底部按钮由调用方放进 `footer`，不再提供 `confirm` / `cancel` 事件。
`confirmAction` 是函数式确认（返回 Promise&lt;boolean&gt;）。
`width`/`size` 只接受具体值，不做 size 枚举档位——要改就直接传值。

业务表单弹窗统一收敛为模块内 `components/form-dialog.vue`：
暴露 `open(FormType.ADD | FormType.EDIT, row)`，保存后 `emit('success', value)`，
页面只拿结果刷新列表。表单主体仍然不 import 弹层，因此同一份 `user-form` 可以继续
被 dialog、drawer 复用，需要时也能原样搬进独立窗口。

样式只有一份：Element Plus 基础样式 + `styles/element-theme.scss`（唯一覆盖点）。
组件内禁止再写 `:deep(.el-dialog__header)` 这类局部覆盖，
这样"弹窗头部圆角/内边距/最大高度"一改就全项目生效。

**契约**：业务表单主体不 import 弹层、不感知容器，只声明 props + emit。
这是"从 dialog 升级到 window 不重写业务"的前提，也是 `user-form` 能同时被
dialog、drawer 与（需要时的）独立窗口复用的原因。没有为此抽 `PopupHost` 之类的统一浮层抽象。

页面内声明是默认；全局单例（`GlobalHost`）**尚未实现**——模板里目前没有真正需要
"跨路由存活且不进独立窗口"的浮层，先建就是空壳。等出现该需求时再落，见"范围收缩"。

---

## 界面系统

**方向**：桌面软件，不是网页后台。亮色模式是浅色标题栏 + 浅色侧栏 + 浅灰工作区，
暗色模式整体反转；13px 基准字号、32px 控件高度、6/8/12px 圆角；
不用大 hero、彩色卡片、面包屑式后台头部。
主窗口、登录窗、启动页与独立窗口共用同一套无边框外壳，系统边框由 `window-controls` 自绘。

**令牌**（`styles/index.scss`，`html.dark` 是同语义映射）：

| 角色           | 亮色                  | 暗色                  | 用途              |
| -------------- | --------------------- | --------------------- | ----------------- |
| `canvas`       | `#f2f3f5`             | `#13161b`             | 工作区底色        |
| `surface`      | `#ffffff`             | `#1a1e25`             | 面板 / 输入框     |
| `border`       | `#e2e5ea`             | `#2a303a`             | 分割线与描边      |
| `ink` / muted  | `#171a21` / `#7d8797` | `#e9ecf1` / `#8792a2` | 主 / 次文本       |
| `accent-solid` | `#0f766e`             | `#12857a`             | 主按钮填充        |
| `accent`       | `#0f766e`             | `#5ed3c4`             | 可交互文字 / 图标 |
| `sidebar`      | `#fbfcfd`             | `#0e1115`             | 侧栏              |
| `titlebar`     | `#f7f8fa`             | `#0b0e12`             | 自定义标题栏      |

`styles/index.scss` 用 `$theme-tokens` 的 light / dark 两套 map 生成 `:root` 与 `html.dark`；
新增颜色、阴影令牌必须同时补齐两侧。标题栏、侧栏、窗口控件、品牌标与遮罩也全部走 `--app-*`，
组件里不出现十六进制色值。组件样式统一 `<style scoped lang="scss">`。

字体走系统 UI 栈（Segoe UI / PingFang / Microsoft YaHei）；正文 13px，页面标题 22px，
控件 12–13px，等宽字体用于版本、编码与路径。Element Plus 的映射与组件覆盖集中在
`styles/element-theme.scss`；暗色变量 `theme-chalk/dark/css-vars.css` 必须先于覆盖文件加载，
否则 `html.dark` 的 Element 变量会盖掉项目主题。

**列表页组件体系**：

```
components/my-search/       FilterItem 配置 + formData，搜索/重置 + 默认插槽放批量操作
components/my-table/        VxeColumn 配置 + field 插槽，vxe-table 封装（跨页多选/树表/虚拟滚动可用）
components/my-pagination/   v-model:page / v-model:size + total，emit('pagination', { page, size })
components/my-dialog/       v-model + title + footer 插槽 + $attrs
components/my-drawer/       与 my-dialog 同 API 形态
composables/useSearchFilter.ts    查询表单初值 + toApiParams（date-range 拆 start/end）
composables/useListPage.ts        搜索/重置/分页/排序事件
composables/useActivatedRefresh.ts keep-alive 页面回到前台时刷新
composables/useCheckboxSelection.ts 跨页多选（配合 checkbox-config.reserve）
```

页面固定组合：`<my-search>` → `<my-table>` → `<my-pagination>`，数据加载函数保持单一名字 `getList`。
组件在 `main.ts` 全局注册，类型声明在 `types/components.d.ts`；页面不重复 import。
`VxeColumn`、`FilterItem`、`OptionItem`、`FormType` 统一放 `types/common.ts`。

vxe-table 的主题不走局部覆盖：`element-theme.scss` 把 `--vxe-ui-*` 映射到 `--app-*`，
亮/暗两套主题随 `html.dark` 自动切换；CSP 需允许 `font-src 'self' data:`，否则 vxe 内联图标字体被拦截。

**组件**：

- `my-dialog` / `my-drawer` 必须 `append-to-body`：`.view` 的入场动画保留 `transform`，
  否则 `position: fixed` 的遮罩会被限制在内容区；弹层应覆盖整个窗口并在视口居中。
- `app-titlebar`：拖拽区 + 面包屑 + 主题/账户 + 窗口控件，主窗口专用。
- `window-brand-bar`：登录窗与启动页共用的品牌顶栏（品牌标 + 名称 + 窗口控件）。
- `window-shell`：业务独立窗口外壳；标题栏、正文滚动区与底部操作区只有一份。
- `.auth-window`：登录窗与启动页共用的品牌化背景（环境光渐变 + `--app-login-bg`）。
- `window-controls`：最小化 / 最大化 / 关闭，只发 `window:*` IPC，不直接碰 Electron。
- `brand-mark`：由 `APP_NAME` 首字母生成的字母标，品牌名一改就跟着变。
- `tab-bar` / `side-nav`：自绘标签与主题化导航（亮色浅底、暗色深底），不再用 Element Tabs/Menu 的默认外观。

**命名**：组件文件、模板标签、`defineOptions.name` 与路由 `name` 全部 kebab-case；
ESLint 的 `vue/component-definition-name-casing: kebab-case` 强制，
keep-alive 的 include 直接复用路由名。

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
`userData` 的实际路径由 `APP_NAME` 决定（Windows 为 `%APPDATA%/<APP_NAME>`）。

`bootstrap()` 先 `hydrate()` + `restore()`，再 `app.use(router)` + `mount()`：
router 安装即触发首次导航，提前安装会让守卫在 store 未水合时判定未登录，
把已登录用户错误弹回登录页——这是登录窗接管后实测踩到的时序坑。

---

## 启动流程

```
启动
 ├─ 需要登录（APP_FEATURE_LOGIN=true 且无 auth.session）→ 登录窗（400×560、无边框）
 │     └─ 登录成功 → app:complete-login → 建主窗 → ready-to-show 后关登录窗
 └─ 无需登录 / 已有会话 → 启动页（400×460、无边框、跳过任务栏）
       ├─ 启动页 ready-to-show 后创建主窗，但主窗保持隐藏、后台加载
       ├─ 主窗 app:ui-ready + 达到 APP_SPLASH_MIN_MS → 启动页关闭 → 主窗 show
       └─ 兜底：主窗超过 8s 没有首屏反馈也关闭启动页（APP_SPLASH_MIN_MS 更长时顺延）

退出登录 → app:show-login → 先建登录窗，再销毁主窗口（避免 window-all-closed 提前退出）
```

登录窗与启动页是两条**明确的启动路径**，都只做各自的事：

- 登录窗承载真实账号密码交互，完成后关闭并展示主窗口。
- 启动页只在无需登录时出现，等主窗口挂载完成（`app:ui-ready`）再退场；
  它由 `APP_SPLASH_MIN_MS` 控制最短展示时间，避免一闪而过。
- 启动页不是「遮白闪」的万能方案：白闪仍靠主窗口 `show: false` + `ready-to-show` + `backgroundColor` 解决。

`APP_FEATURE_LOGIN=false` 时跳过登录窗与鉴权守卫，直接走启动页 → 主窗口。
token 存 userData；401 → `clear()` → 守卫请求 `app:show-login`（浏览器预览退回 `/login`）。

---

## 安全基线

`contextIsolation: true`、`nodeIntegration: false`、`sandbox: false`
（官方 electron-vite 模板即为 false：沙箱化的 preload 无法加载打包后的模块）。
`setWindowOpenHandler` 在所有窗口上统一 deny（应用内不弹浏览器窗口，新窗口走 manager），
`will-navigate` 拦截跳出文档，外链仅 `http(s)` 交系统浏览器，
生产 `index.html` 带 CSP，preload 在 `!process.contextIsolated` 时**拒绝挂载**而不是退化成直接挂 window 全局。

不做云端错误上报（隐私 + 内网出口限制）。

---

## 范围收缩（有意不做，不是遗漏）

| 不做                                 | 理由                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 跨窗口状态同步层                     | 窗口是"参数进/结果出"的弹层；没有真实需求就先建就是提前抽象                                        |
| 多业务窗口并行                       | 当前同时只允许一个业务独立窗口；第二个 open 返回 busy，避免焦点、状态与测试成本提前膨胀            |
| `PopupHost` 统一浮层抽象             | 约定 props/emit 已足够支撑 dialog→window 迁移，成本几乎为零                                        |
| 全局 `GlobalHost` 浮层               | 模板里暂时没有"跨路由存活且不进独立窗口"的浮层需求                                                 |
| 自动更新                             | 依赖真实分发基建，模板里无法验收；写个跑不通的更新器是负收益。README 给了接入清单                  |
| 代码签名配置                         | 无证书时任何签名配置都会让构建失败                                                                 |
| 测试基座                             | 此刻没有可测的业务不变量，而 Electron E2E 基建成本远超模板收益；闸门是 typecheck+lint+真实点击验证 |
| i18n                                 | 单一语言场景下是纯负担                                                                             |
| 插件化 / 微内核                      | 后台类应用不需要                                                                                   |
| 托盘常驻 / 开机自启                  | 后台管理应用不需要常驻；开着只增加生命周期复杂度                                                   |
| 图表 / 字典 / 权限指令等后端耦合组件 | 依赖真实接口与模块划分；模板只保留可独立验证的列表页组件体系                                       |

---

## 实测记录（本模板的结论都从这里来）

| 事项                                   | 结果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript 7.0.2 + vue-tsc 3.3.14      | **不兼容**：`typecheck:web` 崩在 `ERR_PACKAGE_PATH_NOT_EXPORTED`（vue-tsc 解析 TS7 已移除的子路径）。已按授权回退 TS 6.0.3；router 5.4 / pinia 4.1 保留，至今无故障                                                                                                                                                                                                                                                                                                                                                                                 |
| 脚手架自带的 `baseUrl`                 | TS6 下是硬错误 TS5101，已移除，`paths` 改相对路径                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `electron-vite dev` 是否监听主进程     | **默认不监听**，`-w` 才监听；实测两轮 `rebuilt successfully` → `restarting electron app`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `@swc/core`（electron-vite 6 的 peer） | 实际未安装，dev/build 全通 → 该 peer 是条件路径，无需 hoist 兜底                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `externalizeDepsPlugin`                | v6 官方模板的 `main:{}` / `preload:{}` 为空配置即可，不再需要显式插件                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `BrowserWindow` 的 `title`             | 会被页面 `<title>` 覆盖（读 Win32 `MainWindowTitle` 确认）→ 标题与环境标记由渲染进程守卫负责                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 多实例共用 `userData`                  | Chromium 报 `Unable to move the cache: 拒绝访问 (0x5)` → 单实例锁在 dev 下刻意跳过                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Element Plus 引入方式                  | 全量引入。unplugin 按需的收益依赖"不写 import"，而组件里写显式 import 更稳，于是只剩 rolldown 兼容风险与两个生成文件 → 负收益                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ImportMetaEnv` 增强                   | 与 `/// <reference types="vite/client" />` 同文件会让 CSS 副作用导入和 `import.meta.env` 一起失效；已拆到 `types/ambient.d.ts`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| pnpm 10 构建脚本                       | 默认屏蔽 `electron-winstaller`，已登记进 `pnpm.onlyBuiltDependencies`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 越界引用                               | 双向探针均报 `TS2307`；6 个故意写错的 IPC 探针全部编译期报错                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| IPC 运行时                             | CDP 在渲染层实测 `window.api` 暴露 5 个命名空间（app / store / dialog / log / window）；`ui.theme` 写入后读回并落盘；日志按天落盘且 main/renderer 汇入同一文件                                                                                                                                                                                                                                                                                                                                                                                      |
| 窗口往返（历史，示例窗口已删）         | `open('user-form', props)` → 子窗口 `getPayload()` 拿到 DTO → `close(result)` → 调用方 `await` 得 `{ok:true,data}`；子窗口 URL 为 `#/w/user-form?windowId=…`，标题正确。模板瘦身后不再内置该窗口，地基与 URL 形态不变                                                                                                                                                                                                                                                                                                                               |
| 单窗口策略（历史，演示页已删）         | 2026-11-05 CDP 真实点击：落地页 `#/demo/popup`；dialog / drawer / confirm 正常；user-form 打开期间 export-task 返回 `{ok:false,reason:'busy'}`，反向亦然；同 kind 再次 open 不新建窗口且 `pushProps` 更新表单；关闭后按钮恢复；亮/暗主题与控制台均无告警                                                                                                                                                                                                                                                                                            |
| 主窗口崩溃重建                         | CDP `Page.crash` 后主进程记到 `render-process-gone`，新主窗创建并显示、应用未退出；先建新窗再销毁旧窗是关键，反序会触发 `window-all-closed` 直接退应用                                                                                                                                                                                                                                                                                                                                                                                              |
| 系统文件对话框                         | 改为异步 `showOpenDialog` / `showSaveDialog`，父窗用 `senderId` 反查（不是 `BrowserWindow.fromId`）；ESC 取消返回 `null`，等待期间主进程事件循环不被阻塞                                                                                                                                                                                                                                                                                                                                                                                            |
| 鉴权 / 登录窗切换                      | CDP 真实点击登录按钮 → 登录窗关闭、主窗展示落地页、标题栏显示"系统管理员"；退出登录 → 先建登录窗再销毁主窗，未误触 `window-all-closed`。落地页现为 `#/system/user`                                                                                                                                                                                                                                                                                                                                                                                  |
| 启动页                                 | 400×460 启动页创建 → 主窗后台加载（实测 `visible:false`）→ 达到 `APP_SPLASH_MIN_MS` 后启动页退场、主窗 show；任意时刻只有一个窗口可见；`app:ui-ready` 只认主窗口来源                                                                                                                                                                                                                                                                                                                                                                                |
| 主窗口首屏导航时序                     | router 在 `hydrate()/restore()` 前安装会先跑守卫，把有会话的用户误判未登录并切回登录窗；改为 restore 完成后再 `app.use(router)`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 自定义窗口控件                         | 最大化/还原后 `evt:window-state` 回推正确，图标切换；子窗口点标题栏 X 返回 `{ok:false, reason:'cancelled'}` 而不抛异常                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 桌面主题覆盖顺序                       | Element 暗色变量必须先于 `element-theme.scss`；反过来 `html.dark` 会盖掉项目令牌。亮/暗两套主题、文字按钮、plain 按钮均已实测                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 弹层遮罩主题化                         | Element 的 `.el-overlay` 实际读 `--el-overlay-color-lighter`（不是 `--el-mask-color`）；已映射到 `--app-mask`，亮色 `rgba(8,12,18,.42)`、暗色 `rgba(0,0,0,.55)`，CDP 实测 computed `backgroundColor` 与令牌一致                                                                                                                                                                                                                                                                                                                                     |
| kebab-case 强制                        | 文件、模板标签、`defineOptions.name` 与路由 name 统一后，ESLint `vue/component-definition-name-casing` 零告警；标签页 keep-alive 正常                                                                                                                                                                                                                                                                                                                                                                                                               |
| 窗口首屏延迟 / 内存                    | 174–213ms / 约 150MB working set（高估，见 window-vs-dialog）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **中文路径是不是打包障碍**             | **分阶段结论**：下载阶段不是；**输出目录移动阶段是**。默认 `release/` 在中文路径下解压 Electron 后会 `EBUSY`（`default_app.asar`），把输出指到 ASCII 路径（`BUILD_OUTPUT_DIR`）后 `--dir` / `--win` 均通过。此前"路径完全无关"的结论只覆盖了下载阶段，已修正                                                                                                                                                                                                                                                                                        |
| **electron-builder 出安装包**          | **已通过**（2026-11-04）：`build:unpack` 与 `build:win` 均成功；NSIS setup 约 117MB、portable 约 106MB、`app.asar` 约 3MB、`win-unpacked` 约 360MB。Electron 下载必须显式给 `ELECTRON_MIRROR`（不读 `.npmrc`），否则 158MB zip 下载后超时；无证书时签名为 `NotSigned`                                                                                                                                                                                                                                                                               |
| 构建产物膨胀 / 旧资源入包              | `out/renderer/assets` 的 hash chunk 不会自动清空，269 个文件里混着旧 PascalCase chunk；`files` 还会把项目内旧的 `release*/` 打进 asar，实测 `app.asar` 达 389MB。修复：build 前 `pnpm clean`，并排除 `release*/**`、`dist*/**`；修复后 `app.asar` 3MB                                                                                                                                                                                                                                                                                               |
| 列表页组件体系（历史，含已删页面）     | 2026-11-05 CDP 真实指针实测：搜索过滤（12 → 1 条）、分页第 2 页、新增/编辑/删除弹窗、角色抽屉、独立窗口取消回传、亮/暗主题；`pnpm typecheck` / `lint` / `build` 全通过。首轮运行期 console 报 vxe tooltip 模式与 CSP `font-src` 拦截，已分别改为 `tooltip-config.mode=title` 与 `font-src 'self' data:`，复测无 Vue/vxe 告警                                                                                                                                                                                                                        |
| 模板瘦身 / 亮色 chrome（2026-11-05）   | CDP 真实指针 + Win32：落地页 `#/system/user`，侧栏只剩“用户管理”；亮色 computed `titlebar rgb(247,248,250)`、`sidebar rgb(251,252,253)`，暗色 `rgb(11,14,18)` / `rgb(14,17,21)`，主题按钮双向切换正常；退出登录 → 登录窗（Win32 `IsWindowVisible=true`，主窗目标消失）→ 登录 → 主窗 `#/system/user`；`APP_SPLASH_MIN_MS=2500` 时启动页创建、主窗 `visible:false` 后台加载、约 2.5s 后主窗显示且仅一个窗口可见；用户列表搜索 12→1、重置 1→10、弹窗遮罩 1280×802 全窗覆盖并居中、取消后恢复；控制台零告警；`pnpm typecheck` / `lint` / `build` 全通过 |
| vxe-table 引入后打包体积               | **未重新打包测量**。`pnpm build` 通过，renderer 产物约 3.34MB JS + 1.10MB CSS；`app.asar` 体积需在下次 `build:unpack` 时重测，不沿用旧的 3MB 结论                                                                                                                                                                                                                                                                                                                                                                                                   |
| Node `fs.rmSync` 清理 `out/`           | Node 24.9 在本机中文路径下对 `out/` 递归删除会**静默失败**（不抛错也不删除）；改为逐项 `unlinkSync` / `rmdirSync` 后可靠清空                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `electron-builder` 命令被配置遮蔽      | 配置文件原名 `electron-builder.js` 与 CLI 同名；Windows `cmd` 的 `where` 会优先命中当前目录的配置文件，`build:win` 里的 `electron-builder` 实际执行了配置文件并静默退出 0（没有安装包）。改名为 `electron-builder.cjs` 后恢复                                                                                                                                                                                                                                                                                                                       |
