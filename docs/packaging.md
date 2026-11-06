# 打包手册

本文覆盖 Windows / macOS / Linux 的打包配置：应用名、版本、App ID、图标、输出目录、
安装包行为、签名与常见故障。所有结论以当前仓库配置为准，改配置时请同步更新本文。

相关文件：

| 文件                      | 作用                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `.env`                    | 应用身份：名称、副标题、App ID、图标文件名、功能开关         |
| `.env.production`         | 生产模式的环境差异（接口地址等）                             |
| `package.json`            | 版本号、构建脚本、依赖版本                                   |
| `electron-builder.cjs`    | 安装包配置：productName / appId / 图标 / 目标 / 输出目录     |
| `electron.vite.config.ts` | 把 `.env` 注入三端代码                                       |
| `resources/`              | 运行时资源，打包后原样拷到应用的 `resources/` 目录           |
| `build/`                  | electron-builder 的 buildResources：平台图标、macOS 权限文件 |
| `scripts/check-env.mjs`   | 打包机器环境与 ASCII 路径自检                                |
| `scripts/clean.mjs`       | 只清理 `out/`，不清理 `release/`                             |
| `scripts/build-icons.mjs` | 从 `resources/<APP_ICON>` 生成三个 build 图标                |

---

## 0. 一页速查

| 要改什么            | 去哪里改                                            | 改完要做什么               |
| ------------------- | --------------------------------------------------- | -------------------------- |
| 应用显示名          | `.env` 的 `APP_NAME`                                | 重新打包                   |
| 安装包文件名前缀    | 同上（`productName` 取自 `APP_NAME`）               | 重新打包                   |
| 版本号              | `package.json` 的 `version`                         | 重新打包                   |
| App ID / 任务栏分组 | `.env` 的 `APP_ID`                                  | 重新打包；发布后不要随意改 |
| Windows 应用图标    | `resources/<APP_ICON>`                              | 重新打包                   |
| 安装包/回退图标     | 运行 `pnpm build:icons` 生成 `build/icon.*`         | 重新打包                   |
| macOS 图标          | `build/icon.icns`                                   | 在 macOS 上重新打包        |
| Linux 图标          | `build/icon.png`                                    | 在 Linux 上重新打包        |
| 输出目录            | `BUILD_OUTPUT_DIR` 环境变量                         | 不设置则输出到 `release/`  |
| 登录开关 / 启动页   | `.env` 的 `APP_FEATURE_LOGIN` / `APP_SPLASH_MIN_MS` | 重新打包（值在构建期写死） |
| 安装方式            | `electron-builder.cjs` 的 `nsis` / `portable`       | 重新打包                   |
| 代码签名            | 证书环境变量 + `electron-builder.cjs`               | 当前未配置，见第 9 节      |

> `.env` 不会打进安装包。所有 `APP_*` 值都在构建期由 `electron.vite.config.ts` 注入，
> 打包完成后再改 `.env` 不会影响已安装的应用，必须重新构建。

---

## 1. 打包命令与产物

### 1.1 前置检查

```bash
pnpm install
pnpm check:env
```

`pnpm check:env` 会检查 Node 版本、项目路径、`TMP` / `TEMP`、Electron 缓存与
electron-builder 缓存是否在 ASCII 路径。当前机器 `%USERPROFILE%` 含中文，
缓存目录必须显式指到 ASCII 路径；否则 Electron 解压与 NSIS 工具链下载可能失败。
Node 版本与 `.npmrc` 的 `electron_config_cache` 盘符不合法时，脚本会返回非零退出码；
克隆到其他机器时先改成该机存在的 ASCII 路径。

### 1.2 命令

| 命令                | 作用                                             |
| ------------------- | ------------------------------------------------ |
| `pnpm build`        | typecheck + 清理 `out/` + 三端构建，不生成安装包 |
| `pnpm build:win`    | `pnpm build` 后执行 `electron-builder --win`     |
| `pnpm build:unpack` | 只生成解包目录（最快要验证 `file://` 加载时用）  |
| `pnpm build:mac`    | macOS 产物，需在 macOS 上执行（本机未验证）      |
| `pnpm build:linux`  | Linux 产物，需在 Linux 上执行（本机未验证）      |

`build:win` 会先跑完整的 `build`，所以不需要手动再执行一次。

当前状态：Windows 的 `build:unpack` 与 `build:win` 已于 2026-11-04 实测通过；
引入 vxe-table 后尚未重新执行 `build:win` 测量 `app.asar` 体积，下次发版需要重新核对。

### 1.3 Windows 产物

| 文件                           | 说明                                      |
| ------------------------------ | ----------------------------------------- |
| `Aster-0.1.0-x64-setup.exe`    | NSIS 安装包（可安装、可卸载、有快捷方式） |
| `Aster-0.1.0-x64-portable.exe` | 单文件便携版，双击直接运行                |
| `win-unpacked/`                | 解包目录，用于排查或做绿色分发            |

文件名由 `electron-builder.cjs` 的 `artifactName` 决定：

```cjs
nsis.artifactName: '${productName}-${version}-${arch}-setup.${ext}'
portable.artifactName: '${productName}-${version}-${arch}-portable.${ext}'
```

可用变量：`${productName}`、`${version}`、`${arch}`、`${os}`、`${ext}` 等。
改名只影响产物文件名，不影响应用内部身份。

### 1.4 macOS / Linux 产物

- macOS：当前配置了 `dmg.artifactName = '${productName}-${version}.${ext}'`，
  但 `build:mac` 尚未在本机验证；签名与公证默认关闭。
- Linux：目标为 `AppImage` 与 `deb`，`appImage.artifactName` 已配置为
  `${productName}-${version}.${ext}`；`deb` 使用 electron-builder 默认命名。
- macOS 的 `build/entitlements.mac.plist` 已提供，当前只作为打包输入，不代表已签名。

---

## 2. 应用名称（APP_NAME）

### 2.1 配置位置

`.env`：

```dotenv
APP_NAME=Aster
APP_TAGLINE=桌面工作台
```

这是唯一真源。不要在页面、主进程或 `electron-builder.cjs` 里再写一份产品名。

### 2.2 影响范围

`APP_NAME` 会同时影响：

- 窗口标题、登录页、侧栏品牌名、菜单、`app.getName()`
- 安装包 `productName`、快捷方式名称、卸载列表显示名
- NSIS 安装目录名、`userData` 目录：`%APPDATA%\<APP_NAME>`
- 默认产物文件名前缀（通过 `${productName}`）

`APP_TAGLINE` 只用于登录页副标题，不进入安装包元数据。

### 2.3 改法

1. 改 `.env` 的 `APP_NAME` / `APP_TAGLINE`
2. 同步替换图标（见第 5 节）
3. 重新执行 `pnpm build:win`
4. 如果已经发布过，处理旧 `userData` 的迁移策略（见 2.5）

### 2.4 可执行文件名

`electron-builder.cjs` 用下面的规则从 `APP_NAME` 派生 Windows 可执行文件名：

- 转小写
- 非 `a-z0-9` 的连续字符替换为 `-`
- 去掉首尾 `-`
- 结果为空时回退为 `app`

例：`Aster` → `aster.exe`；纯中文名 → `app.exe`。
如需固定可执行文件名，在 `electron-builder.cjs` 的 `win.executableName` 显式指定。

### 2.5 改名注意事项

- `APP_NAME` 决定 `userData` 目录，改名等于换数据目录；旧设置、登录会话与日志不会自动迁移。
- 发布后不要随意改 `APP_ID`，否则 Windows 任务栏归组、通知与卸载记录会被当成另一个应用。
- 改名时同时检查：窗口标题、登录页、侧栏、菜单、快捷方式、安装包文件名、卸载显示名、图标、`userData` 路径。

---

## 3. 版本号

### 3.1 配置位置

`package.json`：

```json
{
  "version": "0.1.0"
}
```

`electron-builder` 读取这里的 `version`，替换产物名里的 `${version}`；
运行时 `app.getVersion()` 也返回它。`APP_NAME` 不参与版本计算。

### 3.2 改法

任选一种：

```bash
# 推荐：只改版本，不自动提交/打 tag
pnpm version patch --no-git-tag-version

# 或直接编辑 package.json 的 version
```

常见语义：

| 改动       | 示例              |
| ---------- | ----------------- |
| 修复       | `0.1.0` → `0.1.1` |
| 新功能     | `0.1.1` → `0.2.0` |
| 不兼容变更 | `0.2.0` → `1.0.0` |

### 3.3 注意事项

- 改完必须重新打包；旧产物不会自动改名。
- 同一版本不要生成两份内容不同的安装包，否则升级/回滚与问题追踪都会混乱。
- 自动更新未集成；版本号目前只用于产物命名和运行时信息展示。

---

## 4. App ID

### 4.1 配置位置

`.env`：

```dotenv
APP_ID=com.aster.desktop
```

两处消费它：

1. `electron-builder.cjs` 的 `appId`（安装包身份）
2. 主进程 `electronApp.setAppUserModelId(APP_ID)`（Windows 任务栏分组与通知）

### 4.2 规则

- 使用反向域名格式，例如 `com.yourcompany.product`。
- **发布后保持稳定**；改动会改变应用身份，可能出现重复任务栏条目、通知不归组或升级识别异常。
- 换品牌/换公司时再改，并同时评估旧版本卸载与数据迁移。

---

## 5. 图标

### 5.1 先分清几类图标文件

| 位置                   | 用途                                           | 当前值                 |
| ---------------------- | ---------------------------------------------- | ---------------------- |
| `resources/<APP_ICON>` | 运行时窗口图标；Windows 的 `win.icon` 也指向它 | `resources/icon.png`   |
| `build/icon.ico`       | buildResources 的 Windows 传统图标位           | 多尺寸 ico（脚本生成） |
| `build/icon.icns`      | macOS 应用图标                                 | 由脚本生成             |
| `build/icon.png`       | buildResources 的 PNG 图标位 / Linux 图标回退  | 源图副本，512×512      |

当前 `electron-builder.cjs` 显式把 `win.icon` 指向 `resources/<APP_ICON>`，
所以 **Windows 可执行文件的应用图标以 `resources/<APP_ICON>` 为准**；
`build/icon.ico` 是删除 `win.icon` 后的默认回退位，换品牌时也建议一起替换，
避免将来配置变动后又回到旧图标。

### 5.2 生成三个 build 图标（推荐）

换图标只需要维护一张源图，然后执行：

```bash
pnpm build:icons
```

脚本 `scripts/build-icons.mjs` 会：

1. 读取 `.env` 的 `APP_ICON`（默认 `icon.png`），源文件必须是 PNG；
2. 从 `resources/<APP_ICON>` 读取源图；
3. 生成 `build/icon.ico`（16–256 多尺寸，Windows 可执行文件用）
   与 `build/icon.icns`（macOS）；
4. 把源图复制为 `build/icon.png`（Linux 与 buildResources PNG 位）。

源图至少 256×256；**推荐 1024×1024**，否则 macOS 的大尺寸图标只能由系统放大。
当前模板的源图是 512×512，脚本会给出提示。

实现使用 `png2icons`（纯 JS、无原生依赖）。参考项目
`HaiNan-economic-evaluation-app` 用的是 `electron-icon-maker`，命令形态相同，
但它依赖旧版 `icon-gen` / `phantomjs-prebuilt`，安装重且容易失败，因此本模板改用轻量方案。

也可以临时指定任意 PNG 做试跑：

```bash
node scripts/build-icons.mjs D:/DevCache/tmp/test-icon.png
```

产物仍写入 `build/`，测试完执行 `pnpm build:icons` 即可恢复正式图标。

### 5.3 Windows 图标

1. 准备一张正方形 PNG，至少 256×256，推荐 1024×1024，带透明通道。
2. 覆盖 `resources/icon.png`，或换文件名并同步 `.env`：

   ```dotenv
   APP_ICON=my-icon.png
   ```

3. 执行 `pnpm build:icons`，生成 `build/icon.ico` 与 `build/icon.png`。
4. `pnpm build:win`。
5. 验证：安装包图标、安装后 exe 图标、桌面/开始菜单快捷方式图标、任务栏图标。

> Windows 有图标缓存。替换后如果仍看到旧图标，先确认产物时间戳，再清理
> Windows 图标缓存或重启资源管理器。

### 5.4 macOS 图标

- 图标文件：`build/icon.icns`
- 推荐源图 1024×1024；执行 `pnpm build:icons` 即可从 `resources/<APP_ICON>` 生成
- 当前 `electron-builder.cjs` 没有单独设置 `mac.icon`，使用 buildResources 默认值
- 换品牌时不能只换 `resources/icon.png`，必须重新执行 `pnpm build:icons`

### 5.5 Linux 图标

- 图标文件：`build/icon.png`，由 `pnpm build:icons` 从源图复制
- 推荐源图 1024×1024；AppImage 与 deb 的图标都从 buildResources 读取

### 5.6 登录页/侧栏的品牌标

登录页、标题栏和侧栏里的字母标由 `APP_NAME` 首字母生成（`APP_INITIAL`），
不是图片。改 `APP_NAME` 会自动更新，不需要换图标文件。

---

## 6. 输出目录与文件名

### 6.1 默认输出

不设置环境变量时，产物输出到项目根目录的 `release/`：

```
release/
  Aster-0.1.0-x64-setup.exe
  Aster-0.1.0-x64-portable.exe
  win-unpacked/
```

### 6.2 指定 ASCII 输出目录

当前项目路径 `D:\Projects\后台模板\...` 含中文。electron-builder 在解压 Electron 后
移动输出目录时会 `EBUSY`，因此打包时把输出指到纯 ASCII 路径：

```bash
BUILD_OUTPUT_DIR=D:/DevCache/build pnpm build:win
```

`electron-builder.cjs` 读取 `BUILD_OUTPUT_DIR` 作为 `directories.output`。

### 6.3 清理策略

- `pnpm clean` 只清 `out/`，不会删除 `release/` 或 `BUILD_OUTPUT_DIR` 里的旧产物。
- 发版前建议手动清理输出目录，或每次使用新的输出目录，避免旧安装包混入归档。
- `release*/`、`dist*/` 已从 asar 排除，不会被打进应用。

### 6.4 文件名模板

需要改产物名时，只改 `electron-builder.cjs` 的 `artifactName`：

```cjs
nsis: {
  artifactName: '${productName}-${version}-${arch}-setup.${ext}'
}
```

不要在这里写死品牌名；`${productName}` 已从 `.env` 读取。

---

## 7. 安装包行为（NSIS）与便携版

当前 Windows 配置：

```cjs
nsis: {
  oneClick: false,
  perMachine: false,
  allowToChangeInstallationDirectory: true,
  createDesktopShortcut: 'always',
  shortcutName: productName,
  uninstallDisplayName: productName
}
```

含义：

- `oneClick: false`：显示安装向导，不是双击静默安装。
- `perMachine: false`：按用户安装，默认不需要管理员权限 / UAC。
- `allowToChangeInstallationDirectory: true`：安装时可选择目录。
  默认位置通常是 `%LOCALAPPDATA%\Programs\<APP_NAME>`。
- `createDesktopShortcut: 'always'`：总是创建桌面快捷方式。
- 未显式关闭开始菜单快捷方式，使用 electron-builder 默认行为。
- 卸载默认保留 `userData`（设置、会话、日志）；需要彻底清理时手动删除
  `%APPDATA%\<APP_NAME>`。

### 7.1 setup 与 portable 的区别

|              | `-setup.exe` | `-portable.exe`              |
| ------------ | ------------ | ---------------------------- |
| 是否需要安装 | 需要         | 不需要                       |
| 安装目录     | 可选         | 每次解压到临时目录运行       |
| 快捷方式     | 创建         | 不创建                       |
| 卸载         | 有卸载程序   | 删除 exe 即可                |
| 启动速度     | 较快         | 每次启动略慢                 |
| 适用场景     | 正式交付     | 试用、演示、无管理员权限机器 |

两种包的应用数据都写在 `%APPDATA%\<APP_NAME>`；portable **不是数据便携版**。
如果要求数据跟 exe 一起走，需要另外改 `app.setPath('userData', ...)`，当前模板没有做。

---

## 8. 构建期配置与运行时配置

| 配置                         | 来源                       | 何时生效                       |
| ---------------------------- | -------------------------- | ------------------------------ |
| `APP_NAME` / `APP_TAGLINE`   | `.env`                     | 构建期注入，重新打包才生效     |
| `APP_ID`                     | `.env`                     | 构建期注入 + 安装包身份        |
| `APP_ICON`                   | `.env` + `resources/`      | 构建期确定文件名，图标文件随包 |
| `APP_FEATURE_LOGIN`          | `.env`                     | 构建期注入，重新打包才生效     |
| `APP_SPLASH_MIN_MS`          | `.env`                     | 构建期注入，重新打包才生效     |
| `RENDERER_VITE_API_BASE_URL` | `.env` / `.env.production` | 构建期写进渲染层 bundle        |

`electron-vite` 在构建时读取 `.env` 与对应 mode 文件，通过 `define` 注入三端；
打包产物里**没有** `.env`。因此：

- 不能靠发布后改 `.env` 调整登录开关或接口地址。
- `RENDERER_VITE_*` 会进前端 bundle，不是秘密；密钥只能放 `MAIN_VITE_*`。
- 生产构建使用 `.env.production`；开发使用 `.env.development`。

---

## 9. 代码签名（当前未配置）

当前 Windows 产物未签名，`Get-AuthenticodeSignature` 返回 `NotSigned`，
首次运行会触发 SmartScreen 提示。模板不内置证书，也不提交任何证书文件。

### 9.1 Windows

1. 取得 OV / EV 代码签名证书（`.pfx`）。
2. 打包时通过环境变量传给 electron-builder：

   ```bash
   CSC_LINK=D:/secure/cert.pfx \
   CSC_KEY_PASSWORD=你的密码 \
   BUILD_OUTPUT_DIR=D:/DevCache/build \
   pnpm build:win
   ```

3. electron-builder 会自动对 exe 与安装包签名；证书不要放进仓库。
4. 如需固定时间戳服务，可在 `electron-builder.cjs` 的 `win` 配置中设置
   `rfc3161TimeStampServer`，并确认 `signingHashAlgorithms` 使用 `sha256`。
5. 验证：`Get-AuthenticodeSignature .\Aster-0.1.0-x64-setup.exe` 应显示 `Valid`。

> 证书文件、密码与 `CSC_*` 环境变量都不得提交到 git。

### 9.2 macOS

当前 `notarize: false`，且没有配置签名身份。正式分发需要：

- Apple Developer ID 证书
- `build/entitlements.mac.plist`（已提供）
- electron-builder 的 notarize 配置与 Apple 账号凭据
- 在 macOS 上执行 `pnpm build:mac`

### 9.3 Linux

AppImage / deb 通常不做代码签名；如需校验，发布 `.sha256` 校验和。

---

## 10. 自动更新（当前未配置）

模板刻意不配置 `publish`：没有真实分发地址时，写一个跑不通的自动更新器是负收益。
需要接入时：

1. `pnpm add electron-updater`
2. 在 `electron-builder.cjs` 增加 `publish: { provider: 'generic', url: '你的内网地址' }`
3. 主进程 `app.whenReady()` 后调用 `autoUpdater.checkForUpdatesAndNotify()`
4. 固定 semver 策略并验证与 Electron 45 的兼容性
5. 确保新版本 `version` 递增，且旧安装包可升级

自动更新依赖真实的制品托管与版本发布流程，模板不提供可直接运行的更新服务。

---

## 11. 常见问题

| 现象                                                                                   | 原因                                                       | 处理                                                                                                 |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `EBUSY` / `Device or resource busy`，对象是 `win-unpacked*/resources/default_app.asar` | 项目或输出目录在非 ASCII 路径                              | 用 `BUILD_OUTPUT_DIR=D:/DevCache/build`；仍失败时检查杀毒/索引器是否占用刚写入的文件                 |
| Electron 下载超时                                                                      | electron-builder 不读 `.npmrc` 的 electron 镜像            | 显式设置 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`                                   |
| NSIS / winCodeSign 工具链下载超时                                                      | 同上                                                       | 显式设置 `ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/` |
| `app.asar` 异常大，里面混着旧 chunk 或 `release/`                                      | `out/renderer/assets` 不会自动清空；旧输出目录可能被收进包 | 先 `pnpm clean`，并确认 `files` 仍排除 `release*/**`、`dist*/**`                                     |
| `pnpm build:win` 没报错但没有安装包                                                    | 配置文件名与 CLI 同名时可能被当作命令执行                  | 保持 `electron-builder.cjs`，不要改回 `electron-builder.js`                                          |
| 安装后白屏 / 资源 404                                                                  | `file://` 下绝对路径或 history 路由不可用                  | 保持 `createWebHashHistory` 与 `base: './'`                                                          |
| 图标没更新                                                                             | 只换了 `resources`，没换 `build`；或 Windows 图标缓存      | 同步替换两处图标，清理输出目录后重新打包，必要时清图标缓存                                           |
| 版本号没变                                                                             | 只改了产物名或缓存                                         | 改 `package.json` 的 `version` 后重新构建                                                            |
| 卸载后设置还在                                                                         | NSIS 默认保留用户数据                                      | 属于预期；需要彻底清理时删除 `%APPDATA%\<APP_NAME>`                                                  |
| `pnpm install` 提示 `Ignored build scripts`                                            | pnpm 10 默认屏蔽构建脚本                                   | 原生依赖登记到 `package.json` 的 `pnpm.onlyBuiltDependencies`                                        |

---

## 12. 发版前检查清单

- [ ] `.env` 的 `APP_NAME`、`APP_ID`、`APP_ICON` 是否正确且与品牌一致
- [ ] `APP_ID` 与上一版本保持一致（除非有意更换应用身份）
- [ ] `package.json` 的 `version` 已递增
- [ ] 更换图标后已执行 `pnpm build:icons`，`build/icon.ico` / `icon.icns` / `icon.png` 已更新
- [ ] `.env.production` 的接口地址正确（不要把密钥放进 `RENDERER_VITE_*`）
- [ ] `pnpm typecheck && pnpm lint && pnpm build` 通过
- [ ] `BUILD_OUTPUT_DIR` 指向 ASCII 路径
- [ ] 安装包与 portable 都能启动，窗口标题、侧栏、登录页品牌正确
- [ ] 安装/卸载、桌面快捷方式、开始菜单、任务栏图标正确
- [ ] 首次运行 SmartScreen 行为已知（未签名时会提示）
- [ ] 产物已归档，旧 `release/` 目录未混入本次归档
- [ ] `release/`、证书、`.env.local` 等敏感/生成物未提交
