# Electron Desktop Template

Electron + Vue 3 + Element Plus + vxe-table + Vite + Vue Router + Pinia + TypeScript 的桌面端快速开发模板。
目标不是"演示能跑"，而是**拉下来就能写业务、并且知道每个决定为什么这么做**。

默认外观是桌面软件外壳：无系统边框的自定义标题栏、随主题切换的标题栏与侧栏、编辑器式标签栏与紧凑的数据面板，
**不是网页后台模板**。品牌名、副标题、图标与 App ID 全部由 [.env](.env) 驱动（默认 `Aster`）。

主窗口默认只内置**用户管理**（搜索 / 分页 / 新增 / 编辑 / 删除）。此前的 demo 页、角色管理、
系统设置与 IPC 调试页已移除；用户表单、导出任务两个示例独立窗口也已删除，
但 `main/window` 的 manager / registry / presets 地基保留，按「弹窗该用 dialog 还是 window」
一节的配方可以随时加回业务窗口。模板默认没有内置业务独立窗口，presets 为空。

---

## 30 秒上手

```bash
pnpm install     # postinstall 会自动下载 Electron 二进制并装原生依赖
pnpm dev         # 起窗 + 三端热更（含主进程，见下文 -w）
```

开发环境要求：Node `^20.19 || >=22.12`、pnpm 9/10、git。
装依赖前先跑一次 `pnpm check:env`，它会检查缓存目录是否落在 ASCII 路径上。

启动分两条路径：**需要登录**时先出现独立登录窗（400×560、无系统边框），登录完成由主进程关闭登录窗并展示主窗口；
**无需登录或已有会话**时先出现启动页（400×460），主窗口在后台加载但保持隐藏；启动页等主窗口渲染完成（`app:ui-ready`）并达到最短展示时间后关闭，这时主窗口才会出现。
主窗口退出登录会切回登录窗。模板内置 mock 账号 **admin / 123456**（不连任何后端）。
不需要登录就把 `.env` 里的 `APP_FEATURE_LOGIN` 改成 `false`，登录窗与鉴权守卫一起短路，改走启动页路径。

---

## 脚本

| 命令                        | 作用                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                  | `electron-vite dev -w`。**`-w` 是必须的**：不加它主进程与 preload 的改动不会重建重启（实测确认，这是 electron-vite 6 的默认行为） |
| `pnpm dev:renderer`         | 只起渲染层 dev server，不拉 Electron                                                                                              |
| `pnpm build`                | clean + typecheck + 三端构建，产物在 `out/`                                                                                       |
| `pnpm clean`                | 只清空 `out/`，不碰 `release/` 与用户数据                                                                                         |
| `pnpm build:win`            | 上一步 + electron-builder 出 NSIS 安装包与 portable                                                                               |
| `pnpm build:unpack`         | 只出 `win-unpacked/`，验证 file:// 加载最快（默认在 `release/`）                                                                  |
| `pnpm typecheck`            | `tsc -p tsconfig.node.json` + `vue-tsc -p tsconfig.web.json`，两套 lib 分开                                                       |
| `pnpm lint` / `pnpm format` | ESLint 10 flat config / Prettier                                                                                                  |
| `pnpm check:env`            | 环境与路径自检                                                                                                                    |

提交前自动跑 `lint-staged`（eslint --fix 已内含 prettier 规则）+ 全量 `typecheck`。

---

## 三端边界

```
src/main      主进程    可用 Node / Electron API
src/preload   桥接层    只允许依赖 electron + @shared，不含任何业务判断
src/renderer  渲染进程  普通 Vue 应用，禁用 Node，只能通过 window.api 触达宿主
src/shared    共用层    纯类型 + 常量 + 无副作用函数，不得 import electron/vue/pinia/element-plus
```

判断口径只有一条：**需要 Node 能力（文件系统、进程、系统集成、特权对话框）的逻辑才进主进程**，其余一律留在渲染层。

这套边界不只靠约定。别名按进程分面配置，越界引用**在构建期就失败**：

```ts
// src/main 里 import '@renderer/...'  → TS2307 Cannot find module
// src/renderer 里 import '@main/...'   → TS2307 Cannot find module
```

再加上 eslint 的 `no-restricted-imports`，把 `shared` 引 electron、渲染层引 `electron` 这类情况也拦下。

---

## IPC：加一个通道要动哪几处

1. `src/shared/ipc/channels.ts` 登记 channel 字面量（唯一真源）
2. `src/shared/ipc/schema.ts` 的 `RequestSchema` 补 `{ req, res }` 契约
3. `src/main/ipc/*.handler.ts` 用 `handle()` 注册（来源校验、慢调用告警、异常落日志都在 `handle` 里，业务不用重写）
4. `src/preload/api/*.ts` 实现，`types.ts` 补 `Api` 声明 —— `satisfies Api` 会立刻告诉你少写了方法
5. 渲染层直接 `window.api.xxx()`，全自动补类型

**没有代码生成步骤，也没有 ts-rest 之类的第三方。**

### 口径约定

- 需要返回值一律 `invoke`。**`send` 全项目不用**：它没有返回、无法感知失败、错误不会 reject。
- 主进程主动推送走 `EventSchema` + `webContents.send`，`on()` 返回解绑函数，`onScopeDispose` 里必须解绑（多窗口最常见的泄漏点）。
- 失败口径：**可预期的业务结果作为返回值**（如用户取消文件对话框返回 `null`、窗口取消返回 `{ok:false, reason:'cancelled'}`）；**真正的异常一律 throw**，由 Promise reject 承载。
- 系统级阻塞对话框要标 `interactive: true`，否则"用户点了 3 秒"会被记成慢调用告警。

### 序列化红线

`props` / `result` 走结构化克隆，**不能传函数、class 实例、Vue `ref`、Pinia store 本体**。
跨 IPC 只传 DTO（`toRaw()` 后的纯对象），DTO 一律放 `src/shared/types/`。

---

## 弹窗该用 dialog 还是 window

**这是本模板最该先读的一页** → [docs/window-vs-dialog.md](docs/window-vs-dialog.md)

一句话：**默认用 dialog**，只有命中"并排操作 / 独立任务栏条目 / 长任务跨路由存活 / 崩溃隔离 / 独立渲染上下文"这 5 条之一才用独立窗口。
当前模板**保留独立窗口地基但不内置业务窗口**：新增窗口 = `shared/ipc/window-spec.ts` 一条契约

- `main/window/presets.ts` 一条外观 + `/w/:kind` 路由与页面；同时只允许一个业务独立窗口，
  第二个 open 返回 `busy`，并行多开列在后续需求。

---

## 环境变量

前缀由 electron-vite 决定，按进程隔离：`MAIN_VITE_*` / `PRELOAD_VITE_*` / `RENDERER_VITE_*`。

| 变量                         | 说明                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `APP_NAME`                   | 应用名：窗口标题、登录页、侧栏、菜单与安装包 `productName`             |
| `APP_TAGLINE`                | 登录页副标题（可为空）                                                 |
| `APP_ID`                     | Windows AppUserModelId，同时作为安装包 `appId`                         |
| `APP_ICON`                   | `resources/` 下的运行时窗口图标文件名，打包时会一起拷进 resources      |
| `APP_FEATURE_LOGIN`          | `false` = 跳过登录独立窗口与鉴权守卫                                   |
| `APP_SPLASH_MIN_MS`          | 无需登录时启动页的最短展示时间（毫秒），默认 900                       |
| `RENDERER_VITE_API_BASE_URL` | 后端基址。**留空 = 不连后端**，`api/http` 会给出可读报错而不是假装能跑 |

`APP_*` 不是 Vite 前缀变量：`electron.vite.config.ts` 用 `loadEnv` 读取后通过 `define` 注入主进程、
preload 与渲染层，业务代码只从 `src/shared/constants/app.ts` 读。`electron-builder.cjs` 也读同一份
`.env`，因此安装包名称、App ID 与运行时不会脱节。

图标口径：Windows 安装包与运行时窗口都读 `resources/<APP_ICON>`；macOS 安装包图标仍是
`build/icon.icns`，换品牌时需要自己替换这份 icns。

业务代码不直接碰 `import.meta.env`，统一从 `src/renderer/src/env.ts` 读。
一句话安全观：**`RENDERER_VITE_*` 会被打进 bundle，前端 bundle 不是秘密**；密钥只放 `MAIN_VITE_*`。

---

## 界面系统

- **设计令牌**：颜色、字号、间距、圆角、阴影全部在 `src/renderer/src/styles/index.scss`，
  `html.dark` 是同一套语义变量的暗色映射；新增令牌必须在 light / dark 两侧同时补齐。
- **Element Plus 覆盖**：只在 `src/renderer/src/styles/element-theme.scss` 一处；
  组件内不再写 `:deep(.el-dialog__header)` 这类局部覆盖。
- **SCSS**：组件统一 `<style scoped lang="scss">`；颜色只允许引用 `--app-*` 令牌，
  组件样式里不写死色值。
- **命名**：组件文件、模板标签、`defineOptions.name` 与路由 `name` 一律 kebab-case，
  ESLint 的 `vue/component-definition-name-casing` 已强制。
- **窗口外观**：主窗口、登录窗、启动页与独立窗口都使用无系统边框 + 自定义标题栏；
  最小化 / 最大化 / 关闭与窗口状态通过 `window:*` IPC 触达主进程。
- **主题**：亮色模式标题栏与侧栏为浅色（`titlebar: #f7f8fa`、`sidebar: #fbfcfd`），
  暗色模式整体反转；切换只改 `html.dark`，不需要重建窗口。
- **登录 / 启动**：登录窗与启动页共用 `window-brand-bar` 与 `.auth-window` 品牌背景；
  启动页只在无需登录的路径出现，等待主窗口 `app:ui-ready` 后退场。

### 列表页组件

`my-search` / `my-table` / `my-pagination` / `my-dialog` / `my-drawer` 已在 `main.ts` 全局注册，
配合 `useSearchFilter` + `useListPage`，新列表页按固定组合写：

```vue
<my-search :filters="filters" :form-data="formData" @search="onSearch" @reset="onReset">
  <el-button type="primary" @click="handleAdd">新增</el-button>
</my-search>

<section class="panel panel--table">
  <my-table :columns="columns" :data="rows" :seq="true" :row-config="{ keyField: 'id' }">
    <template #action="{ row }">
      <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
    </template>
  </my-table>
  <my-pagination
    v-model:page="pagination.pageNum"
    v-model:size="pagination.pageSize"
    :total="total"
    @pagination="onPagination"
  />
</section>

<form-dialog ref="formDialogRef" @success="handleSaved" />
```

- 列表页参考 [views/system/user/index.vue](src/renderer/src/views/system/user/index.vue)；
  列配置放同目录 `index.ts`，表单弹窗放 `components/form-dialog.vue`。
- `form-dialog` 暴露 `open(FormType.ADD | FormType.EDIT, row)`，保存后 `emit('success', value)`，
  页面只负责更新数据与刷新。
- `my-dialog` / `my-drawer` 只负责外观与默认契约（`v-model` + `title` + `footer` 插槽 + `$attrs`），
  底部按钮由调用方放入 `footer` 插槽。

> 踩过的坑：`ImportMetaEnv` 的类型增强**不能**和 `/// <reference types="vite/client" />` 写在同一个文件里，
> 否则 CSS 副作用导入与 `import.meta.env` 会一起失效。本项目把增强单独放在
> `src/renderer/src/types/ambient.d.ts`。

---

## 数据存储位置

| 内容                 | 位置                                   | 为什么                                                                                   |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 用户偏好、会话 token | `userData/settings.json`（主进程读写） | 独立窗口各有自己的 Web Storage，只有主进程那份是唯一的；也不用 localStorage 存明文 token |
| 日志                 | `userData/logs/app-YYYY-MM-DD.log`     | 按天分片，写满 10MB 切 `.1/.2`，保留 14 天                                               |
| 诊断包               | `userData/diagnostics/*.json`          | 含环境信息与日志尾部副本，不引 zip 依赖                                                  |

`userData` 的实际目录由 `APP_NAME` 决定（Windows 下是 `%APPDATA%/<APP_NAME>`）；改品牌名会切换数据目录，
已有用户数据需要自行迁移。

菜单「帮助 → 导出诊断包」和 `window.api.app.exportDiagnostics()` 共用同一份实现。
崩溃恢复：主窗口崩溃由主进程重建；独立窗口崩溃只影响自己，调用方收到 `crashed`，不做全局重启，也不做云端上报。

---

## 发布与自动更新

`pnpm build:win` 产出 NSIS 安装包（perUser，免 UAC、可换安装目录）与 portable 两种产物，默认在 `release/`。

**本机实测（2026-11-04）**：`pnpm build:unpack` 与 `pnpm build:win` 均已跑通；NSIS setup 约 117MB、portable 约 106MB、`app.asar` 约 3MB、`win-unpacked` 约 360MB；未签名状态为 `NotSigned`。

项目路径含中文时（例如 `D:\Projects\后台模板\...`），electron-builder 解压 Electron 后移动目录会报 `EBUSY`。
把输出目录指到纯 ASCII 路径即可：

```bash
BUILD_OUTPUT_DIR=D:/DevCache/build \
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
pnpm build:win
```

`ELECTRON_MIRROR` 必须显式给：electron-builder 的 Electron 下载不读 `.npmrc` 里的 `electron_mirror`，
不给会在下载 158MB 的 Electron zip 后超时。

- **代码签名没配**：没有证书时签名会被跳过（`NotSigned`），正式分发需要 OV/EV 证书；未签名 exe 会触发 SmartScreen。
- **自动更新没集成**：它依赖真实分发基建（内网 HTTP 或制品库 + 版本发布流程），模板里无法验收。接入清单：
  1. `pnpm add electron-updater`
  2. `electron-builder.cjs` 加 `publish: { provider: 'generic', url: '你的内网地址' }`
  3. 主进程 `app.whenReady()` 后 `autoUpdater.checkForUpdatesAndNotify()`
  4. 定好 semver 策略，并验证与 Electron 45 的兼容性

---

## 排障表

| 现象                                                                                                                                          | 原因                                                                                    | 处置                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Timeout awaiting 'request' for 600000ms`（`failedTask=build`），输出目录一直是 0 KB                                                          | ① Electron 本体下载超时；② winCodeSign / nsis 工具链下载超时                            | 两个镜像都用**环境变量**显式传：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 与 `ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/`。`.npmrc` 里的镜像名不保证被 electron-builder 读取 |
| `EBUSY: resource busy or locked` / `Device or resource busy`，对象是 `win-unpacked*/resources/default_app.asar`，且**没有任何 electron 进程** | 项目/输出目录在非 ASCII 路径下（本机实测），或杀毒软件/索引器持有刚写入的 PE 文件句柄   | 用 `BUILD_OUTPUT_DIR=D:/DevCache/build` 把输出指到纯 ASCII 路径；仍失败再等一会儿或把缓存目录加进 Defender 排除项                                                                                                                           |
| `app.asar` 异常大，含旧版本 PascalCase chunk 或 `release/` 目录                                                                               | `out/renderer/assets` 的 hash 文件不会自动清空；`files` 默认会包含项目里的旧输出目录    | 模板已在 `build` 前跑 `pnpm clean`，并在 `electron-builder.cjs` 排除 `release*/**`、`dist*/**`                                                                                                                                              |
| `pnpm build:win` 只构建、不产出安装包，也没有报错                                                                                             | 配置文件曾叫 `electron-builder.js`，与 CLI 命令同名，Windows 下被当作命令执行后静默退出 | 配置已改名为 `electron-builder.cjs`；不要改回 `.js`                                                                                                                                                                                         |
| `Unable to move the cache: 拒绝访问 (0x5)`                                                                                                    | 多个 Electron 实例共用同一 `userData` 抢缓存目录                                        | 正常现象之一：开发期要多开调试属于预期，单实例锁在 dev 下刻意跳过；要干净环境就只开一个实例                                                                                                                                                 |
| 改主进程代码没反应                                                                                                                            | `electron-vite dev` 默认不监听主进程                                                    | 用 `pnpm dev`（已带 `-w`）                                                                                                                                                                                                                  |
| 打包后白屏 / 资源 404                                                                                                                         | `file://` 下 history 路由与绝对路径不可用                                               | 必须 `createWebHashHistory` + `base: './'`，模板已配                                                                                                                                                                                        |
| `pnpm install` 提示 `Ignored build scripts`                                                                                                   | pnpm 10 默认屏蔽构建脚本                                                                | 已把 `electron-winstaller`、`@parcel/watcher` 写进 `package.json` 的 `pnpm.onlyBuiltDependencies`；新增原生依赖时同样要登记                                                                                                                 |
| 全局 npm `strict-ssl=false`                                                                                                                   | 供应链风险                                                                              | 建议改为项目级配置或配企业 CA；模板不代改全局设置                                                                                                                                                                                           |

### 打包这一步的当前状态（如实记录）

- `pnpm build`、`pnpm build:unpack`、`pnpm build:win` 均已通过（输出目录在 ASCII 路径，如 `D:/DevCache/build`）。
- 未签名：`Get-AuthenticodeSignature ...setup.exe` 返回 `NotSigned`；这是没有证书时的预期结果。
- 中文项目路径是**输出目录移动阶段**的实际阻塞点，不是下载阶段；`BUILD_OUTPUT_DIR` 已作为正式逃生口。
- 打包前的 `pnpm clean` 只清 `out/`；`release*/`、`dist*/` 已从 asar 排除。
- 引入 vxe-table 后**尚未重新打包测量** `app.asar` 体积；本次 `pnpm build` 通过，renderer 产物约 3.34MB JS + 1.10MB CSS，后续打包装包时需要重新核对。

---

## 技术版本线

| 依赖          | 版本      | 备注                                                                                                                                              |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Electron      | 45.2.2    | 内置 Node 24.9 / Chromium 156                                                                                                                     |
| electron-vite | 6.0.0     | 内部已用 rolldown 打包；`main`/`preload` 配置块可以留空（默认 externalize 依赖）                                                                  |
| Vite          | 8.3.5     |                                                                                                                                                   |
| Vue           | 3.5.44    |                                                                                                                                                   |
| Vue Router    | 5.4.0     |                                                                                                                                                   |
| Pinia         | 4.1.0     |                                                                                                                                                   |
| Element Plus  | 2.14.7    | 全量引入；主题覆盖只在 `styles/element-theme.scss` 一处                                                                                           |
| vxe-table     | 4.23.14   | 仅用于渲染层 `my-table`；主题变量在 `element-theme.scss` 映射到 `--app-*`                                                                         |
| vxe-pc-ui     | 4.20.36   | vxe-table 的基础组件与样式依赖                                                                                                                    |
| Sass          | 1.107.1   | 仅作 SCSS 预处理；Vite 内置支持，无额外构建插件                                                                                                   |
| TypeScript    | **6.0.3** | 官方脚手架与 vue-tsc 3.3.14 的当前稳定线。7.0.2 实测与 `vue-tsc` 硬冲突（`ERR_PACKAGE_PATH_NOT_EXPORTED`），已在回退阶梯里，等 vue-tsc 适配后可升 |

编码与协作规则见 [AGENTS.md](AGENTS.md)；架构与契约细节见 [DESIGN.md](DESIGN.md)。

## 还没做的（有意为之，不是遗漏）

插件化/微内核抽象、跨窗口状态同步层、多业务窗口并行、i18n、测试基座、托盘常驻与开机自启、云端错误上报、图表/字典等后端耦合组件。
理由都写在 [DESIGN.md](DESIGN.md) 的"范围收缩"一节。
