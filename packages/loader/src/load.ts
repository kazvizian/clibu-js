import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import type { CLIConfig } from "@clibu/core"
import { pickExport } from "./pick"
import { transpileTsConfig } from "./transpile"

export async function loadConfig(cwd: string): Promise<CLIConfig | null> {
  const candidates = [
    "clibu.config.ts",
    "clibu.config.mts",
    "clibu.config.cts",
    "clibu.config.mjs",
    "clibu.config.js",
    "clibu.config.cjs",
    "clibu.config.json"
  ]
  for (const name of candidates) {
    const p = resolve(cwd, name)
    if (!existsSync(p)) continue
    if (p.endsWith(".json")) {
      const data = await import(pathToFileURL(p).href)
      const picked = pickExport(data)
      return picked as CLIConfig
    } else if (p.endsWith(".ts") || p.endsWith(".mts") || p.endsWith(".cts")) {
      const jsFile = transpileTsConfig(p, cwd)
      const mod = await import(pathToFileURL(jsFile).href)
      const picked = pickExport(mod)
      return picked as CLIConfig
    } else {
      const mod = await import(pathToFileURL(p).href)
      const picked = pickExport(mod)
      return picked as CLIConfig
    }
  }
  return null
}
