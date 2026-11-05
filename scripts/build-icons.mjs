#!/usr/bin/env node
// 从 resources/<APP_ICON> 生成 build/icon.ico、build/icon.icns、build/icon.png。
// 源图必须是 PNG；换品牌图标后执行 pnpm build:icons。
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import png2icons from 'png2icons'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readAppIcon() {
  const envFile = path.join(root, '.env')
  if (!existsSync(envFile)) return 'icon.png'
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    if (trimmed.slice(0, index).trim() !== 'APP_ICON') continue
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value || 'icon.png'
  }
  return 'icon.png'
}

function readPngSize(buffer) {
  const signature = '89504e470d0a1a0a'
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('源图标不是有效的 PNG 文件')
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

// 可选第一个参数：指定任意 PNG 源文件，便于换品牌前试跑或验证图标质量
const cliInput = process.argv[2]
const iconName = cliInput ? path.basename(cliInput) : readAppIcon()
if (path.extname(iconName).toLowerCase() !== '.png') {
  throw new Error(`源图标必须是 PNG 才能生成多平台图标：当前为 ${iconName}`)
}

const input = cliInput
  ? path.resolve(process.cwd(), cliInput)
  : path.join(root, 'resources', iconName)
if (!existsSync(input)) throw new Error(`找不到源图标：${input}`)

const source = readFileSync(input)
const { width, height } = readPngSize(source)
if (width < 256 || height < 256) {
  throw new Error(`源图标至少需要 256×256，当前为 ${width}×${height}`)
}
if (width < 1024 || height < 1024) {
  console.warn(`[icons] 建议源图为 1024×1024；当前 ${width}×${height}，macOS 大尺寸会插值放大`)
}

const outputDir = path.join(root, 'build')
const ico = png2icons.createICO(source, png2icons.BICUBIC2, 0, false, true)
const icns = png2icons.createICNS(source, png2icons.BICUBIC, 0)
if (!ico || !icns) throw new Error('图标转换失败')

writeFileSync(path.join(outputDir, 'icon.ico'), ico)
writeFileSync(path.join(outputDir, 'icon.icns'), icns)
copyFileSync(input, path.join(outputDir, 'icon.png'))

console.log(
  `[icons] ${iconName} ${width}×${height} -> build/icon.ico (${ico.length} B), ` +
    `build/icon.icns (${icns.length} B), build/icon.png`
)
