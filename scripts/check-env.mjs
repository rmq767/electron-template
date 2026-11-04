#!/usr/bin/env node
// 环境自检：这台机器上项目路径与 USERPROFILE 都含中文，Electron 与 electron-builder
// 的二进制缓存在非 ASCII 路径下会失败，所以把检查前置到 install 之前。
import process from 'node:process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ASCII_CACHE_ROOT = 'D:/DevCache'

// 只含 0x00-0x7F 才算 ASCII；用码点判断而不是正则控制字符区间（lint 会拦 \x00 类正则）
const isAscii = (value) => [...value].every((ch) => ch.codePointAt(0) <= 0x7f)

const compareVersion = (a, b) => {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return 0
}

// electron-vite 6 的 engines: ^20.19.0 || >=22.12.0
const checkNode = () => {
  const current = process.versions.node
  const ok = compareVersion(current, '20.19.0') >= 0 || compareVersion(current, '22.12.0') >= 0
  const supported = compareVersion(current, '21.0.0') < 0 || compareVersion(current, '22.12.0') >= 0
  return ok && supported
    ? [true, `v${current}`]
    : [false, `v${current}（需要 ^20.19.0 或 >=22.12.0）`]
}

const checks = []

const add = (name, ok, detail, hint) => {
  checks.push({ name, ok, detail, hint })
}

const [nodeOk, nodeDetail] = checkNode()
add('Node', nodeOk, nodeDetail, '用 nvm 切到 20.19+ 或 22.12+')

const projectDir = process.cwd()
add(
  '项目路径',
  isAscii(projectDir),
  projectDir,
  '路径含非 ASCII 字符：开发可继续，但打包（electron-builder）建议把项目复制到纯 ASCII 路径再出包'
)

const tmp = process.env.TMP || process.env.TEMP || ''
add(
  'TMP / TEMP',
  tmp !== '' && isAscii(tmp),
  tmp || '(未设置)',
  `设置 TMP 与 TEMP 到 ASCII 目录，例如 ${ASCII_CACHE_ROOT}/tmp`
)

// 缓存目录未显式设置时会回落到 %LOCALAPPDATA%，而本机该路径含中文，所以「未设置」本身就是问题。
const cacheDirs = [
  ['ELECTRON_CACHE', 'electron-cache'],
  ['ELECTRON_BUILDER_CACHE', 'electron-builder-cache']
]
for (const [name, dir] of cacheDirs) {
  const value = process.env[name]
  if (value === undefined || value === '') {
    add(
      `缓存 ${name}`,
      false,
      '(未设置，回落到 %LOCALAPPDATA% 下的中文路径)',
      `setx ${name} "${ASCII_CACHE_ROOT}/${dir}"`
    )
  } else {
    add(`缓存 ${name}`, isAscii(value), value, `改到 ASCII 目录，例如 ${ASCII_CACHE_ROOT}/${dir}`)
  }
}

// .npmrc 里的 electron_config_cache 决定 npm 安装 electron 时把 zip 放哪
const npmrcCache = (() => {
  try {
    const raw = readFileSync(new URL('../.npmrc', import.meta.url), 'utf8')
    const line = raw.split(/\r?\n/).find((l) => l.startsWith('electron_config_cache='))
    return line?.slice('electron_config_cache='.length)
  } catch {
    return undefined
  }
})()
add(
  '缓存 electron_config_cache',
  npmrcCache !== undefined && isAscii(npmrcCache),
  npmrcCache ?? '(.npmrc 未配置)',
  '在 .npmrc 里设 electron_config_cache=D:/DevCache/electron-cache'
)

for (const dir of ['electron-cache', 'electron-builder-cache', 'tmp']) {
  const full = path.posix.join(ASCII_CACHE_ROOT, dir)
  add(`目录存在 ${dir}`, existsSync(full), full, `创建 ${full}`)
}

let failed = 0
const width = Math.max(...checks.map((c) => c.name.length))
for (const c of checks) {
  if (!c.ok) failed += 1
  console.log(`${c.ok ? 'OK  ' : 'WARN'} ${c.name.padEnd(width)}  ${c.detail}`)
  if (!c.ok) console.log(`     -> ${c.hint}`)
}

console.log(
  failed === 0
    ? '\n环境检查全部通过。'
    : `\n有 ${failed} 项需要处理（见上方 WARN）。阻塞构建的是打包相关项，dev 模式通常仍可运行。`
)
