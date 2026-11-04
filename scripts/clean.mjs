import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

// out/ 是 electron-vite 的三端产物目录；renderer 的 hash chunk 不会自动清空，
// 不清会把旧版本资源一起打进 asar。
// Node 24.9 的 rmSync 在本机中文路径下会静默失败，所以逐项删除。
function remove(target) {
  if (!existsSync(target)) return
  const stat = lstatSync(target)
  if (stat.isDirectory()) {
    for (const name of readdirSync(target)) remove(join(target, name))
    rmdirSync(target)
  } else {
    unlinkSync(target)
  }
}

remove('out')
