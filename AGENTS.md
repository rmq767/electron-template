# 项目规则（AGENTS.md）

本文件是本项目的编码与协作契约，面向人和编码代理。
优先级：**用户当次明确指令 > 本文件 > README / DESIGN / docs**。三者冲突时，先改文档再改代码。

先读哪几份：

- 用法、脚本、环境变量 → [README.md](README.md)
- 架构、契约、实测记录、范围收缩 → [DESIGN.md](DESIGN.md)
- dialog / window 选型 → [docs/window-vs-dialog.md](docs/window-vs-dialog.md)

---

## 1. 不可破坏的承诺

1. **clone 即编译**：不得引入私有 `@platform/*` git 依赖、vxe-table 之类会打断安装的重组件。
2. **默认品牌只是示例**：`.env` 里的 `APP_NAME` 等值可以被任意替换；代码、组件、路由里**禁止写死品牌名、App ID、图标文件名**。
3. **桌面软件，不是网页后台**：任何界面改动都要保持无边框标题栏、深色侧栏、紧凑控件、桌面交互；不要回到大 Header + 大卡片的后台模板风格。
4. **登录目前只有 mock**：`admin / 123456`。没有明确的真实鉴权需求前，不虚构后端接口、不接真实登录。
5. **模板必须保持可验证**：typecheck、lint、build 是底线；UI 改动还必须在真实 Electron 窗口里点过。

---

## 2. 技术版本与依赖

- 以 [package.json](package.json) 为版本真源。主版本线保持：Electron 45、Vite 8、Vue 3.5、Vue Router 5、Pinia 4、Element Plus 2.14、TypeScript 6。
- **禁止把 TypeScript 升到 7.x**：`vue-tsc 3.3.x` 实测崩在 `ERR_PACKAGE_PATH_NOT_EXPORTED`；等 vue-tsc 适配后再议。
- 升级依赖前先问「官方内置 → 主流工程做法 → 第三方库」；能用现有能力解决就不加依赖。
- 新增依赖要同时满足：官方/主流、与 Electron 45 兼容、不影响 `pnpm install` 后直接编译。
- 包管理器统一 `pnpm`。不要修改全局 npm 配置；缓存/镜像问题按 README 排障表处理。
- 不提交 `node_modules/`、`out/`、`release/`、诊断包等生成物。

---

## 3. 进程边界

```
src/shared     纯类型 + 常量 + 无副作用函数；不得 import electron / vue / pinia / element-plus
src/main       窗口、系统集成、特权对话框、日志、存储；需要 Node 能力的逻辑只放这里
src/preload    唯一桥接层；只允许 electron + @shared，不含业务判断
src/renderer   普通 Vue 应用；禁 Node/electron，只认 window.api
```

- 必须走 `@shared` / `@main` / `@preload` / `@renderer` / `@` 别名，**禁止用相对路径绕过进程分面**。
- 新增依赖前确认它落在哪个进程；shared 不能因为「方便」引入运行时库。
- 新建 `BrowserWindow` 只能出现在 `src/main/window/`（主窗、登录窗、manager）；IPC handler 里不得直接 `new BrowserWindow`。
- preload 的实现必须继续满足 `satisfies Api`；少方法、返回类型不符要在编译期失败。

---

## 4. IPC

新增/修改通道按固定链路走：

1. `src/shared/ipc/channels.ts` 登记 channel（`域:动作`）
2. `src/shared/ipc/schema.ts` 补 `RequestSchema` / `EventSchema`
3. `src/main/ipc/*.handler.ts` 用 `handle()` 注册
4. `src/preload/api/*.ts` 实现，`src/preload/api/types.ts` 补 `Api`
5. 渲染层只调 `window.api.*`

硬规则：

- **全项目不用 `send`**；需要结果一律 `invoke`。
- 可预期结果作为返回值（取消返回 `null` / `{ok:false}`）；真异常一律 `throw`。
- 系统阻塞对话框必须标 `interactive: true`。
- 所有 handler 默认按 `senderId` 校验来源；`app:complete-login` 只认登录窗，`app:show-login` / `app:ui-ready` 只认主窗口。
- 事件订阅必须解绑；组件卸载走 `onScopeDispose`。
- 跨 IPC 只传可结构化克隆的 DTO：**禁止函数、class 实例、Vue ref、Pinia store**。
- 业务 DTO 放 `src/shared/types/`，不要在页面里临时造跨进程类型。

---

## 5. 窗口与弹层

- **默认用 dialog**。只有命中 [决策表](docs/window-vs-dialog.md) 的 6 条触发条件之一，才升级为独立窗口；一条都不命中就禁止用 window。
- 新增业务窗口 = 一条 `presets.ts` + 一条 `/w/:kind` 路由 + 一条 props/result 契约 + `WindowGate`。不建 BaseWindow 继承树。
- 登录窗与启动页都不是业务窗口，**不进入 `window/registry`**：
  - 需要登录（`APP_FEATURE_LOGIN=true` 且无会话）→ 登录窗本身作为启动面
  - 无需登录 / 已有会话 → 启动页等待主窗口 `app:ui-ready`，达到 `APP_SPLASH_MIN_MS` 后退场；主窗在启动页退场前只加载、不 show，任意时刻只允许一个窗口可见
  - 登录成功 → `app:complete-login` → 主窗口 `ready-to-show` 后关闭登录窗并显示主窗
  - 退出登录 → `app:show-login` → 登录窗就绪后销毁主窗口并显示登录窗
- 业务数据只走 `registry + HMR-safe GetPayload`；**URL / argv 只放 kind 与 windowId**，不要把业务 DTO 塞进 hash 或 `additionalArguments`。
- `win.on('closed')` 必须无条件 settle（取消/父窗关闭/崩溃都走它）；业务独立窗口必须接 `attachWindowLifecycle`，主窗/登录窗/启动页/业务窗都必须接 `attachWindowChrome`。
- Pinia 不跨窗口共享；需要跨窗口同步时必须先提出方案并确认，不能默默加广播层。
- 启动白闪仍用 `show:false + ready-to-show + backgroundColor`；启动页只服务于无需登录的启动等待，不是通用 splash，也不要为其他业务再造启动窗。
- 自定义标题栏只允许：主窗口 `app-titlebar`、登录窗/启动页 `window-brand-bar`、业务独立窗口 `window-shell`、控件 `window-controls`；窗口操作走 `window:*` IPC，不直接碰 Electron。

---

## 6. 配置与品牌

- 全局身份配置只放 `.env`：`APP_NAME` / `APP_TAGLINE` / `APP_ID` / `APP_ICON` / `APP_FEATURE_LOGIN` / `APP_SPLASH_MIN_MS`。
- 三端唯一读取入口是 `src/shared/constants/app.ts`；页面/主进程不得再写一份名称或图标。
- 环境差异只放 `.env.development` / `.env.production`；不要把同一份身份值复制到 mode 文件。
- `RENDERER_VITE_*` 会打进前端 bundle，**不是秘密**；密钥只能放 `MAIN_VITE_*`。
- `electron-builder.js` 与运行时读同一份 `.env`；新增构建期身份字段时同步改它。
- `APP_NAME` 决定 `userData` 目录（`%APPDATA%/<APP_NAME>`）；改名等于换数据目录，必须在 README 提示迁移。
- 不再引入 `RENDERER_VITE_FEATURE_LOGIN`、`electron-builder.yml` 或 `APP_USER_MODEL_ID` 这类第二真源。
- 品牌改名时同时检查：窗口标题、登录页、侧栏、菜单、安装包、图标、`userData` 路径。macOS 安装包图标仍使用 `build/icon.icns`，换品牌时要单独替换。

---

## 7. 界面系统

- 设计令牌只在 [styles/index.scss](src/renderer/src/styles/index.scss)；Element Plus 覆盖只在 [styles/element-theme.scss](src/renderer/src/styles/element-theme.scss)。
- 样式统一用 SCSS：组件写 `<style scoped lang="scss">`，ESLint 已强制；新增颜色/阴影先加 `--app-*` 令牌，light / dark 两侧同时补齐。
- **禁止在组件里写 `:deep(.el-dialog__header)` 这类局部 Element 覆盖**；要改就改主题文件，让全项目生效。
- 颜色、字号、间距、圆角、阴影一律用 token，不写死十六进制色值；亮/暗两套主题必须同时可用。
- 组件文件、模板标签、`defineOptions.name`、路由 `name` 一律 **kebab-case**；ESLint 已强制，不要关规则。
- 组件 API 不做 `size` 枚举档位；需要改宽度/高度就传具体值。
- 共用外观的浮层/控件抽成全局组件，不要每个页面复制一份样式。
- 表单保持两栏布局：单字段不独占一行，备注/长文本整行；不要退回单列大表单。
- 不要自加原型没有的控件、入口、分页、浮窗；冲突时先推动产品/后端确认。
- 已确认或已修复的界面视为冻结；只改点名的问题，不反复重做、不抢占演示镜头。
- 桌面控件基准：正文 13px、默认控件 32px、小号 26px、圆角 6/8/12px、标题栏 40px；ElMessage 距顶 52px。改基准必须同步 token 与本文件。
- 弹层必须 `append-to-body`：`.view` 的入场动画保留 `transform`，会把 `position: fixed` 的遮罩限制在内容区；遮罩要覆盖整个窗口、弹窗在视口居中。
- 新业务窗口用 `window-shell`，不要自己再写一套标题栏；主窗口专用 `app-titlebar`。

---

## 8. 状态、数据与接口

- 偏好与会话只走 `window.api.store`（`userData/settings.json`）；**禁止用 localStorage 存 token**。
- 日志落 `userData/logs/`，诊断包落 `userData/diagnostics/`；不做云端错误上报。
- HTTP 只使用 `src/renderer/src/api/http.ts` 的原生 fetch；`configureHttp` 在 `main.ts` 注入。
- 未配置 `RENDERER_VITE_API_BASE_URL` 时必须抛可读错误，**不虚构接口、不假装请求成功**。
- 接真实接口时：DTO 放 `shared/types`；字段与单位以接口实际返回 / OpenAPI 为准，**前端不做 `displayUnit` 之类兜底**；后端待改项单独整理，不在前端偷偷改口径。
- 401 只能说明接口存在，不等于接口缺失；先实测，确认真缺失再列「需后端配合」。
- 渲染层日志统一走 `window.api.log`，不要 console 代替业务日志。

---

## 9. 验证与交付

提交前必须跑：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

- typecheck / lint / build 只证明代码正确，**不证明 UI 正确**。
- 任何 UI / 交互 / 窗口 / 主题改动，都要在真实 Electron 里验证；推荐：
  `pnpm dev --remoteDebuggingPort=9222`，用 CDP 的真实指针点击（不要只调 `.click()`），并用 Win32 / 窗口标题确认窗口真的出现。
- UI 验证至少覆盖：亮/暗主题、启动页 → 主窗、登录窗 → 主窗、退出登录 → 登录窗、弹层打开/取消、独立窗口往返/关闭、标题栏最大化/还原。
- 多 agent 并行时，typecheck / lint / build 与浏览器/窗口实测由主 agent 统一跑一次；子 agent 不各自下结论。
- 不虚报验证结果：`electron-builder` 出安装包仍是本机未验证项，没跑通就说没跑通。
- 结束前清理自己启动的 Electron / dev server；只按项目路径精确结束进程，不杀无关 Electron 应用。
- 不跳过 husky / `--no-verify`；pre-commit 失败要修根因。
- 未明确要求不 `git commit`、不 `git push`、不创建 PR。

---

## 10. 文档同步

改代码必须同步改文档，至少检查：

- README：用法、脚本、环境变量、登录流程、目录与打包状态
- DESIGN：分层、窗口体系、IPC、界面系统、启动流程、实测记录
- docs/window-vs-dialog：决策表、边界案例、文件路径
- AGENTS.md：规则本身

文档口径：

- 不保留旧概念：`RENDERER_VITE_FEATURE_LOGIN`、`electron-builder.yml`、PascalCase 组件名、`MyDialog` 文案、独立的「登录页」路由说法。
- 实测记录只写真实测过的数字，并写测量方法；没测就写「未验证」。
- 不新增「计划 / 决策 / 分析」类中间文档；结论写进 DESIGN 或本文件。
- 改了规则、默认值、目录结构后，先更新文档再继续实现。

---

## 11. 范围收缩（未经明确要求不要做）

以下内容在当前模板里是**有意不做**，不要因为「看起来更完整」而补：

- 跨窗口状态同步层 / 全局 event bus
- `PopupHost` / `GlobalHost` 统一浮层抽象（出现真实需求再落）
- 自动更新壳（依赖真实分发基建）
- 代码签名（无证书会让构建失败）
- 测试基座 / Electron E2E 基建
- i18n、插件化 / 微内核
- 托盘常驻 / 开机自启
- `my-table` / `my-search` 等重组件移植
- 未点名的分页、浮窗、入口、动画特效

---

## 12. 协作方式

- 能由代理直接执行的安装、构建、运行、清理，直接做；不要给用户一串终端命令让他自己敲。
- 登录、授权、发布、删除远端资源这类需要用户身份或不可逆的动作，交给用户确认。
- 复杂改造按步骤增量交付：用户说「继续第 N 步」时，只完成该步并汇报，等确认再往下。
- 需要判断时给一个明确建议 + 代价，不要只丢菜单；但不要擅自改阈值或业务口径。
- 发现文档与代码冲突、数字可疑、旧结论失效时，先核实再改，不凭记忆下结论。
- 影响共享状态、会发出不可逆变更的操作（删除、force push、改配置）默认先说明并确认。
