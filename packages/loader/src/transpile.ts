import crypto from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript"

/**
 * Transpile a TypeScript configuration file into a cached JS module.
 *
 * The function computes a content hash and writes the transpiled output to
 * `.clibu/cache/<sha1>.mjs` (ESM) or `.cjs` (for `.cts`). If a cached file
 * already exists the path is returned unchanged.
 */
export function transpileTsConfig(filePath: string, cwd: string): string {
  const source = readFileSync(filePath, "utf8")
  const hash = crypto.createHash("sha1").update(source).digest("hex")
  const cacheDir = resolve(cwd, ".clibu/cache")
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true })
  const isCts = filePath.endsWith(".cts")
  const outFile = resolve(cacheDir, `${hash}.${isCts ? "cjs" : "mjs"}`)
  if (existsSync(outFile)) return outFile
  const moduleKind = isCts ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: moduleKind,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true
    },
    fileName: filePath
  })
  writeFileSync(outFile, transpiled.outputText, "utf8")
  return outFile
}
