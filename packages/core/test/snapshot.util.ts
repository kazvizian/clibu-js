import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const SNAP_DIR = join(__dirname, "__snapshots__")

export interface SnapshotOptions {
  update?: boolean
}

export function matchSnapshot(
  name: string,
  content: string,
  opts: SnapshotOptions = {}
) {
  if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true })
  const file = join(SNAP_DIR, `${name}.snap`)
  if (!existsSync(file) || opts.update) {
    writeFileSync(file, content, "utf8")
    return { created: true }
  }
  const expected = readFileSync(file, "utf8")
  if (normalize(expected) !== normalize(content)) {
    throw new Error(`Snapshot mismatch: ${name}`)
  }
  return { created: false }
}

function normalize(s: string) {
  return s.replace(/\r\n?/g, "\n").trim()
}
