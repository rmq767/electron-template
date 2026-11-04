// electron-builder 配置。应用名 / appId / 图标文件名从 .env 读取，
// 与运行时注入保持同一份真源；不要在这里再写一遍产品名。
const { existsSync, readFileSync } = require('fs')
const path = require('path')

function parseEnv(file) {
  if (!existsSync(file)) return {}
  const result = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

const env = { ...parseEnv(path.join(__dirname, '.env')) }
const productName = env.APP_NAME?.trim() || 'Aster'
const appId = env.APP_ID?.trim() || 'com.aster.desktop'
const iconFile = env.APP_ICON?.trim() || 'icon.png'
const executableName =
  productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app'
const appIcon = path.join(__dirname, 'resources', iconFile)

module.exports = {
  appId,
  productName,
  directories: {
    buildResources: 'build',
    output: 'release'
  },
  // 身份与图标已抽到 .env；构建配置本身不进包
  files: [
    '!**/.vscode/*',
    '!src/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md,DESIGN.md,AGENTS.md}',
    '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',
    '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}',
    '!{.husky,scripts,docs}/**',
    '!electron-builder.{yml,js,cjs,mjs,ts}',
    '!resources/**'
  ],
  // 运行时图标走 resources/<APP_ICON>，开发与打包路径一致
  extraResources: [{ from: 'resources', to: 'resources' }],
  asar: true,
  win: {
    executableName,
    icon: existsSync(appIcon) ? appIcon : undefined,
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] }
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: 'always',
    artifactName: '${name}-${version}-${arch}-setup.${ext}',
    shortcutName: productName,
    uninstallDisplayName: productName
  },
  portable: {
    artifactName: '${name}-${version}-${arch}-portable.${ext}'
  },
  // 不配 publish：模板没有真实分发地址，写一个跑不通的自动更新器等于负收益。
  // 接入清单见 README「发布与自动更新」一节。
  mac: {
    entitlementsInherit: 'build/entitlements.mac.plist',
    extendInfo: {
      NSCameraUsageDescription: "Application requests access to the device's camera.",
      NSMicrophoneUsageDescription: "Application requests access to the device's microphone.",
      NSDocumentsFolderUsageDescription:
        "Application requests access to the user's Documents folder.",
      NSDownloadsFolderUsageDescription:
        "Application requests access to the user's Downloads folder."
    },
    notarize: false
  },
  dmg: {
    artifactName: '${name}-${version}.${ext}'
  },
  linux: {
    target: ['AppImage', 'deb'],
    maintainer: productName,
    category: 'Utility'
  },
  appImage: {
    artifactName: '${name}-${version}.${ext}'
  },
  npmRebuild: false
}
