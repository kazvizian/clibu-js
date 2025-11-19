import { describe, expect, it } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { loadConfig, sampleConfigHint, transpileTsConfig } from "../src/index"

function makeTempDir(prefix = "clibu-loader-") {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  const cleanup = () => rmSync(dir, { recursive: true, force: true })
  return { dir, cleanup }
}

describe("@clibu/loader loadConfig", () => {
  it("returns null when no config exists", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      const cfg = await loadConfig(dir)
      expect(cfg).toBeNull()
    } finally {
      cleanup()
    }
  })

  it("loads TypeScript default export (clibu.config.ts)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.ts"),
        `export default {
          name: "mycli",
          version: "0.0.1",
          commands: {
            hello: { description: "say hi", run() { return "hi" } }
          }
        }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("mycli")
      expect(cfg.commands.hello.description).toBe("say hi")
    } finally {
      cleanup()
    }
  })

  it("loads TypeScript named export 'config' (clibu.config.mts)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.mts"),
        `export const config = {
          name: "mycli",
          commands: { a: { run() { return 1 } } }
        }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("mycli")
      expect(Object.keys(cfg.commands)).toContain("a")
    } finally {
      cleanup()
    }
  })

  it("loads CommonJS TypeScript (clibu.config.cts)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.cts"),
        `export default { name: "cts-cli", commands: { x: { run() { return 0 } } } }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("cts-cli")
    } finally {
      cleanup()
    }
  })

  it("loads ESM JavaScript (clibu.config.mjs)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.mjs"),
        `export default { name: "esm-cli", commands: { ok: { run(){ return true } } } }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("esm-cli")
    } finally {
      cleanup()
    }
  })

  it("loads CJS JavaScript (clibu.config.cjs)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.cjs"),
        `module.exports = { name: "cjs-cli", commands: { ok: { run(){ return true } } } }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("cjs-cli")
    } finally {
      cleanup()
    }
  })

  it("loads JS (clibu.config.js) with named export 'config'", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.js"),
        `exports.config = { name: "js-cli", commands: { ok: { run(){ return true } } } }`
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("js-cli")
    } finally {
      cleanup()
    }
  })

  it("loads JSON (clibu.config.json)", async () => {
    const { dir, cleanup } = makeTempDir()
    try {
      writeFileSync(
        join(dir, "clibu.config.json"),
        JSON.stringify({ name: "json-cli", commands: { ok: {} } }, null, 2)
      )
      const cfg = await loadConfig(dir)
      expect(cfg).not.toBeNull()
      if (cfg === null) throw new Error("expected config")
      expect(cfg.name).toBe("json-cli")
    } finally {
      cleanup()
    }
  })
})

describe("@clibu/loader transpileTsConfig cache", () => {
  it("reuses cache for unchanged content and changes on edit", () => {
    const { dir, cleanup } = makeTempDir()
    try {
      const file = resolve(dir, "clibu.config.ts")
      writeFileSync(file, `export default { name: "x", commands: {} }`)
      const out1 = transpileTsConfig(file, dir)
      const out2 = transpileTsConfig(file, dir)
      expect(out1).toBe(out2)
      const js1 = readFileSync(out1, "utf8")
      writeFileSync(file, `export default { name: "y", commands: {} }`)
      const out3 = transpileTsConfig(file, dir)
      expect(out3).not.toBe(out1)
      const js3 = readFileSync(out3, "utf8")
      expect(js1).not.toBe(js3)
    } finally {
      cleanup()
    }
  })

  it("emits cjs for .cts and esm for .ts/.mts", () => {
    const { dir, cleanup } = makeTempDir()
    try {
      const fileTs = resolve(dir, "clibu.config.ts")
      writeFileSync(fileTs, `export default {}`)
      const outTs = transpileTsConfig(fileTs, dir)
      expect(outTs.endsWith(".mjs")).toBe(true)

      const fileCts = resolve(dir, "clibu.config.cts")
      writeFileSync(fileCts, `export default {}`)
      const outCts = transpileTsConfig(fileCts, dir)
      expect(outCts.endsWith(".cjs")).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe("@clibu/loader sampleConfigHint", () => {
  it("contains guidance and example", () => {
    const hint = sampleConfigHint()
    expect(hint).toContain("No configuration file found.")
    expect(hint).toContain("clibu.config.ts")
    expect(hint).toContain("export default")
  })
})
