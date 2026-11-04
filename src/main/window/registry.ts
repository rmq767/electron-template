import type { BrowserWindow } from 'electron'
import type { OpenOutcome, WindowKind } from '@shared/ipc/window-spec'

export interface WindowEntry {
  windowId: string
  kind: WindowKind
  win: BrowserWindow
  /** webContents.id：用它反查窗口，渲染进程无法冒充别的窗口。 */
  contentsId: number
  props: unknown
  /** 一个窗口可以有多处 await；singleton 复用时后来的调用也挂在这里。 */
  pending: ((outcome: OpenOutcome<unknown>) => void)[]
  createdAt: number
}

const entries = new Map<string, WindowEntry>()
let seq = 0

export function createWindowId(kind: WindowKind): string {
  seq += 1
  return `${kind}#${seq}`
}

export function add(entry: WindowEntry): void {
  entries.set(entry.windowId, entry)
}

export function get(windowId: string): WindowEntry | undefined {
  return entries.get(windowId)
}

export function findByContents(contentsId: number): WindowEntry | undefined {
  return [...entries.values()].find((entry) => entry.contentsId === contentsId)
}

export function findByKind(kind: WindowKind): WindowEntry | undefined {
  return [...entries.values()].find((entry) => entry.kind === kind && !entry.win.isDestroyed())
}

export function list(): WindowEntry[] {
  return [...entries.values()]
}

export function remove(windowId: string): void {
  entries.delete(windowId)
}

export function enqueueSetter(windowId: string, setter: (outcome: OpenOutcome<unknown>) => void): void {
  entries.get(windowId)?.pending.push(setter)
}

/** 兑现所有等待该窗口的调用；已兑现过则忽略，避免 Promise 被重复 settle。 */
export function settle(windowId: string, outcome: OpenOutcome<unknown>): void {
  const entry = entries.get(windowId)
  if (!entry || entry.pending.length === 0) return
  const setters = entry.pending
  entry.pending = []
  for (const setter of setters) setter(outcome)
}
